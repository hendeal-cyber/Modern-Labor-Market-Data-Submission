// Host bridge (phone-controls spec section 5): connects the big-screen page to net/hub.js.
// It owns NO rendering. It translates phone messages into window.game calls and pushes per-slot
// HUD state back to the phones.
//
// Game contract used (every optional piece is feature-detected):
//   game.addPlayer({slot,name,color}), game.removePlayer(slot)
//   game.setPlayerInput(slot,{steer,throttle,brake,drift,useItem})   RAW input, the game filters it
//   game.session.players[]           {slot,name,color,connected,racesCompleted,drinks}
//   game.on(evt, cb), game.emit?.(evt, payload)
//   game.getState()                  phase / positions / laps / items (shape probed, see readSlotHud)
//   game.getHud?.(slot)              optional {lap,laps,place,of,item}
//   getImpairmentStatus(slot) -> {drinks,bac,level 0..5,tierLabel,limit,overLimit}, adjustDrinks(slot, delta)
//     (impairment lane) looked up on game.impairment first, then on game itself, at call time
//     because the impairment plugin may install after this one

const STALE_MS = 250;     // silence longer than this makes the kart coast
const COAST_EASE_MS = 150; // steer eases to 0 over this long
const HUD_MS = 200;       // 5 Hz HUD pushes, only when changed
const FALLBACK_LABELS = ['Sober', 'Warm', 'Giggly', 'Wobbly', 'Legless'];
const BACKOFF = [250, 500, 1000, 2000];

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/** Normalise whatever phase names the engine uses to the five the phones understand. */
export function mapPhase(p) {
  const s = String(p == null ? '' : p).toLowerCase();
  if (!s) return null;
  if (/lobby|menu|title|select|wait|idle|setup/.test(s)) return 'lobby';
  if (/cup/.test(s) && /(result|finish|over|end|podium|win)/.test(s)) return 'cupResults';
  if (/podium|champ/.test(s)) return 'cupResults';
  if (/result|score|standing/.test(s)) return 'results';
  if (/count|grid|intro|prerace|pre-race|starting|321/.test(s)) return 'countdown';
  if (/finish|done|over|end/.test(s)) return 'finished';
  if (/rac|play|driv|run/.test(s)) return 'racing';
  return null;
}

export function initNetHost(game, opts = {}) {
  if (!game) throw new Error('net-host: window.game is required');
  const now = () => performance.now();
  const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
  const url = opts.url || `${proto}//${location.host}/ws`;

  if (!game.session) game.session = { raceIndex: 0, players: [] };
  const session = game.session;
  if (!Array.isArray(session.players)) session.players = [];

  // ---------------------------------------------------------------- per-slot bookkeeping
  const roster = new Map();        // slot -> latest roster entry from the server
  const added = new Set();         // slots we called game.addPlayer for
  const last = new Map();          // slot -> { m, at }
  const lastItem = new Map();      // slot -> last seen cumulative item counter
  const pendingUse = new Map();    // slot -> item presses not yet delivered to the game
  const coastFrom = new Map();     // slot -> timestamp when the kart started coasting
  const coastSent = new Map();     // slot -> last steer value we delivered while coasting
  const pushed = new Map();        // slot -> JSON of the last HUD state sent
  const lapSeen = new Map();
  const finishedSeen = new Set();
  const seeded = new Set();
  let lastAll = '';
  let lastCountdown = null;
  let ws = null; let attempt = 0; let timer = null; let open = false; let closed = false;
  let sessionId = null;

  const api = {
    roster: [],
    sessionId: null,
    connected: false,
    lastInput: (slot) => (last.get(slot) ? Object.assign({ ageMs: now() - last.get(slot).at }, last.get(slot).m) : null),
    rtt: (slot) => (roster.get(slot) ? roster.get(slot).rtt : null),
    transportBySlot: () => Object.fromEntries(Array.from(roster, ([s, p]) => [s, p.transport])),
    send: (obj) => send(obj),
    phase: () => currentPhase(),
    onRoster: [],               // callbacks for UI (join panel)
    kick: (slot) => send({ t: 'kick', slot }),
    vibe: (slot, cue) => send({ t: 'vibe', slot, cue }),
    toast: (slot, text, ms) => send({ t: 'toast', slot, text, ms }),
    close() { closed = true; clearTimeout(timer); if (ws) ws.close(); clearInterval(staleTimer); clearInterval(hudTimer); },
  };

  function send(obj) { if (ws && ws.readyState === 1) { ws.send(JSON.stringify(obj)); return true; } return false; }

  function refreshUi() { try { if (typeof game.refreshUI === 'function') game.refreshUI(); } catch (e) { /* ignore */ } }

  function emit(evt, payload) {
    try { if (typeof game.emit === 'function') game.emit(evt, payload); } catch (e) { console.error('[net-host] emit', evt, e); }
    try { window.dispatchEvent(new CustomEvent(`tipsy:${evt}`, { detail: payload })); } catch (e) { /* ignore */ }
  }

  // ---------------------------------------------------------------- session.players
  function findPlayer(slot, create) {
    let p = session.players.find((x) => x && x.slot === slot);
    if (!p) {
      const cand = session.players[slot];
      // an engine that pre-creates one entry per human slot, without a slot field yet
      if (cand && cand.slot === undefined && !cand.isCpu && !cand.cpu) { cand.slot = slot; p = cand; }
    }
    if (!p && create) {
      p = { slot, name: '', color: '#ffffff', connected: false, racesCompleted: 0, drinks: 0 };
      session.players.push(p);
    }
    return p || null;
  }

  function upsert(entry) {
    const p = findPlayer(entry.slot, true);
    p.name = entry.name; p.color = entry.color;
    if (entry.connected !== undefined) p.connected = !!entry.connected;
    return p;
  }

  function ensureKart(entry) {
    upsert(entry);
    if (added.has(entry.slot)) return;
    added.add(entry.slot);
    try { if (typeof game.addPlayer === 'function') game.addPlayer({ slot: entry.slot, name: entry.name, color: entry.color }); } catch (e) { console.error('[net-host] addPlayer', e); }
  }

  let dropping = -1;
  function dropKart(slot) {
    dropping = slot;
    added.delete(slot); last.delete(slot); lastItem.delete(slot); pendingUse.delete(slot); coastFrom.delete(slot); coastSent.delete(slot); pushed.delete(slot);
    lapSeen.delete(slot); finishedSeen.delete(slot); seeded.delete(slot); roster.delete(slot);
    try { if (typeof game.removePlayer === 'function') game.removePlayer(slot); } catch (e) { console.error('[net-host] removePlayer', e); }
    const i = session.players.findIndex((x) => x && x.slot === slot);
    if (i >= 0 && typeof game.removePlayer !== 'function') session.players.splice(i, 1);
    dropping = -1;
  }

  function setInput(slot, inp) {
    try { if (typeof game.setPlayerInput === 'function') game.setPlayerInput(slot, inp); } catch (e) { console.error('[net-host] setPlayerInput', e); }
  }

  // ---------------------------------------------------------------- phone input (2.4, 2.5)
  function onInput(m) {
    const slot = m.slot;
    if (!added.has(slot)) { // input before the roster arrived: create the kart from what we know
      const r = roster.get(slot);
      if (!r) return;
      ensureKart(r);
    }
    // cumulative ITEM counter -> exactly one useItem:true call per press (wrap-safe)
    if (!lastItem.has(slot)) lastItem.set(slot, m.item);
    const delta = (m.item - lastItem.get(slot)) >>> 0;
    if (delta > 0 && delta < 0x80000000) pendingUse.set(slot, Math.min(3, (pendingUse.get(slot) || 0) + delta));
    lastItem.set(slot, m.item);
    last.set(slot, { m, at: now() });
    coastFrom.delete(slot); coastSent.delete(slot);
    deliver(slot);
  }

  function deliver(slot) {
    const l = last.get(slot);
    if (!l) return;
    const pend = pendingUse.get(slot) || 0;
    const useItem = pend > 0;
    if (useItem) pendingUse.set(slot, pend - 1);
    setInput(slot, { steer: l.m.steer, throttle: l.m.throttle, brake: l.m.brake, drift: l.m.drift, useItem });
  }

  /** 50 ms: stale input coasts (throttle 0, steer eases to 0); queued item presses drain. */
  function staleCheck() {
    const t = now();
    for (const slot of added) {
      const l = last.get(slot);
      if (!l) continue;
      const startedAt = coastFrom.has(slot) ? coastFrom.get(slot) : l.at + STALE_MS;
      if (t < startedAt) {
        if (pendingUse.get(slot) > 0) deliver(slot);
        continue;
      }
      const f = clamp(1 - (t - startedAt) / COAST_EASE_MS, 0, 1);
      const steer = Math.round(l.m.steer * f * 100) / 100;
      if (coastSent.get(slot) === steer && steer === 0) continue; // already fully coasting
      coastSent.set(slot, steer);
      setInput(slot, { steer, throttle: 0, brake: 0, drift: false, useItem: false });
    }
  }

  function startCoast(slot) { if (!coastFrom.has(slot)) coastFrom.set(slot, now()); }

  // ---------------------------------------------------------------- server messages
  function onMessage(m) {
    switch (m.t) {
      case 'roster': onRoster(m); break;
      case 'joined': {
        const r = roster.get(m.slot) || {};
        const entry = Object.assign({}, r, { slot: m.slot, name: m.name, color: m.color, connected: true });
        roster.set(m.slot, entry);
        ensureKart(entry);
        const p = findPlayer(m.slot, true); p.connected = true; p.name = m.name; p.color = m.color;
        if (!m.resumed) { lastItem.set(m.slot, 0); pendingUse.delete(m.slot); }
        coastFrom.delete(m.slot);
        emit('playerJoined', { slot: m.slot, name: m.name, color: m.color, reconnected: !!m.resumed, player: p });
        refreshUi();
        pushHud(true);
        break;
      }
      case 'left': {
        startCoast(m.slot);
        const p = findPlayer(m.slot, false);
        if (p) p.connected = false;
        const r = roster.get(m.slot); if (r) r.connected = false;
        emit('playerLeft', { slot: m.slot, reason: m.reason, released: !!m.released });
        if (m.released) dropKart(m.slot);
        refreshUi();
        break;
      }
      case 'input': onInput(m); break;
      case 'drink': onDrink(m); break;
      case 'rename': {
        const p = findPlayer(m.slot, false); if (p) p.name = m.name;
        const r = roster.get(m.slot); if (r) r.name = m.name;
        emit('playerRenamed', { slot: m.slot, name: m.name });
        refreshUi();
        break;
      }
      case 'ready': {
        const r = roster.get(m.slot); if (r) r.ready = !!m.ready;
        const p = findPlayer(m.slot, false); if (p) p.ready = !!m.ready;
        emit('playerReady', { slot: m.slot, ready: !!m.ready });
        break;
      }
      case 'hostReplaced': closed = true; console.warn('[net-host] another host page took over'); break;
      default: break;
    }
  }

  function onRoster(m) {
    sessionId = m.sessionId; api.sessionId = sessionId;
    const slots = new Set();
    for (const e of m.players) {
      slots.add(e.slot);
      const had = roster.has(e.slot);
      roster.set(e.slot, e);
      ensureKart(e);
      const p = findPlayer(e.slot, true);
      p.connected = !!e.connected; p.name = e.name; p.color = e.color; p.ready = !!e.ready;
      if (!had && !e.connected) startCoast(e.slot);
      // a reloaded host page restores drinks from the server's cache
      if (!seeded.has(e.slot)) {
        seeded.add(e.slot);
        const d = e.lastState && Number(e.lastState.drinks);
        if (Number.isFinite(d) && d > (p.drinks || 0)) setDrinks(e.slot, d);
      }
    }
    for (const slot of Array.from(roster.keys())) if (!slots.has(slot)) { roster.delete(slot); if (added.has(slot)) dropKart(slot); }
    api.roster = m.players;
    for (const cb of api.onRoster) { try { cb(m); } catch (e) { console.error(e); } }
  }

  // ---------------------------------------------------------------- drinks
  function phaseNow() { return currentPhase(); }

  /** Impairment API method, resolved at call time: game.impairment.fn, else game.fn, else null. */
  function impFn(name) {
    const im = game.impairment;
    if (im && typeof im[name] === 'function') return im[name].bind(im);
    if (typeof game[name] === 'function') return game[name].bind(game);
    return null;
  }

  function setDrinks(slot, n) {
    const p = findPlayer(slot, true);
    const cur = Number(p.drinks) || 0;
    const adj = impFn('adjustDrinks');
    if (adj) { try { adj(slot, n - cur); } catch (e) { console.error(e); } } else p.drinks = n;
  }

  function onDrink(m) {
    const ph = phaseNow();
    if (ph === 'racing' || ph === 'countdown') return; // lobby / results only
    const p = findPlayer(m.slot, true);
    const cur = Number(p.drinks) || 0;
    const next = Math.max(0, cur + m.delta);
    if (next === cur) return;
    const adj = impFn('adjustDrinks');
    if (adj) { try { adj(m.slot, next - cur); } catch (e) { console.error(e); } } else p.drinks = next;
    emit('drinkChanged', { slot: m.slot, drinks: next, delta: next - cur });
    refreshUi();
    pushHud(true);
  }

  // ---------------------------------------------------------------- HUD out (5 Hz, only changes)
  function gameState() { try { return typeof game.getState === 'function' ? (game.getState() || {}) : {}; } catch (e) { return {}; } }

  /** Cheap: reads game.phase when the engine exposes it, else falls back to getState(). */
  function currentPhase() {
    if (typeof game.phase === 'string') return mapPhase(game.phase) || forced.phase || 'lobby';
    const st = gameState();
    return mapPhase(st.phase) || mapPhase(st.state) || forced.phase || 'lobby';
  }

  const forced = { phase: null }; // set by events when getState() has no usable phase

  /** Probe the shapes an engine plausibly returns for one human slot. */
  function readSlotHud(st, slot) {
    let h = null;
    try { if (typeof game.getHud === 'function') h = game.getHud(slot); } catch (e) { /* ignore */ }
    const pick = (c) => (Array.isArray(c) ? (c.find((x) => x && x.slot === slot) || null) : (c && typeof c === 'object' ? c[slot] || null : null));
    h = h || pick(st.hud) || pick(st.slots) || pick(st.players) || pick(st.karts) || pick(st.racers);
    const out = {};
    if (h) {
      const lap = h.lap != null ? h.lap : h.currentLap;
      if (lap != null) out.lap = Number(lap);
      const laps = h.laps != null ? h.laps : (h.totalLaps != null ? h.totalLaps : st.laps != null ? st.laps : st.totalLaps);
      if (laps != null) out.laps = Number(laps);
      const place = h.place != null ? h.place : (h.position != null ? h.position : h.rank);
      if (place != null) out.place = Number(place);
      const of = h.of != null ? h.of : h.totalKarts != null ? h.totalKarts : (st.racers != null && Array.isArray(st.racers) ? st.racers.length : st.fieldSize != null ? st.fieldSize : null);
      if (of != null) out.of = Number(of);
      const item = h.item != null ? h.item : (h.heldItem != null ? h.heldItem : null);
      if (item !== undefined) out.item = item && typeof item === 'object' ? (item.name || item.type || item.id || null) : item;
      if (h.finished != null) out.finished = !!h.finished;
    } else if (Array.isArray(st.positions)) { // positions: ordered list of slot ids or {slot}
      const idx = st.positions.findIndex((x) => (x && typeof x === 'object' ? x.slot : x) === slot);
      if (idx >= 0) { out.place = idx + 1; out.of = st.positions.length; }
      if (st.laps != null) out.laps = Number(st.laps);
    }
    return out;
  }

  function impairmentFor(slot, drinks) {
    let s = null;
    try { const f = impFn('getImpairmentStatus'); if (f) s = f(slot); } catch (e) { /* ignore */ }
    if (s && typeof s === 'object') {
      const lv = clamp((Number(s.level) || 0) / 5, 0, 1); // the impairment lane's level is 0..5
      return { drinks: s.drinks != null ? s.drinks : drinks, impair: { level: Math.round(lv * 100) / 100, label: s.tierLabel || FALLBACK_LABELS[Math.min(4, Math.floor(lv * 4.999))], over: !!s.overLimit } };
    }
    const lv = Math.min(1, drinks / 6);
    return { drinks, impair: { level: Math.round(lv * 100) / 100, label: FALLBACK_LABELS[Math.min(4, Math.floor(lv * 4.999))] } };
  }

  function pushHud(force, given) {
    if (!api.connected) return;
    // getState() is not free (standings, positions): skip it entirely while no phone is in the room
    const st = roster.size ? (given && typeof given === 'object' ? given : gameState()) : {};
    const phase = roster.size ? (mapPhase(st.phase) || mapPhase(st.state) || forced.phase || 'lobby') : currentPhase();
    const all = { phase };
    if (session.raceIndex != null) all.raceIndex = session.raceIndex;
    const allKey = JSON.stringify(all);
    if (force || allKey !== lastAll) { lastAll = allKey; send(Object.assign({ t: 'state', slot: 'all' }, all)); }

    // countdown ticks
    const cd = st.countdown != null ? Math.ceil(Number(st.countdown)) : null;
    if (cd !== null && Number.isFinite(cd) && cd !== lastCountdown && cd > 0 && phase === 'countdown') vibeAll('tick');
    lastCountdown = cd;

    for (const [slot] of roster) {
      const p = findPlayer(slot, true);
      const hud = readSlotHud(st, slot);
      const drinks = Math.max(0, Number(p.drinks) || 0);
      const imp = impairmentFor(slot, drinks);
      const s = Object.assign({}, hud, imp);
      delete s.finished;
      const key = JSON.stringify(s);
      if (force || pushed.get(slot) !== key) {
        // vibes derived from changes
        const prev = pushed.get(slot) ? JSON.parse(pushed.get(slot)) : null;
        if (prev && (imp.drinks > (prev.drinks || 0))) send({ t: 'vibe', slot, cue: 'drink' });
        pushed.set(slot, key);
        send(Object.assign({ t: 'state', slot }, s));
      }
      if (hud.lap != null && phase === 'racing') {
        const lp = lapSeen.get(slot);
        if (!engineSays.lap && lp != null && hud.lap > lp && !hud.finished) send({ t: 'vibe', slot, cue: 'lap' });
        lapSeen.set(slot, hud.lap);
      }
      if (hud.finished && !finishedSeen.has(slot)) { finishedSeen.add(slot); if (!engineSays.finish) send({ t: 'vibe', slot, cue: 'finish' }); }
      if (phase === 'lobby') { finishedSeen.delete(slot); lapSeen.delete(slot); }
    }
  }

  function vibeAll(cue) { send({ t: 'vibe', slot: 'all', cue }); }

  // ---------------------------------------------------------------- game events
  const on = typeof game.on === 'function' ? game.on.bind(game) : () => {};
  on('raceStart', () => { if (!mapPhase(gameState().phase)) forced.phase = 'racing'; vibeAll('go'); pushHud(true); });
  on('raceFinished', () => { if (!mapPhase(gameState().phase)) forced.phase = 'results'; pushHud(true); });
  on('cupFinished', () => { if (!mapPhase(gameState().phase)) forced.phase = 'cupResults'; pushHud(true); });
  on('stateChanged', (st) => pushHud(false, st));
  // The big screen removed a phone player itself (e.g. the lobby's remove button): free the slot on the hub too.
  on('playerLeft', (e) => {
    const slot = e && e.slot;
    if (!Number.isInteger(slot) || slot === dropping || !roster.has(slot)) return;
    if (!findPlayer(slot, false)) { send({ t: 'kick', slot }); added.delete(slot); }
  });
  // Engine haptics events (human slots only), mapped to phone cues. Feature-detected: an engine that
  // never emits them leaves the derived lap/finish vibes below in charge.
  const engineSays = { lap: false, finish: false };
  const vibeSlot = (slot, cue) => { if (Number.isInteger(slot) && roster.has(slot)) send({ t: 'vibe', slot, cue }); };
  on('hit', (e) => { if (e) vibeSlot(e.slot, e.kind === 'wall' || e.kind === 'kart' ? 'hitSoft' : 'hit'); });
  on('boost', (e) => { if (e) vibeSlot(e.slot, e.tier >= 1 && e.tier <= 3 ? `boost${e.tier}` : 'boost'); });
  on('itemUsed', (e) => { if (e) vibeSlot(e.slot, 'item'); });
  on('itemGot', (e) => { if (e) vibeSlot(e.slot, 'itemGot'); });
  on('lap', (e) => { if (e) { engineSays.lap = true; vibeSlot(e.slot, 'lap'); } });
  on('finish', (e) => { if (e) { engineSays.finish = true; finishedSeen.add(e.slot); vibeSlot(e.slot, 'finish'); } });

  // Impairment lane: momentary effects become a "woozy" cue on that phone (colour flash on iOS).
  // game.emit('impairmentEvent', {type, slot}) or, as a fallback, game.impairment.on('event', cb).
  const lastWoozy = new Map();
  const woozy = (e) => {
    if (!e || !Number.isInteger(e.slot)) return;
    const t = now();
    if (t - (lastWoozy.get(e.slot) || -1e9) < 150) return; // both sources may report the same moment
    lastWoozy.set(e.slot, t);
    vibeSlot(e.slot, 'woozy');
  };
  on('impairmentEvent', woozy);
  let impHooked = false;
  function hookImpairment() {
    if (impHooked) return;
    const imp = game.impairment;
    if (imp && typeof imp.on === 'function') { impHooked = true; try { imp.on('event', woozy); } catch (e) { /* ignore */ } }
  }
  // drink count / tipsy meter refresh right away instead of on the next 5 Hz tick
  on('drinksChanged', () => pushHud(false));

  // ---------------------------------------------------------------- socket
  function connect() {
    if (closed) return;
    try { ws = new WebSocket(url); } catch (e) { schedule(); return; }
    ws.onopen = () => { open = true; ws.send(JSON.stringify({ t: 'hello', v: 1, role: 'host' })); };
    ws.onmessage = (ev) => {
      let m; try { m = JSON.parse(ev.data); } catch (e) { return; }
      if (m.t === 'roster' && !api.connected) { api.connected = true; attempt = 0; onMessage(m); pushHud(true); return; }
      onMessage(m);
    };
    ws.onclose = (ev) => {
      open = false; api.connected = false;
      // whatever was driving the karts is gone: let them coast until the roster says otherwise
      for (const slot of added) startCoast(slot);
      if (ev.code === 4004 || ev.code === 4005) { closed = true; return; }
      schedule();
    };
    ws.onerror = () => {};
  }
  function schedule() { if (closed) return; clearTimeout(timer); timer = setTimeout(connect, BACKOFF[Math.min(attempt++, BACKOFF.length - 1)]); }

  const staleTimer = setInterval(staleCheck, 50);
  const hudTimer = setInterval(() => { hookImpairment(); pushHud(false); }, HUD_MS); // the impairment plugin may load after us
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && !open) { clearTimeout(timer); attempt = 0; connect(); } });
  connect();

  window.tipsyNet = api;
  return api;
}
