// Per-slot impairment input filter + visual effects (spec section 5.3).
// Pure ES module: no DOM, no wall-clock reads inside filter(), so output is
// deterministic for a given (session seed, slot, race serial, input sequence).
//
//   const imp = createImpairment(slot, game, { onEvent });
//   game.inputFilters[slot] = imp.filter;   // (rawInput, dt, ctx) -> input
//   game.visualFx[slot]     = imp.visual;   // (t?, vp?) -> fx object

import { paramsAt, LAPSE_JITTER_S, INVERT_JITTER_S } from './params.js';
import { OU, slotStreams } from './rng.js';
import { levelFor } from './bac.js';
import { InputRing } from './ring.js';
import { computeVisualFx, REFERENCE_VIEWPORT } from './visual.js';

const clamp = (x, lo, hi) => (x < lo ? lo : x > hi ? hi : x);
const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
const fin = (v, d = 0) => (typeof v === 'number' && Number.isFinite(v) ? v : d);

const NEUTRAL_INPUT = () => ({ steer: 0, throttle: 0, brake: 0, drift: false, useItem: false });

/** Coerce any garbage into a valid input object (NaN -> 0, ranges clamped). */
export function sanitize(raw) {
  if (!raw || typeof raw !== 'object') return NEUTRAL_INPUT();
  return {
    steer: clamp(fin(raw.steer), -1, 1),
    throttle: clamp01(fin(raw.throttle)),
    brake: clamp01(fin(raw.brake)),
    drift: !!raw.drift,
    useItem: !!raw.useItem,
  };
}

function isClean(r) {
  return !!r && typeof r === 'object'
    && typeof r.steer === 'number' && r.steer >= -1 && r.steer <= 1
    && typeof r.throttle === 'number' && r.throttle >= 0 && r.throttle <= 1
    && typeof r.brake === 'number' && r.brake >= 0 && r.brake <= 1
    && typeof r.drift === 'boolean' && typeof r.useItem === 'boolean';
}

/** sign(s) * max(0, |s| - dz) / (1 - dz): deadzone that keeps full range. */
export function applyDeadzone(s, dz) {
  if (dz <= 0) return s;
  const a = Math.abs(s);
  return a <= dz ? 0 : Math.sign(s) * (a - dz) / (1 - dz);
}

/** 1 -> -1 -> 1 cosine cross-fade (150 ms in/out) while an inversion is active. */
export function invertMul(st) {
  if (st.invStart < 0 || st.t < st.invStart || st.t >= st.invEnd) return 1;
  const u = Math.min(1, (st.t - st.invStart) / 0.15, (st.invEnd - st.t) / 0.15);
  return Math.cos(Math.PI * u);
}

function freshDynamicState() {
  return {
    t: 0,
    sinceGo: 0, sinceRespawn: 99, slowFor: 0, lastEventT: -99, prevSpd: 0,
    y: 0, v: 0, thr: 0, brk: 0, heldSteer: 0, heldThr: 0, heldBrk: 0,
    prevDrift: false, driftDropped: false, driftPressT: 0,
    prevItem: false, itemFireAt: null, itemUntil: 0, itemActive: false,
    lapseStart: -1, lapseUntil: -1, invStart: -1, invEnd: -1,
    hicStart: -1, hicSign: 1,
    lastEvent: null,
    lastCtxTime: NaN, // ctx.time of the latest filter() call (engine sim clock)
  };
}

export function createImpairment(slot, game, opts = {}) {
  const onEvent = opts.onEvent || null;
  const ring = new InputRing(512);
  const st = Object.assign(freshDynamicState(), {
    Ls: 0, race: null, rng: null, phases: new Array(8).fill(0), leanSign: 1,
  });
  const ouF = new OU(), ouS = new OU(), ouT = new OU();

  function emitPhone(type) {
    st.lastEvent = { type, t: st.t };
    if (!onEvent) return;
    try { onEvent({ type, slot }); } catch (e) { /* never let UI errors reach the game loop */ }
  }

  function playerOf() {
    const ps = game && game.session && game.session.players;
    return Array.isArray(ps) ? ps.find((q) => q && q.slot === slot) : undefined;
  }

  function level(ctx) {
    if (!(slot >= 0 && slot <= 3)) return 0;
    const p = playerOf();
    const drinks = fin(ctx && ctx.drinks, p ? fin(p.drinks) : 0);
    const intensity = game && game.session && game.session.settings ? game.session.settings.intensity : 1;
    return levelFor({ drinks, water: p && p.water, bodyKg: p && p.bodyKg, sex: p && p.sex }, intensity ?? 1);
  }

  function resetForRace(ri, Lt) {
    st.race = ri;
    Object.assign(st, freshDynamicState());
    ring.clear(); ouF.reset(); ouS.reset(); ouT.reset();
    const seed = (game && game.session && game.session.seed) >>> 0;
    const s = slotStreams(seed, slot, ri);
    st.rng = s;
    st.phases = Array.from({ length: 8 }, () => s.persona() * 2 * Math.PI);
    st.leanSign = s.persona() < 0.5 ? -1 : 1;
    st.Ls = Lt; // snap at the start of a race
  }

  function filter(raw, dt, ctx) {
    ctx = ctx || {};
    const k = ctx.kartState || {};
    if (k.isCpu) return raw; // belt and braces: never CPUs
    dt = clamp(fin(dt), 0, 0.1); // clamp hitches
    const Lt = level(ctx);
    // Race key: the night-wide serial kept by drinks.js (bumped on every
    // raceStart), else the engine's raceIndex (which restarts every cup).
    const sess = game && game.session;
    const ri = (sess && Number.isFinite(sess.raceSerial) ? sess.raceSerial : undefined) ?? ctx.raceIndex ?? (sess && sess.raceIndex) ?? 0;
    if (ri !== st.race) resetForRace(ri, Lt);
    st.Ls += (Lt - st.Ls) * (1 - Math.exp(-dt / 2));

    // bookkeeping that must run even on the identity path
    st.t += dt;
    if (Number.isFinite(ctx.time)) st.lastCtxTime = ctx.time;
    const sp = fin(k.speedNorm, NaN);
    const speedNorm = clamp01(Number.isFinite(sp) ? sp : (fin(ctx.speed, NaN) / fin(k.maxSpeed, 30)));
    const spd = Number.isFinite(speedNorm) ? speedNorm : 1;
    if (Number.isFinite(k.raceTime)) st.sinceGo = k.raceTime;
    else if (k.racePhase === 'countdown' || k.countdown > 0 || k.started === false) st.sinceGo = 0;
    else st.sinceGo += dt;
    // Respawn: an explicit flag if the engine sends one, else a kart whose speed
    // drops from a real speed to ~0 in a single step (only a teleport does that).
    const respawning = !!k.respawning || k.frozen > 0 || (st.prevSpd > 0.25 && spd < 0.02 && dt > 0);
    st.prevSpd = spd;
    st.sinceRespawn = respawning ? 0 : st.sinceRespawn + dt;
    st.slowFor = spd < 0.1 ? st.slowFor + dt : 0;

    // ---- IDENTITY PATH: L == 0 returns the very same object ----
    if (Lt === 0 && st.Ls < 1e-3) {
      st.Ls = 0;
      ring.clear();
      const c = isClean(raw) ? raw : sanitize(raw);
      // keep filter memory in step with the live input so a later ramp-in has no pop
      st.y = c.steer; st.v = 0; st.thr = c.throttle; st.brk = c.brake;
      st.prevDrift = c.drift; st.prevItem = c.useItem; st.driftDropped = false;
      st.itemFireAt = null; st.itemActive = false;
      st.lapseUntil = st.invEnd = -1;
      return c;
    }

    const P = paramsAt(st.Ls);

    if (respawning) {
      ouF.reset(); ouS.reset(); st.y = st.v = 0;
      st.lapseUntil = -1; st.invEnd = -1; // never freeze a kart that is being put back
    }

    // 1) sanitize and push to the ring buffer, then read the delayed sample
    ring.push(st.t, sanitize(raw));
    const d = ring.read(st.t - P.delayMs / 1000);

    // 2) random events (Poisson per frame) with the finishability guards
    const canEvent = st.sinceGo > 4 && st.sinceRespawn > 2 && spd >= 0.2 && st.t - st.lastEventT > 8;
    const E = st.rng.events;
    const fire = (perMin) => perMin > 0 && E() < 1 - Math.exp(-perMin / 60 * dt);
    if (canEvent && fire(P.lapsePerMin)) {
      st.lapseStart = st.t;
      st.lapseUntil = st.t + Math.max(0.05, P.lapseDurS + (E() * 2 - 1) * LAPSE_JITTER_S);
      st.lastEventT = st.t; emitPhone('lapse');
    } else if (canEvent && fire(P.invertPerMin)) {
      st.invStart = st.t;
      st.invEnd = st.t + Math.max(0.3, P.invertDurS + (E() * 2 - 1) * INVERT_JITTER_S);
      st.lastEventT = st.t; emitPhone('invert');
    } else if (canEvent && fire(P.hiccupPerMin)) {
      st.hicStart = st.t; st.hicSign = E() < 0.5 ? -1 : 1;
      st.lastEventT = st.t; emitPhone('hiccup');
    }
    const lapse = st.t < st.lapseUntil;

    // 3) steering chain
    let s = applyDeadzone(d.steer, P.deadzone);
    s *= P.steerGain * invertMul(st);
    if (lapse) s = st.heldSteer; else st.heldSteer = s; // micro-sleep: hands freeze
    if (st.hicStart >= 0 && st.t - st.hicStart < 0.12) s += 0.35 * st.hicSign;
    // Underdamped second-order response = overcorrection. Below ~4 ms of time
    // constant the lag is imperceptible and the stiff spring is bypassed.
    if (P.steerTn > 0.004) {
      const wn = 1 / P.steerTn;
      const n = Math.max(1, Math.ceil(Math.max(dt * 240, dt * wn / 0.5)));
      const h = dt / n;
      for (let i = 0; i < n; i++) {
        const a = wn * wn * (s - st.y) - 2 * P.steerZeta * wn * st.v;
        st.v += a * h; // semi-implicit Euler: stable for h*wn < 2
        st.y += st.v * h;
      }
      s = st.y;
    } else { st.y = s; st.v = 0; }
    let wScale = 0.35 + 0.65 * spd;
    if (st.slowFor > 2) wScale *= 0.3;
    const W = st.rng.wander;
    s += wScale * (ouF.step(dt, P.wanderFastSd, 0.7, W)
                 + ouS.step(dt, P.wanderSlowSd, 4.0, W, st.leanSign * P.leanBias));
    s = clamp(fin(s), -1, 1);

    // 4) pedals: first-order lag plus throttle wobble (speed-control impairment)
    const thrIn = lapse ? st.heldThr : d.throttle; if (!lapse) st.heldThr = d.throttle;
    const brkIn = lapse ? st.heldBrk : d.brake; if (!lapse) st.heldBrk = d.brake;
    const aP = P.pedalTau > 1e-4 ? 1 - Math.exp(-dt / P.pedalTau) : 1;
    st.thr += (thrIn - st.thr) * aP;
    st.brk += (brkIn - st.brk) * aP;
    const thr = clamp01(st.thr * (1 - Math.abs(ouT.step(dt, P.throttleWobbleSd, 1.2, W))));

    // 5) buttons: rising edges are evaluated on the DELAYED stream
    const B = st.rng.buttons;
    if (d.drift && !st.prevDrift) {
      st.driftDropped = lapse || B() < P.missEdgeP;
      st.driftPressT = st.t;
      if (st.driftDropped) emitPhone('fumble');
    }
    if (!d.drift) st.driftDropped = false;
    const drift = d.drift && !st.driftDropped && (st.t - st.driftPressT) >= P.driftHoldMs / 1000;
    st.prevDrift = d.drift;

    if (d.useItem && !st.prevItem) {
      if (!lapse && B() >= P.missEdgeP) st.itemFireAt = st.t + P.itemExtraMs / 1000;
      else emitPhone('fumble');
    }
    st.prevItem = d.useItem;
    if (st.itemFireAt !== null && st.t >= st.itemFireAt) {
      st.itemActive = true; st.itemUntil = st.t + 0.1; st.itemFireAt = null;
    }
    if (st.itemActive && st.t >= st.itemUntil && !d.useItem) st.itemActive = false; // >= 100 ms pulse
    const useItem = !!st.itemActive;

    return { steer: s, throttle: thr, brake: clamp01(fin(st.brk)), drift, useItem };
  }

  // Accepts visual(t, vp) or the engine's visual({time, viewport?, ...}).
  //
  // Event envelopes (lapse blink, hiccup jolt) run on the filter's clock. The
  // engine stops calling the filter once a human finishes (autopilot), so when
  // the kart has finished, or the caller's time is more than 0.1 s ahead of the
  // last filter call, any live event is cleared instead of freezing on screen.
  function visual(t, vp) {
    let finished = false;
    if (t && typeof t === 'object') {
      vp = vp || t.viewport || t.vp;
      finished = !!(t.kartState && t.kartState.finished);
      t = t.time;
    }
    const stale = Number.isFinite(t) && Number.isFinite(st.lastCtxTime) && t - st.lastCtxTime > 0.1;
    if (finished || stale) {
      st.lapseUntil = -1; st.lapseStart = -1;
      st.hicStart = -1;
    }
    const tt = Number.isFinite(t) ? t : (typeof performance !== 'undefined' ? performance.now() / 1000 : 0);
    const settings = (game && game.session && game.session.settings) || {};
    return computeVisualFx(st, tt, vp && vp.w > 0 && vp.h > 0 ? vp : REFERENCE_VIEWPORT, settings);
  }

  return { slot, filter, visual, state: st, ring };
}
