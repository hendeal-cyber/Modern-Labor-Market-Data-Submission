// Game orchestrator: session/cup state, the public window.game API, the
// fixed-step simulation loop and wiring between race, views, UI and audio.
import * as THREE from 'three';
import { TRACKS } from './tracks.js';
import { Track } from './track.js';
import { Kart } from './kart.js';
import { Race } from './race.js';
import { AIDriver } from './ai.js';
import { TrackView } from './trackView.js';
import { ItemsView } from './itemsView.js';
import { KartModel } from './kartModel.js';
import { Viewports, ordinal } from './viewports.js';
import { Keyboard } from './input.js';
import { Audio } from './audio.js';
import { UI } from './ui.js';

export const MAX_HUMANS = 4;
export const GRID_SIZE = 8;
export const POINTS = [15, 12, 10, 8, 6, 4, 2, 1];
export const PLAYER_COLORS = ['#ff5a3c', '#3ca0ff', '#3cd46a', '#ffd23c'];
const CPU_ROSTER = [
  { name: 'Fizzwick', color: '#ff7ad9' },
  { name: 'Lady Lager', color: '#b46bff' },
  { name: 'Barrel Bob', color: '#a0703c' },
  { name: 'Captain Cask', color: '#3ce0d0' },
  { name: 'Mo Mojito', color: '#8ce05a' },
  { name: 'Sir Spritz', color: '#ff9a3c' },
  { name: 'Dizzy Dee', color: '#e8e8f0' },
  { name: 'Hops McGee', color: '#5a6cff' },
];
const FIXED_DT = 1 / 120;
const NEUTRAL = Object.freeze({ steer: 0, throttle: 0, brake: 0, drift: false, useItem: false });
const identity = (input) => input;
const noFx = () => ({ blurPx: 0, swayDeg: 0, doubleVision: 0, tunnel: 0, hueShift: 0 });

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

function sanitizeInput(i, fallback = NEUTRAL) {
  if (!i || typeof i !== 'object') return { ...fallback };
  const num = (v, d) => (Number.isFinite(+v) ? +v : d);
  return {
    steer: clamp(num(i.steer, 0), -1, 1),
    throttle: clamp(num(i.throttle, 0), 0, 1),
    brake: clamp(num(i.brake, 0), 0, 1),
    drift: !!i.drift,
    useItem: !!i.useItem,
  };
}

function cssColor(c, fallback) {
  if (typeof c === 'number') return '#' + new THREE.Color(c).getHexString();
  if (typeof c === 'string' && c.trim()) {
    try { return '#' + new THREE.Color(c.trim()).getHexString(); } catch (e) { /* fall through */ }
  }
  return fallback;
}

export class Game {
  constructor(root) {
    this.root = root;
    this._handlers = new Map();
    this._lastEmit = new Map();
    this.ready = false;
    this.version = '1.0.0';

    // --- contract surface ---
    this.inputFilters = [identity, identity, identity, identity];
    this.visualFx = [noFx, noFx, noFx, noFx];
    this.session = { raceIndex: 0, totalRaces: 4, laps: 3, players: [] };
    this.settings = { races: 4, laps: 3, cpuCount: 'auto' };

    this.phase = 'lobby';            // lobby | countdown | racing | raceResults | cupResults
    this.rawInputs = [null, null, null, null];
    this.itemLatch = [false, false, false, false];
    this.lastRawItem = [false, false, false, false];
    this.cupPoints = new Map();      // racerId -> points
    this.cupRacers = new Map();      // racerId -> {id,name,color,isHuman,slot}
    this.cpuRoster = [];
    this.lastResults = null;
    this.standings = null;
    this.simTime = 0;
    this.timeScale = 1;
    this.race = null;
    this._warned = new Set();
    this._stateSig = '';
    this._stateTimer = 0;

    this.keyboard = new Keyboard();
    this.audio = new Audio();
    this.viewports = new Viewports(root.querySelector('#viewports'), root.querySelector('#minimap'));
    this.ui = new UI(this, root);

    this.debug = {
      autopilot: (slot, on = true) => this.setAutopilot(slot, on),
      setTimeScale: (s) => { this.timeScale = clamp(+s || 1, 0.1, 8); },
      karts: () => (this.race ? this.race.karts.map((k) => this.kartSummary(k)) : []),
      race: () => this.race,
    };
    this._autopilot = [false, false, false, false];

    this._last = performance.now();
    this._acc = 0;
    this._frame = this._frame.bind(this);
    requestAnimationFrame(this._frame);
  }

  // ------------------------------------------------------------------ events
  on(evt, cb) {
    if (!this._handlers.has(evt)) this._handlers.set(evt, new Set());
    this._handlers.get(evt).add(cb);
    return () => this.off(evt, cb);
  }

  off(evt, cb) { this._handlers.get(evt)?.delete(cb); }

  emit(evt, payload) {
    // playerJoined/playerLeft may be emitted both by add/removePlayer and by the
    // network layer; collapse identical back-to-back emissions for the same slot.
    if (evt === 'playerJoined' || evt === 'playerLeft') {
      const key = evt + ':' + (payload && payload.slot);
      const now = performance.now();
      if (now - (this._lastEmit.get(key) || -1e9) < 250) return;
      this._lastEmit.set(key, now);
    }
    const hs = this._handlers.get(evt);
    if (!hs) return;
    for (const cb of [...hs]) {
      try { cb(payload); } catch (e) { console.error(`[tipsy-kart] '${evt}' handler failed:`, e); }
    }
  }

  warnOnce(key, err) {
    if (this._warned.has(key)) return;
    this._warned.add(key);
    console.warn(`[tipsy-kart] ${key} threw; using defaults.`, err);
  }

  // ----------------------------------------------------------------- players
  player(slot) { return this.session.players.find((p) => p.slot === slot) || null; }

  addPlayer({ slot, name, color } = {}) {
    if (slot === undefined || slot === null) {
      for (let s = 0; s < MAX_HUMANS; s++) if (!this.player(s)) { slot = s; break; }
    }
    slot = Number(slot);
    if (!Number.isInteger(slot) || slot < 0 || slot >= MAX_HUMANS) return null;
    let p = this.player(slot);
    const cleanName = String(name || '').trim().slice(0, 16) || `Player ${slot + 1}`;
    if (p) {
      p.name = name ? cleanName : p.name;
      p.color = cssColor(color, p.color);
      p.connected = true;
    } else {
      p = { slot, name: cleanName, color: cssColor(color, PLAYER_COLORS[slot]), connected: true, racesCompleted: 0, drinks: 0 };
      this.session.players.push(p);
      this.session.players.sort((a, b) => a.slot - b.slot);
    }
    // keep kart name/colour in sync if racing
    const k = this.race?.karts.find((kk) => kk.isHuman && kk.slot === slot);
    if (k) k.name = p.name;
    this.emit('playerJoined', { ...p });
    this.ui.renderLobby();
    this.emitState(true);
    return { ...p };
  }

  removePlayer(slot) {
    const p = this.player(slot);
    if (!p) return false;
    if (this.phase === 'lobby') {
      this.session.players = this.session.players.filter((pp) => pp.slot !== slot);
    } else {
      p.connected = false;
    }
    this.rawInputs[slot] = null;
    this.emit('playerLeft', { slot, name: p.name });
    this.ui.renderLobby();
    this.emitState(true);
    return true;
  }

  /** Re-render lobby/results after external changes (e.g. drinks updated later). */
  refreshUI() {
    this.ui.renderLobby();
    if (this.phase === 'raceResults' && this.lastResults) {
      this.ui.showResults(this.lastResults, { raceIndex: this.session.raceIndex, totalRaces: this.session.totalRaces, trackName: TRACKS[this.session.raceIndex % TRACKS.length].name });
    } else if (this.phase === 'cupResults' && this.standings) {
      this.ui.showStandings(this.standings);
    }
    this.emitState(true);
  }

  addTestPlayer() {
    for (let s = 0; s < MAX_HUMANS; s++) {
      if (!this.player(s)) return this.addPlayer({ slot: s, name: `Test ${s + 1}` });
    }
    return null;
  }

  setPlayerInput(slot, input) {
    if (!(slot >= 0 && slot < MAX_HUMANS)) return;
    const clean = sanitizeInput(input);
    if (clean.useItem && !this.lastRawItem[slot]) this.itemLatch[slot] = true; // rising edge
    this.lastRawItem[slot] = clean.useItem;
    this.rawInputs[slot] = clean;
  }

  setAutopilot(slot, on) {
    this._autopilot[slot] = !!on;
    if (this.race) {
      const k = this.race.karts.find((kk) => kk.isHuman && kk.slot === slot);
      if (k) k.autopilot = !!on || k.finished;
    }
  }

  // --------------------------------------------------------------- cup flow
  startCup(opts = {}) {
    Object.assign(this.settings, opts);
    this.audio.unlock();
    if (!this.session.players.length) this.addPlayer({ slot: 0, name: 'Player 1' });
    this.session.totalRaces = clamp(parseInt(this.settings.races, 10) || 4, 1, 8);
    this.session.laps = clamp(parseInt(this.settings.laps, 10) || 3, 1, 9);
    this.session.raceIndex = 0;
    this.cupPoints = new Map();
    this.cupRacers = new Map();
    this.lastResults = null;
    this.standings = null;
    // shuffle CPU roster once per cup, with skill spread
    const pool = CPU_ROSTER.slice();
    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
    this.cpuRoster = pool.map((c, i) => ({ ...c, id: 'cpu' + i, skill: 0.95 - (i % 7) * 0.012 }));
    this.startRace();
    return true;
  }

  nextRace() {
    if (this.phase === 'raceResults') {
      if (this.session.raceIndex + 1 < this.session.totalRaces) {
        this.session.raceIndex++;
        this.startRace();
      } else {
        this.finishCup();
      }
    } else if (this.phase === 'cupResults') {
      this.toLobby();
    }
    return this.phase;
  }

  toLobby() {
    this.disposeRace();
    this.phase = 'lobby';
    this.audio.stopAllEngines();
    this.ui.show('lobby');
    this.ui.renderLobby();
    this.emit('stateChanged', this.getState());
  }

  humansForRace() {
    return this.session.players.slice().sort((a, b) => a.slot - b.slot);
  }

  startRace() {
    this.disposeRace();
    const ri = this.session.raceIndex;
    const def = TRACKS[ri % TRACKS.length];
    const track = new Track(def);
    const humans = this.humansForRace();
    const auto = this.settings.cpuCount === 'auto' || this.settings.cpuCount === undefined;
    const cpuN = clamp(auto ? GRID_SIZE - humans.length : parseInt(this.settings.cpuCount, 10) || 0, 0, GRID_SIZE - humans.length);

    const racers = [];
    for (const p of humans) {
      racers.push(new Kart({ id: 'p' + p.slot, name: p.name, color: new THREE.Color(p.color).getHex(), isHuman: true, slot: p.slot, skill: 1 }));
    }
    for (let i = 0; i < cpuN; i++) {
      const c = this.cpuRoster[i % this.cpuRoster.length];
      racers.push(new Kart({ id: c.id, name: c.name, color: new THREE.Color(c.color).getHex(), isHuman: false, slot: null, skill: c.skill }));
    }
    for (const k of racers) {
      if (!this.cupRacers.has(k.id)) {
        this.cupRacers.set(k.id, { id: k.id, name: k.name, color: '#' + new THREE.Color(k.color).getHexString(), isHuman: k.isHuman, slot: k.slot });
        this.cupPoints.set(k.id, 0);
      }
      this.cupRacers.get(k.id).name = k.name;
    }
    // grid: first race CPUs in front; afterwards the points leader starts last
    let grid;
    if (ri === 0) grid = racers.filter((k) => !k.isHuman).concat(racers.filter((k) => k.isHuman));
    else grid = racers.slice().sort((a, b) => (this.cupPoints.get(a.id) || 0) - (this.cupPoints.get(b.id) || 0));

    this.track = track;
    this.race = new Race({ track, karts: grid, laps: this.session.laps });
    this.ais = new Map();
    this.autoDrivers = new Map();
    grid.forEach((k, i) => {
      if (!k.isHuman) this.ais.set(k, new AIDriver(k, i * 37.7 + ri * 11 + 5));
      else {
        this.autoDrivers.set(k, new AIDriver(k, 99 + k.slot));
        k.autopilot = !!this._autopilot[k.slot];
      }
    });
    this.kartBySlot = new Map(grid.filter((k) => k.isHuman).map((k) => [k.slot, k]));
    this.trackView = new TrackView(track);
    this.itemsView = new ItemsView(this.race);
    this.kartModels = grid.map((k) => new KartModel(k, { isHuman: k.isHuman }));
    this.ui.show('race');
    this.viewports.setup(humans.map((p) => p.slot), this.session.players);
    this.viewports.setWorld({ trackView: this.trackView, itemsView: this.itemsView, kartModels: this.kartModels, track });
    this.ui.raceBanner(`Race ${ri + 1}/${this.session.totalRaces}`, def.name);
    this.itemLatch.fill(false);
    this.phase = 'countdown';
    this._acc = 0;
    this.emit('raceStart', {
      raceIndex: ri,
      totalRaces: this.session.totalRaces,
      laps: this.session.laps,
      track: { id: def.id, name: def.name },
      karts: grid.map((k) => ({ id: k.id, name: k.name, isHuman: k.isHuman, slot: k.slot })),
    });
    this.emitState(true);
  }

  disposeRace() {
    if (!this.race) return;
    this.trackView?.dispose();
    this.itemsView?.dispose();
    this.kartModels?.forEach((m) => m.dispose());
    this.viewports.dispose();
    this.race = null;
    this.track = null;
  }

  finishRace() {
    const race = this.race;
    const results = race.results(POINTS);
    for (const r of results) this.cupPoints.set(r.id, (this.cupPoints.get(r.id) || 0) + r.points);
    for (const r of results) {
      r.totalPoints = this.cupPoints.get(r.id);
      if (r.isHuman) {
        const p = this.player(r.slot);
        if (p) p.racesCompleted = (p.racesCompleted || 0) + 1;
      }
    }
    results.raceIndex = this.session.raceIndex;
    this.lastResults = results;
    this.phase = 'raceResults';
    this.audio.stopAllEngines();
    this.emit('raceFinished', results);
    this.ui.showResults(results, { raceIndex: this.session.raceIndex, totalRaces: this.session.totalRaces, trackName: race.track.def.name });
    this.emitState(true);
    return results;
  }

  computeStandings() {
    const list = [...this.cupRacers.values()].map((r) => ({ ...r, points: this.cupPoints.get(r.id) || 0 }));
    list.sort((a, b) => b.points - a.points || (a.isHuman === b.isHuman ? 0 : a.isHuman ? -1 : 1));
    list.forEach((r, i) => { r.rank = i + 1; });
    return list;
  }

  finishCup() {
    this.standings = this.computeStandings();
    this.phase = 'cupResults';
    this.disposeRace();
    this.emit('cupFinished', this.standings);
    this.ui.showStandings(this.standings);
    this.emitState(true);
  }

  debugFinishRace() {
    if (!this.race || (this.phase !== 'countdown' && this.phase !== 'racing')) return null;
    this.race.forceFinish();
    return this.finishRace();
  }

  // ---------------------------------------------------------------- state
  kartSummary(k) {
    const L = this.race ? this.race.track.length : 1;
    return {
      id: k.id, name: k.name, isHuman: k.isHuman, slot: k.slot,
      place: k.place,
      lap: Math.min(this.race ? this.race.laps : 3, Math.max(1, k.lapsDone + 1)),
      progress: +k.progress.toFixed(2),
      lapProgress: +(k.progress / L).toFixed(4),
      finished: k.finished,
      speed: +(k.speed * 3.6).toFixed(1),
      item: k.itemRoll > 0 ? 'rolling' : k.item,
      x: +k.x.toFixed(2), z: +k.z.toFixed(2),
    };
  }

  getState() {
    const race = this.race;
    const hud = [];
    const players = this.session.players.map((p) => {
      const out = { ...p };
      const k = this.kartBySlot && race ? this.kartBySlot.get(p.slot) : null;
      if (k) {
        const h = {
          slot: p.slot,
          place: k.place,
          lap: Math.min(race.laps, Math.max(1, k.lapsDone + 1)),
          totalLaps: race.laps,
          item: k.itemRoll > 0 ? 'rolling' : k.item,
          finished: k.finished,
          speed: Math.round(k.speed * 3.6),
          wrongWay: k.wrongWay,
          drifting: k.drifting,
          driftTier: k.driftTier,
          boosting: k.boostTime > 0,
          totalKarts: race.karts.length,
        };
        hud.push(h);
        Object.assign(out, { place: h.place, lap: h.lap, totalLaps: h.totalLaps, item: h.item, finished: h.finished, speed: h.speed });
      }
      return out;
    });
    return {
      phase: this.phase,
      raceIndex: this.session.raceIndex,
      totalRaces: this.session.totalRaces,
      laps: this.session.laps,
      track: race ? { id: race.track.def.id, name: race.track.def.name } : null,
      countdown: race && race.phase === 'countdown' ? race.countdownValue : -1,
      raceTime: race ? +race.time.toFixed(2) : 0,
      players,
      hud,
      positions: race ? race.ordered.map((k) => this.kartSummary(k)) : [],
      standings: this.computeStandings().map(({ id, name, color, isHuman, slot, points, rank }) => ({ id, name, color, isHuman, slot, points, rank })),
      lastResults: this.lastResults ? this.lastResults.map((r) => ({ ...r })) : null,
    };
  }

  /** Emit stateChanged when the phone-relevant summary changed (throttled). */
  emitState(force = false) {
    const st = this.getState();
    const sig = JSON.stringify([st.phase, st.countdown, st.raceIndex, st.players.map((p) => [p.slot, p.name, p.connected, p.drinks, p.place, p.lap, p.item, p.finished])]);
    if (!force && sig === this._stateSig) return;
    this._stateSig = sig;
    this.emit('stateChanged', st);
  }

  // ---------------------------------------------------------------- loop
  _humanInput(k, dt) {
    const slot = k.slot;
    if (k.finished || (k.autopilot && !this._autopilot[slot])) {
      k.autopilot = true;
      return this.autoDrivers.get(k).update(dt, this.race);
    }
    let raw;
    if (this._autopilot[slot]) raw = sanitizeInput(this.autoDrivers.get(k).update(dt, this.race));
    else {
      const kb = this.keyboard.inputFor(slot);
      raw = kb ? sanitizeInput(kb) : this.rawInputs[slot] ? { ...this.rawInputs[slot] } : { ...NEUTRAL };
      if (this.itemLatch[slot]) {
        // a press arrived since the last step: guarantee the race sees a rising edge
        raw.useItem = true;
        this.itemLatch[slot] = false;
        k.lastItemPressed = false;
      }
    }
    const p = this.player(slot);
    const ctx = k._filterCtx || (k._filterCtx = { kartState: {} });
    ctx.time = this.simTime;
    ctx.speed = k.speed;
    ctx.drinks = p ? p.drinks || 0 : 0;
    ctx.raceIndex = this.session.raceIndex;
    ctx.slot = slot;
    const ks = ctx.kartState;
    ks.speed = k.speed; ks.maxSpeed = 33; ks.drifting = k.drifting; ks.driftTier = k.driftTier;
    ks.boosting = k.boostTime > 0; ks.offroad = k.q.offroad; ks.spinning = k.spinTime > 0;
    ks.place = k.place; ks.lap = k.lapsDone + 1; ks.item = k.item; ks.finished = k.finished;
    ks.wrongWay = k.wrongWay; ks.heading = k.h; ks.grounded = k.grounded; ks.racePhase = this.race.phase;
    const f = this.inputFilters[slot];
    if (typeof f === 'function' && f !== identity) {
      try {
        const out = f({ ...raw }, dt, ctx);
        return sanitizeInput(out, raw);
      } catch (e) {
        this.warnOnce('inputFilters[' + slot + ']', e);
      }
    }
    return raw;
  }

  _frame(now) {
    requestAnimationFrame(this._frame);
    const realDt = Math.min(0.1, (now - this._last) / 1000);
    this._last = now;
    if (!this.race || (this.phase !== 'countdown' && this.phase !== 'racing')) return;
    const dt = realDt * this.timeScale;
    this._acc += dt;
    let steps = 0;
    const getInput = (k, sdt) => (k.isHuman ? this._humanInput(k, sdt) : this.ais.get(k).update(sdt, this.race));
    const maxSteps = Math.ceil(12 * this.timeScale);
    while (this._acc >= FIXED_DT && steps < maxSteps) {
      this.race.step(FIXED_DT, getInput);
      this.simTime += FIXED_DT;
      this._acc -= FIXED_DT;
      steps++;
      if (this.race.phase === 'done') break;
    }
    if (steps >= maxSteps) this._acc = 0;
    const race = this.race;
    if (race.phase === 'racing' && this.phase === 'countdown') {
      this.phase = 'racing';
      this.emitState(true);
    }
    this.handleEvents();
    if (race.phase === 'done') {
      this.finishRace();
      return;
    }

    // render
    const t = this.simTime;
    this.trackView.update(dt, t);
    this.itemsView.update(dt, t);
    for (const m of this.kartModels) m.update(dt, t);
    this.viewports.render({
      race,
      now: t,
      dt,
      kartBySlot: this.kartBySlot,
      visualFx: this.visualFx,
      session: this.session,
      raceIndex: this.session.raceIndex,
      drinksOf: (slot) => this.player(slot)?.drinks || 0,
      warnOnce: (k, e) => this.warnOnce(k, e),
    });
    this.audio.updateEngines(race.karts.filter((k) => k.isHuman));
    this._stateTimer -= realDt;
    if (this._stateTimer <= 0) { this._stateTimer = 0.25; this.emitState(); }
  }

  handleEvents() {
    const race = this.race;
    const viewOf = (k) => k && k.isHuman ? this.viewports.views.find((v) => v.slot === k.slot) : null;
    const now = this.simTime;
    for (const e of race.events) {
      const v = viewOf(e.kart);
      switch (e.type) {
        case 'count': this.audio.sfx('count'); this.emitState(true); break;
        case 'go': this.audio.sfx('go'); this.emitState(true); break;
        case 'lap': if (v) { v.flash(`LAP ${e.kart.lapsDone + 1}`, 1.5, 'lap', now); this.audio.sfx('lap'); } break;
        case 'finalLap': if (v) { v.flash('FINAL LAP!', 2, 'final', now); this.audio.sfx('finalLap'); } break;
        case 'finish': if (e.kart.isHuman) { this.audio.sfx('finish'); this.emitState(true); } break;
        case 'box': if (v) this.audio.sfx('box'); break;
        case 'itemReady': if (v) this.audio.sfx('itemReady'); break;
        case 'pad': if (v) this.audio.sfx('pad'); break;
        case 'useItem': if (v) this.audio.sfx(e.item === 'bouncer' ? 'throw' : e.item === 'slick' ? 'splat' : 'click'); break;
        case 'hit': if (v) { v.flash(e.by === 'slick' ? 'STICKY!' : 'CORKED!', 1.2, 'hit', now); this.audio.sfx('spin'); } break;
        case 'blocked': if (v) { v.flash('BLOCKED!', 1, 'lap', now); } break;
        default: break;
      }
    }
    race.events.length = 0;
    for (const k of race.karts) {
      if (k.events.length && k.isHuman) {
        for (const e of k.events) {
          if (e === 'boost' || e === 'hop' || e === 'bump' || e === 'shieldPop' || e === 'respawn' || e.startsWith('tier')) this.audio.sfx(e);
        }
      }
      k.events.length = 0;
    }
  }
}

export { ordinal };
