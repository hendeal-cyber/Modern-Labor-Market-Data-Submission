// Drink counting, manual adjust, water mode and the phone/HUD status
// (spec sections 2.4, 2.5, 6). Pure logic over a `game` object: nothing here
// touches the DOM, so it runs under `node --test` with a fake game.
//
// The impairment lane OWNS `session.players[i].drinks`; the engine owns
// `racesCompleted` (we never touch it).

import {
  estimateBAC, levelFor, tierIndex, TIER_LABELS, clamp, MAX_DRINKS, DEFAULT_LIMIT, BAC_BAR_MAX,
} from './bac.js';

export const DISCLAIMER = 'Tipsy Kart is just a game. Never drink and drive in real life.';
export const TOAST_TEXT = "Everyone's over the limit. Good luck.";
export const DEFAULT_SETTINGS = Object.freeze({
  intensity: 1.0, comfortVisuals: false, limitLine: DEFAULT_LIMIT, phoneSwim: true,
});

/** Tiny event bus (the engine's own game.on is not assumed to be re-usable for our events). */
export function createBus() {
  const m = new Map();
  return {
    on(evt, cb) {
      if (!m.has(evt)) m.set(evt, new Set());
      m.get(evt).add(cb);
      return () => m.get(evt).delete(cb);
    },
    emit(evt, payload) {
      const set = m.get(evt);
      if (!set) return;
      for (const cb of [...set]) {
        try { cb(payload); } catch (e) { if (typeof console !== 'undefined') console.error('[impairment]', evt, e); }
      }
    },
  };
}

function randomSeed() {
  return (Math.floor(Math.random() * 0x100000000)) >>> 0;
}

/** Fill in the session-level and per-player fields the impairment model needs. Never overwrites existing values. */
export function ensureSession(game) {
  const s = game && game.session;
  if (!s) return null;
  if (!Number.isFinite(s.seed)) s.seed = randomSeed();
  s.settings = Object.assign({}, DEFAULT_SETTINGS, s.settings || {});
  if (!Array.isArray(s.players)) s.players = [];
  for (const p of s.players) ensurePlayer(p);
  return s;
}

export function ensurePlayer(p) {
  if (!p) return p;
  if (!Number.isFinite(p.drinks)) p.drinks = 0;
  if (typeof p.water !== 'boolean') p.water = false;
  if (p.bodyKg === undefined) p.bodyKg = null;
  if (p.sex === undefined) p.sex = null;
  if (!Array.isArray(p.drinkLog)) p.drinkLog = [];
  if (!Number.isFinite(p.waters)) p.waters = 0;
  return p;
}

export function getPlayer(game, slot) {
  const ps = game && game.session && game.session.players;
  return Array.isArray(ps) ? ps.find((p) => p && p.slot === slot) || null : null;
}

function settingsOf(game) {
  return Object.assign({}, DEFAULT_SETTINGS, (game && game.session && game.session.settings) || {});
}

/**
 * Pure status for the phone and HUD. Safe to call every frame.
 * Returns {drinks, bac, level, tierLabel, limit, overLimit, ...extras}.
 * `bac` is always the honest estimate, also in water mode (gameplay level is 0
 * then, but alcohol already drunk does not vanish); `drinks` is kept.
 * `overLimit` is true when est. BAC >= limit line, or (not in water mode) when the
 * tier is "Over the limit" or worse (level >= 1.5), so the race-3 guarantee also
 * reads as over the limit for heavy players whose est. BAC is lower.
 */
export function getImpairmentStatus(slot, game = globalThis.window && globalThis.window.game, now = Date.now()) {
  const p = getPlayer(game, slot);
  const cfg = settingsOf(game);
  if (!p) {
    return {
      drinks: 0, bac: 0, level: 0, tierLabel: TIER_LABELS[0], limit: cfg.limitLine, overLimit: false,
      tier: 0, water: false, waters: 0, present: false,
    };
  }
  const level = levelFor(p, cfg.intensity);
  const bac = estimateBAC(p, now);
  const tier = tierIndex(level);
  return {
    drinks: Math.max(0, Math.floor(Number(p.drinks) || 0)),
    bac,
    level,
    tierLabel: TIER_LABELS[tier],
    limit: cfg.limitLine,
    overLimit: bac >= cfg.limitLine || (!p.water && level >= 1.5),
    tier,
    water: !!p.water,
    waters: p.waters || 0,
    present: true,
  };
}

/** HUD view-model (spec 6.1): mug/water icon, 0..0.20 bar fill, limit tick and colour. */
export function hudModel(slot, game = globalThis.window && globalThis.window.game, now = Date.now()) {
  const st = getImpairmentStatus(slot, game, now);
  const color = st.overLimit || st.bac >= st.limit ? 'red' : st.bac >= 0.03 ? 'amber' : 'green';
  return {
    icon: st.water ? 'water' : 'mug',
    count: st.water ? 0 : st.drinks,
    drinks: st.drinks,
    bacText: `est. BAC ${st.bac.toFixed(3)}%`,
    barFill: clamp(st.bac / BAC_BAR_MAX, 0, 1),
    limitTick: clamp(st.limit / BAC_BAR_MAX, 0, 1),
    color,
    tierLabel: st.tierLabel,
    overLimit: st.overLimit,
    water: st.water,
  };
}

/** Host-side +1/-1. Clamped to 0..15; +1 logs a timestamp, -1 pops the latest. Returns new drinks or null. */
export function adjustDrinks(slot, delta, game = globalThis.window && globalThis.window.game, now = Date.now()) {
  const p = ensurePlayer(getPlayer(game, slot));
  if (!p) return null;
  const target = clamp(Math.round(p.drinks + (Number(delta) || 0)), 0, MAX_DRINKS);
  while (p.drinks < target) { p.drinks++; p.drinkLog.push(now); }
  while (p.drinks > target) { p.drinks--; p.drinkLog.pop(); }
  announce(game);
  return p.drinks;
}

/** Water / designated-sober mode: no increments, L_target = 0. Drinks are kept and resume when switched off. */
export function setWaterMode(slot, on, game = globalThis.window && globalThis.window.game) {
  const p = ensurePlayer(getPlayer(game, slot));
  if (!p) return null;
  p.water = !!on;
  announce(game);
  return p.water;
}

/** Optional body weight (40..200 kg) and sex ('m'|'f'|null) for the display BAC and the level scale. */
export function setBody(slot, { bodyKg, sex } = {}, game = globalThis.window && globalThis.window.game) {
  const p = ensurePlayer(getPlayer(game, slot));
  if (!p) return null;
  if (bodyKg !== undefined) {
    const kg = Number(bodyKg);
    p.bodyKg = bodyKg === null || bodyKg === '' || !Number.isFinite(kg) ? null : clamp(Math.round(kg), 40, 200);
  }
  if (sex !== undefined) p.sex = sex === 'm' || sex === 'f' ? sex : null;
  announce(game);
  return { bodyKg: p.bodyKg, sex: p.sex };
}

/** Validated host settings update. */
export function setSettings(partial, game = globalThis.window && globalThis.window.game) {
  const s = ensureSession(game);
  if (!s) return null;
  const n = s.settings;
  if (partial && partial.intensity !== undefined && Number.isFinite(Number(partial.intensity))) {
    n.intensity = clamp(Number(partial.intensity), 0.3, 2);
  }
  if (partial && partial.limitLine !== undefined && Number.isFinite(Number(partial.limitLine))) {
    n.limitLine = clamp(Number(partial.limitLine), 0.02, 0.15);
  }
  if (partial && partial.comfortVisuals !== undefined) n.comfortVisuals = !!partial.comfortVisuals;
  if (partial && partial.phoneSwim !== undefined) n.phoneSwim = !!partial.phoneSwim;
  announce(game, 'settingsChanged');
  return n;
}

/** Explicit host "New night": the ONLY thing that resets drinks, drinkLog and the seed. */
export function newNight(game = globalThis.window && globalThis.window.game) {
  const s = ensureSession(game);
  if (!s) return null;
  for (const p of s.players) { p.drinks = 0; p.drinkLog = []; p.waters = 0; }
  s.seed = randomSeed();
  s._drinksAwardedFor = undefined;
  s._toastShown = false;
  announce(game);
  return s.seed;
}

/**
 * Mirror the display status onto each session player so the engine HUD and the
 * phone lane can read it without importing this module:
 *   p.bac (number, %), p.tierLabel, p.overLimit, p.impairLevel.
 */
export function syncPlayerStatus(game, now = Date.now()) {
  const s = game && game.session;
  if (!s || !Array.isArray(s.players)) return;
  for (const p of s.players) {
    if (!p) continue;
    const st = getImpairmentStatus(p.slot, game, now);
    p.bac = st.bac;
    p.tierLabel = st.tierLabel;
    p.overLimit = st.overLimit;
    p.impairLevel = st.level;
  }
}

function announce(game, evt = 'drinksChanged') {
  const s = game && game.session;
  if (!s) return;
  syncPlayerStatus(game);
  if (typeof game.refreshUI === 'function') { try { game.refreshUI(); } catch (e) { /* engine UI is optional */ } }
  const payload = evt === 'settingsChanged'
    ? Object.assign({}, s.settings)
    : (s.players || []).map((p) => ({ slot: p.slot, drinks: p.drinks, water: !!p.water }));
  const bus = game.impairment && game.impairment.bus;
  if (bus) bus.emit(evt, payload);
  if (typeof game.emit === 'function') { try { game.emit(evt, payload); } catch (e) { /* ignore */ } }
}

function isHumanResult(r) {
  if (!r || typeof r !== 'object') return false;
  if (r.isCpu === true || r.cpu === true || r.isBot === true || r.isHuman === false) return false;
  return Number.isInteger(r.slot) && r.slot >= 0 && r.slot <= 3;
}

/** Normalise the raceFinished payload (array of results, or {raceIndex, results}). */
function normaliseFinish(arg, game) {
  const s = game.session;
  let results = null;
  let raceIndex;
  if (Array.isArray(arg)) { results = arg; raceIndex = arg.raceIndex; } // engine: array with a .raceIndex property
  else if (arg && typeof arg === 'object') { results = arg.results || arg.standings || null; raceIndex = arg.raceIndex; }
  if (raceIndex === undefined) raceIndex = s.raceIndex;
  return { results, raceIndex };
}

/**
 * Wire drink counting into the engine's events. Returns a small API.
 *  - raceFinished: +1 drink for every HUMAN in the results (DNF included),
 *    +1 `waters` for water players, idempotent per race.
 *  - raceStart: re-arms the idempotency guard and fires the one-off
 *    "Everyone's over the limit" toast the first time any human has L >= 2.
 *  - cupFinished: does NOT reset anything.
 *  - playerJoined: fills defaults (a mid-cup joiner starts at 0 drinks).
 */
export function installDrinkTracking(game) {
  ensureSession(game);
  const bus = createBus();
  const api = {
    bus,
    on: bus.on,
    getImpairmentStatus: (slot, now) => getImpairmentStatus(slot, game, now),
    hudModel: (slot, now) => hudModel(slot, game, now),
    adjustDrinks: (slot, delta) => adjustDrinks(slot, delta, game),
    setWaterMode: (slot, on) => setWaterMode(slot, on, game),
    setBody: (slot, body) => setBody(slot, body, game),
    setSettings: (partial) => setSettings(partial, game),
    newNight: () => newNight(game),
    DISCLAIMER,
  };
  // Make the bus visible to announce() before anything fires.
  if (!game.impairment) game.impairment = api; else Object.assign(game.impairment, api);

  const sess = () => ensureSession(game);

  game.on('raceStart', () => {
    const s = sess();
    s._drinksAwardedFor = undefined; // a new race may award again
    if (!s._toastShown) {
      const any = s.players.some((p) => p.connected !== false
        && levelFor(p, s.settings.intensity) >= 2);
      if (any) {
        s._toastShown = true;
        bus.emit('toast', { text: TOAST_TEXT });
      }
    }
  });

  game.on('raceFinished', (arg) => {
    const s = sess();
    const { results, raceIndex } = normaliseFinish(arg, game);
    if (s._drinksAwardedFor !== undefined && s._drinksAwardedFor === raceIndex) return; // one award per race
    s._drinksAwardedFor = raceIndex;
    let slots = results && results.length ? results.filter(isHumanResult).map((r) => r.slot) : null;
    if (!slots) slots = s.players.filter((p) => p.connected !== false).map((p) => p.slot);
    const now = Date.now();
    const banner = [];
    for (const p of s.players) {
      if (!slots.includes(p.slot)) continue; // did not race: no drink
      ensurePlayer(p);
      if (p.water) { p.waters += 1; }
      else {
        p.drinks = Math.min(MAX_DRINKS, p.drinks + 1);
        p.drinkLog.push(now);
      }
      const st = getImpairmentStatus(p.slot, game, now);
      banner.push({
        slot: p.slot, name: p.name, water: !!p.water, drinks: p.drinks, bac: st.bac,
        tierLabel: st.tierLabel, overLimit: st.overLimit,
        text: p.water
          ? `${p.name || 'P' + (p.slot + 1)} +1 water`
          : `${p.name || 'P' + (p.slot + 1)} +1 -> ${p.drinks} drink${p.drinks === 1 ? '' : 's'} · est ${st.bac.toFixed(3)}%${st.overLimit ? ' · OVER THE LIMIT' : ''}`,
      });
    }
    announce(game);
    bus.emit('round', { raceIndex, lines: banner });
  });

  // cupFinished: deliberately nothing. Only newNight() resets drinks.
  game.on('cupFinished', () => {});

  game.on('playerJoined', () => { sess(); syncPlayerStatus(game); });
  game.on('playerLeft', () => { sess(); });
  syncPlayerStatus(game);

  return api;
}
