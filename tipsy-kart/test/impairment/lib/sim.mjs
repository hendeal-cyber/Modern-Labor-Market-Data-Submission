// Calibration simulator (spec section 4.3): a kinematic kart on an oval, driven
// by a pure-pursuit "CPU-like" bot whose RAW command goes through
// createImpairment(slot).filter exactly like a human's.
//
// Track: two 120 m straights joined by two 180 degree arcs of radius 30 m,
// width 12 m (off-track when |lateral| > 6 m). Travel is counter-clockwise.
// Kart: vmax 25 m/s, yawRate = steer * 1.6 * min(1, v/8) rad/s, throttle -> 8 m/s^2,
// brake 15 m/s^2, off-track halves vmax.

import { createImpairment } from '../../../public/js/impairment/filter.js';
import { mulberry32, gauss, hash32 } from '../../../public/js/impairment/rng.js';
import { makeFakeGame } from './fakegame.mjs';

export const STRAIGHT = 120;
export const R = 30;
export const HALF_W = 6;
export const ARC = Math.PI * R;
export const LAP = 2 * STRAIGHT + 2 * ARC;
const L1 = STRAIGHT + ARC;          // start of the top straight
const L2 = 2 * STRAIGHT + ARC;      // start of the left arc
export const VMAX = 25;
const TURN = 1.6;

const TWO_PI = 2 * Math.PI;
const wrapAngle = (a) => { while (a > Math.PI) a -= TWO_PI; while (a < -Math.PI) a += TWO_PI; return a; };

/** Point on the centreline at arc length s (wraps). */
export function centerAt(s) {
  s = ((s % LAP) + LAP) % LAP;
  if (s < STRAIGHT) return { x: s - 60, y: -R, h: 0 };
  if (s < L1) { const th = -Math.PI / 2 + (s - STRAIGHT) / R; return { x: 60 + R * Math.cos(th), y: R * Math.sin(th), h: th + Math.PI / 2 }; }
  if (s < L2) return { x: 60 - (s - L1), y: R, h: Math.PI };
  const ph = Math.PI / 2 + (s - L2) / R;
  return { x: -60 + R * Math.cos(ph), y: R * Math.sin(ph), h: ph + Math.PI / 2 };
}

/** Project a point on the track: arc length s and lateral offset (positive = left/inside). */
export function trackPos(x, y) {
  if (x > 60) {
    const th = Math.atan2(y, x - 60);
    return { s: STRAIGHT + R * (th + Math.PI / 2), lat: R - Math.hypot(x - 60, y) };
  }
  if (x < -60) {
    let ph = Math.atan2(y, x + 60);
    if (ph < 0) ph += TWO_PI;
    return { s: L2 + R * (ph - Math.PI / 2), lat: R - Math.hypot(x + 60, y) };
  }
  if (y < 0) return { s: x + 60, lat: R - Math.abs(y) };
  return { s: L1 + (60 - x), lat: R - Math.abs(y) };
}

/**
 * One bot run. Returns metrics.
 *  opts: {drinks, seed, k, La, cap, laps, dt, intensity, water, bodyKg, sex, slot}
 */
export function runBot(opts) {
  const {
    drinks = 0, seed = 1, k = 1.0, La = 8, cap = 1.0, laps = 3, dt = 1 / 60,
    intensity = 1, slot = 0, maxTime = 400, botDelay = 0.15, botNoise = 0.02, aimNoiseM = 0.5,
  } = opts;
  const game = makeFakeGame({ players: 4, seed: (hash32(`cal:${seed}`) >>> 0), drinks: 0, settings: { intensity } });
  const pl = game.session.players[slot];
  pl.drinks = drinks; pl.water = !!opts.water; pl.bodyKg = opts.bodyKg ?? null; pl.sex = opts.sex ?? null;
  const imp = createImpairment(slot, game);
  const brng = mulberry32(hash32(`bot:${seed}`));

  let { x, y, h } = centerAt(60);
  let v = 0;
  let s = trackPos(x, y).s;
  let cum = 0;
  const hist = [];                       // pose history for the bot's own reaction delay
  let noise = 0;
  let aim = 0;
  const aimA = Math.exp(-dt / 2.0);
  const noiseA = Math.exp(-dt / 0.25);
  const delayN = Math.max(0, Math.round(botDelay / dt));
  let t = 0;
  let respawnUntil = -1;
  let respawns = 0;

  // metrics accumulators
  let n = 0, sumLat = 0, sumLat2 = 0, offT = 0, excursions = 0, wasOff = false;
  let revCount = 0, lastExt = 0, dir = 0;
  let steerSamples = 0;
  let finished = false;

  while (t < maxTime) {
    // --- bot sensing (stale by botDelay) ---
    hist.push({ x, y, h });
    const o = hist[Math.max(0, hist.length - 1 - delayN)];
    const so = trackPos(o.x, o.y).s;
    aim = aim * aimA + aimNoiseM * Math.sqrt(1 - aimA * aimA) * gauss(brng); // human-like attention drift (m)
    const c0 = centerAt(so + La);
    const tgt = { x: c0.x - Math.sin(c0.h) * aim, y: c0.y + Math.cos(c0.h) * aim };
    const dx = tgt.x - o.x, dy = tgt.y - o.y;
    const alpha = wrapAngle(Math.atan2(dy, dx) - o.h);
    const kappa = 2 * Math.sin(alpha) / Math.max(1, Math.hypot(dx, dy));
    noise = noise * noiseA + botNoise * Math.sqrt(1 - noiseA * noiseA) * gauss(brng); // low-frequency sensor noise
    let cmd = k * kappa * Math.max(v, 8) / TURN + noise;
    cmd = Math.max(-1, Math.min(1, cmd));
    const raw = { steer: cmd, throttle: cap, brake: 0, drift: false, useItem: false };

    // --- impairment filter ---
    const respawning = t < respawnUntil;
    const ctx = {
      time: t, speed: v, drinks: pl.drinks, raceIndex: 1, slot,
      kartState: { raceTime: t, speedNorm: v / VMAX, maxSpeed: VMAX, respawning, isCpu: false },
    };
    const out = imp.filter(raw, dt, ctx);

    // --- steering reversal counting (hysteresis 0.05) ---
    const st = out.steer;
    if (steerSamples === 0) lastExt = st;
    if (dir === 0) {
      if (st > lastExt + 0.05) { dir = 1; lastExt = st; } else if (st < lastExt - 0.05) { dir = -1; lastExt = st; }
    } else if (dir === 1) {
      if (st > lastExt) lastExt = st; else if (st < lastExt - 0.05) { revCount++; dir = -1; lastExt = st; }
    } else if (st < lastExt) lastExt = st; else if (st > lastExt + 0.05) { revCount++; dir = 1; lastExt = st; }
    steerSamples++;

    // --- kart physics ---
    const { lat } = trackPos(x, y);
    const off = Math.abs(lat) > HALF_W;
    const vmaxEff = off ? VMAX / 2 : VMAX;
    h += out.steer * TURN * Math.min(1, v / 8) * dt;
    const vt = vmaxEff * out.throttle;
    if (v < vt) v = Math.min(vt, v + 8 * out.throttle * dt + 0.0);
    else v = Math.max(vt, v - 6 * dt);
    if (out.brake > 0) v = Math.max(0, v - 15 * out.brake * dt);
    x += Math.cos(h) * v * dt;
    y += Math.sin(h) * v * dt;
    t += dt;

    // --- progress + metrics ---
    const tp = trackPos(x, y);
    let ds = tp.s - s;
    if (ds < -LAP / 2) ds += LAP; else if (ds > LAP / 2) ds -= LAP;
    cum += ds; s = tp.s;
    const isOff = Math.abs(tp.lat) > HALF_W;
    n++; sumLat += tp.lat; sumLat2 += tp.lat * tp.lat;
    if (isOff) offT += dt;
    if (isOff && !wasOff) excursions++;
    wasOff = isOff;

    if (Math.abs(tp.lat) > 20) { // far off: put the kart back (finishability guard on the real engine)
      const c = centerAt(s); x = c.x; y = c.y; h = c.h; v = 0; respawnUntil = t + 1.0; respawns++;
      hist.length = 0; wasOff = false;
    }
    if (cum >= laps * LAP) { finished = true; break; }
  }

  const mLat = sumLat / n;
  const sdlp = Math.sqrt(Math.max(0, sumLat2 / n - mLat * mLat));
  return {
    finished, time: t, lapTime: t / laps, offTrackPct: 100 * offT / t, sdlp,
    revPerMin: revCount / (t / 60), excursionsPerLap: excursions / laps, respawns,
  };
}

const avg = (a, f) => a.reduce((x, r) => x + f(r), 0) / a.length;

/** Mean metrics over seeds for one (drinks, combo). */
export function runMany({ drinks, seeds, combo, laps = 3, ...rest }) {
  const rs = [];
  for (const seed of seeds) rs.push(runBot({ drinks, seed, laps, ...combo, ...rest }));
  return {
    n: rs.length,
    finishedCount: rs.filter((r) => r.finished).length,
    lapTime: avg(rs, (r) => r.lapTime),
    maxTime: Math.max(...rs.map((r) => r.time)),
    offTrackPct: avg(rs, (r) => r.offTrackPct),
    sdlp: avg(rs, (r) => r.sdlp),
    revPerMin: avg(rs, (r) => r.revPerMin),
    excursionsPerLap: avg(rs, (r) => r.excursionsPerLap),
    respawns: avg(rs, (r) => r.respawns),
    runs: rs,
  };
}

export const GRID = (() => {
  const g = [];
  for (const k of [1.0, 0.7, 0.5]) for (const La of [8, 12, 16]) for (const cap of [1.0, 0.85, 0.7]) g.push({ k, La, cap });
  return g;
})();
export const NAIVE = { k: 1.0, La: 8, cap: 1.0 };

/** Best (lowest mean lap time) combo on the grid, plus the naive bot, for one level. */
export function sweepLevel({ drinks, seeds, laps = 3, grid = GRID, ...rest }) {
  let best = null;
  for (const combo of grid) {
    const m = runMany({ drinks, seeds, combo, laps, ...rest });
    // a DNF/respawn heavy combo is penalised through its longer lap time automatically
    if (!best || m.lapTime < best.m.lapTime) best = { combo, m };
  }
  const naive = runMany({ drinks, seeds, combo: NAIVE, laps, ...rest });
  return { best, naive };
}
