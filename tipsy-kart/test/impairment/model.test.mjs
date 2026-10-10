// Pure-model tests: parameter table (T3, T4), level mapping (T5), BAC math (T13),
// RNG, latency ring, visual effects function.
import test from 'node:test';
import assert from 'node:assert/strict';
import { paramsAt, TABLE, PARAM_KEYS, DECREASING, CAPS, steerNoise, LAPSE_JITTER_S, INVERT_JITTER_S } from '../../public/js/impairment/params.js';
import { levelFor, estimateBAC, tierIndex, tierLabel, TIER_LABELS, bodyScale } from '../../public/js/impairment/bac.js';
import { hash32, mulberry32, gauss, slotStreams, OU } from '../../public/js/impairment/rng.js';
import { InputRing } from '../../public/js/impairment/ring.js';
import { computeVisualFx, neutralFx } from '../../public/js/impairment/visual.js';
import { mean, sd } from './lib/fakegame.mjs';

test('T3 params: monotone in L, neutral at L=0, capped at L=5', () => {
  const p0 = paramsAt(0);
  for (const k of PARAM_KEYS) {
    const neutral = k === 'steerGain' || k === 'steerZeta' || k === 'saturate' ? 1 : 0;
    assert.equal(p0[k], neutral, `L=0 ${k} must be neutral`);
  }
  let prev = paramsAt(0);
  for (let i = 1; i <= 500; i++) {
    const cur = paramsAt(i / 100);
    for (const k of PARAM_KEYS) {
      if (DECREASING.has(k)) assert.ok(cur[k] <= prev[k] + 1e-12, `${k} must be non-increasing at L=${i / 100}`);
      else assert.ok(cur[k] >= prev[k] - 1e-12, `${k} must be non-decreasing at L=${i / 100}`);
    }
    prev = cur;
  }
  assert.deepEqual(paramsAt(7), paramsAt(5));
  assert.deepEqual(paramsAt(-3), paramsAt(0));
  assert.deepEqual(paramsAt(NaN), paramsAt(0));
  for (const k of PARAM_KEYS) assert.equal(TABLE[k].length, 6, `${k} has six knots`);
});

test('T3 params: the 1->2 cliff exists (latency, damping, wander jump)', () => {
  const a = paramsAt(1), b = paramsAt(2);
  assert.ok(b.delayMs - a.delayMs >= 90);
  assert.ok(a.steerZeta >= 0.8 && b.steerZeta <= 0.5);
  assert.ok(steerNoise(b) / steerNoise(a) >= 3);
});

test('T4 caps: every L=5 value is within the hard caps', () => {
  const P = paramsAt(5);
  assert.ok(P.delayMs <= CAPS.delayMs);
  assert.ok(steerNoise(P) <= CAPS.steerNoise);
  assert.ok(P.deadzone <= CAPS.deadzone);
  assert.ok(P.missEdgeP <= CAPS.missEdgeP);
  assert.ok(P.lapsePerMin <= CAPS.lapsePerMin);
  assert.ok(P.lapseDurS + LAPSE_JITTER_S <= CAPS.lapseMaxS + 1e-9);
  assert.ok(P.invertPerMin <= CAPS.invertPerMin);
  assert.ok(P.invertDurS + INVERT_JITTER_S <= CAPS.invertMaxS + 1e-9);
  assert.ok(P.blurPx <= CAPS.blurPx);
  assert.ok(P.tunnel <= CAPS.tunnel);
  assert.ok(0.5 * P.doubleVision <= CAPS.ghostAlpha);
  assert.ok(P.swayDeg <= CAPS.swayDeg);
  assert.ok(P.camLagS <= CAPS.camLagS);
  // and at every intermediate level too
  for (let L = 0; L <= 5; L += 0.05) {
    const q = paramsAt(L);
    assert.ok(q.delayMs <= CAPS.delayMs && steerNoise(q) <= CAPS.steerNoise && q.deadzone <= CAPS.deadzone);
  }
});

const BODIES = [
  { name: '50kg f', bodyKg: 50, sex: 'f' },
  { name: '60kg f', bodyKg: 60, sex: 'f' },
  { name: '75kg unspecified', bodyKg: 75, sex: null },
  { name: '90kg m', bodyKg: 90, sex: 'm' },
  { name: '120kg m', bodyKg: 120, sex: 'm' },
  { name: '200kg m', bodyKg: 200, sex: 'm' },
];

test('T5 level mapping: monotone in drinks, race-3 floor, race-2 below the limit', () => {
  for (const b of BODIES) {
    let prev = -1;
    for (let d = 0; d <= 15; d++) {
      const L = levelFor({ drinks: d, ...b });
      assert.ok(L >= prev, `${b.name} monotone at ${d}`);
      assert.ok(L >= 0 && L <= 5);
      prev = L;
    }
    assert.equal(levelFor({ drinks: 0, ...b }), 0);
    assert.ok(levelFor({ drinks: 1, ...b }) < 2, `${b.name}: 1 drink is under the limit level`);
    assert.ok(levelFor({ drinks: 2, ...b }) >= 2, `${b.name}: 2 drinks (race 3) is at least L=2`);
    assert.equal(levelFor({ drinks: 15, ...b }), 5);
  }
  assert.equal(levelFor({ drinks: 3 }), 3, 'default adult maps 1:1');
  assert.equal(levelFor({ drinks: 4, water: true }), 0, 'water gives L=0');
  assert.equal(bodyScale({}), 1);
});

test('T5 level mapping: intensity presets', () => {
  assert.equal(levelFor({ drinks: 2 }, 0.6), 1.2);
  assert.equal(levelFor({ drinks: 2 }, 1.25), 2.5);
  assert.equal(levelFor({ drinks: 5 }, 1.25), 5);
  assert.equal(levelFor({ drinks: 3 }, 1), 3);
});

test('tier labels follow the spec boundaries', () => {
  assert.deepEqual(TIER_LABELS, ['Sober', 'Buzzed', 'Over the limit', 'Wobbly', 'Very wobbly', 'Legless']);
  assert.equal(tierLabel(0), 'Sober');
  assert.equal(tierLabel(0.01), 'Buzzed');
  assert.equal(tierLabel(1.49), 'Buzzed');
  assert.equal(tierLabel(1.5), 'Over the limit');
  assert.equal(tierLabel(2.49), 'Over the limit');
  assert.equal(tierLabel(2.5), 'Wobbly');
  assert.equal(tierLabel(3.5), 'Very wobbly');
  assert.equal(tierLabel(4.5), 'Legless');
  assert.equal(tierIndex(5), 5);
});

test('T13 BAC math', () => {
  const now = 1e12;
  const two = { drinks: 2, drinkLog: [now] };
  assert.ok(Math.abs(estimateBAC(two, now) - 0.0602) <= 0.0005);
  assert.ok(Math.abs(estimateBAC({ drinks: 2, drinkLog: [now - 3.6e6] }, now) - 0.0452) <= 0.0005);
  assert.ok(Math.abs(estimateBAC({ drinks: 1, bodyKg: 75, sex: 'm' }, now) - 0.0275) <= 0.0005);
  assert.ok(Math.abs(estimateBAC({ drinks: 1, bodyKg: 60, sex: 'f' }, now) - 0.0424) <= 0.0005);
  assert.equal(estimateBAC({ drinks: 0 }, now), 0);
  // never negative, even after a very long time
  assert.equal(estimateBAC({ drinks: 1, drinkLog: [now - 100 * 3.6e6] }, now), 0);
  assert.ok(estimateBAC({ drinks: 3 }, now) > 0.08, '3 drinks is over the US 0.08 limit');
  assert.ok(estimateBAC({ drinks: 2 }, now) > 0.05, '2 drinks is over the 0.05 limit');
  assert.ok(estimateBAC({ drinks: 1 }, now) < 0.05);
  // garbage weight falls back to the default
  assert.equal(estimateBAC({ drinks: 2, bodyKg: 5 }, now), estimateBAC({ drinks: 2 }, now));
});

test('rng: hash and mulberry32 are deterministic; gauss is roughly standard normal', () => {
  assert.equal(hash32('abc'), hash32('abc'));
  assert.notEqual(hash32('abc'), hash32('abd'));
  const a = mulberry32(42), b = mulberry32(42);
  for (let i = 0; i < 100; i++) assert.equal(a(), b());
  const r = mulberry32(7);
  const xs = Array.from({ length: 20000 }, () => gauss(r));
  assert.ok(Math.abs(mean(xs)) < 0.03);
  assert.ok(Math.abs(sd(xs) - 1) < 0.03);
  const u = Array.from({ length: 1000 }, () => r());
  assert.ok(u.every((x) => x >= 0 && x < 1));
});

test('rng: slot streams are independent and persona is stable across races', () => {
  const s1 = slotStreams(99, 0, 1), s2 = slotStreams(99, 0, 2), s3 = slotStreams(99, 1, 1);
  assert.equal(s1.persona(), s2.persona(), 'persona is the same across races');
  assert.notEqual(slotStreams(99, 0, 1).wander(), s2.wander());
  assert.notEqual(slotStreams(99, 0, 1).persona(), s3.persona(), 'different slots have different personas');
  const w = slotStreams(99, 0, 1);
  assert.notEqual(w.wander(), w.events());
});

test('OU: stationary sd matches the target regardless of step size', () => {
  for (const dt of [1 / 30, 1 / 60, 1 / 144]) {
    const rng = mulberry32(5);
    const ou = new OU();
    const xs = [];
    const n = Math.round(4000 / dt);
    for (let i = 0; i < n; i++) { ou.step(dt, 0.2, 0.7, rng); if (i % 10 === 0) xs.push(ou.x); }
    assert.ok(Math.abs(sd(xs) - 0.2) < 0.02, `dt=${dt} sd=${sd(xs)}`);
  }
});

test('ring buffer: returns the newest sample at or before now - delay', () => {
  const ring = new InputRing(64);
  const dt = 1 / 100;
  const delay = 0.13;
  let first = null;
  for (let i = 0; i < 200; i++) {
    const t = i * dt;
    ring.push(t, { steer: t >= 0.5 ? 1 : 0, throttle: 0, brake: 0, drift: false, useItem: false });
    const got = ring.read(t - delay);
    if (got.steer === 1 && first === null) first = t;
  }
  assert.ok(Math.abs(first - 0.5 - delay) <= dt + 1e-9, `measured latency ${first - 0.5}`);
  const empty = new InputRing(4);
  assert.equal(empty.read(0), null);
  // falls back to the oldest sample if the buffer does not reach back far enough
  const r2 = new InputRing(4);
  r2.push(10, { steer: 0.3, throttle: 0, brake: 0, drift: false, useItem: false });
  assert.equal(r2.read(0).steer, 0.3);
  // wraps without error
  const r3 = new InputRing(4);
  for (let i = 0; i < 10; i++) r3.push(i, { steer: i / 10, throttle: 0, brake: 0, drift: false, useItem: false });
  assert.equal(r3.length, 4);
  assert.equal(r3.read(9).steer, 0.9);
  assert.equal(r3.read(0).steer, 0.6, 'oldest retained');
});

function visState(L, extra = {}) {
  return Object.assign({ Ls: L, phases: [0.1, 0.5, 1, 1.5, 2, 2.5, 3, 3.5], t: 0, lapseStart: -1, lapseUntil: -1, hicStart: -1 }, extra);
}

test('visual fx: neutral at L=0 and within caps at L=5 for any time', () => {
  for (let i = 0; i < 100; i++) assert.deepEqual(computeVisualFx(visState(0), i * 0.37), neutralFx());
  assert.equal(neutralFx().zoom, 1);
  let maxBlur = 0, maxSway = 0, maxZoom = 0, maxGhost = 0;
  for (let i = 0; i < 4000; i++) {
    const fx = computeVisualFx(visState(5), i * 0.05);
    maxBlur = Math.max(maxBlur, fx.blurPx);
    maxSway = Math.max(maxSway, Math.abs(fx.swayDeg));
    maxZoom = Math.max(maxZoom, fx.zoom);
    maxGhost = Math.max(maxGhost, 0.5 * fx.doubleVision);
    for (const k of Object.keys(fx)) assert.ok(Number.isFinite(fx[k]), `${k} finite`);
    assert.ok(fx.tunnel >= 0 && fx.tunnel <= 1);
    assert.ok(fx.doubleVision >= 0 && fx.doubleVision <= 1);
  }
  assert.ok(maxBlur <= CAPS.blurPx + 1e-9);
  assert.ok(maxSway <= CAPS.swayDeg);
  assert.ok(maxZoom <= 1.13 + 1e-9, `zoom ${maxZoom}`);
  assert.ok(maxGhost <= CAPS.ghostAlpha);
});

test('visual fx: comfort halves sway/fov/camLag; blink and jolt follow events; viewport scaling', () => {
  const full = computeVisualFx(visState(3), 1.234, undefined, { comfortVisuals: false });
  const calm = computeVisualFx(visState(3), 1.234, undefined, { comfortVisuals: true });
  assert.ok(Math.abs(calm.swayDeg - full.swayDeg / 2) < 1e-9);
  assert.ok(Math.abs(calm.fovWobbleDeg - full.fovWobbleDeg / 2) < 1e-9);
  assert.ok(Math.abs(calm.camLagS - full.camLagS / 2) < 1e-9);
  assert.equal(calm.blurPx, full.blurPx, 'comfort does not touch blur');

  const mid = computeVisualFx(visState(4, { t: 5.0, lapseStart: 4.8, lapseUntil: 5.4 }), 1);
  assert.equal(mid.blink, 1);
  assert.ok(mid.tunnel >= 0.92);
  const edge = computeVisualFx(visState(4, { t: 4.84, lapseStart: 4.8, lapseUntil: 5.4 }), 1);
  assert.ok(edge.blink > 0 && edge.blink < 1);
  assert.equal(computeVisualFx(visState(4, { t: 6, lapseStart: 4.8, lapseUntil: 5.4 }), 1).blink, 0);

  const jolt = computeVisualFx(visState(3, { t: 2.0, hicStart: 2.0 }), 1);
  assert.equal(jolt.joltPx, 6);
  assert.ok(computeVisualFx(visState(3, { t: 2.2, hicStart: 2.0 }), 1).joltPx < 6);
  assert.equal(computeVisualFx(visState(3, { t: 2.5, hicStart: 2.0 }), 1).joltPx, 0);

  const big = computeVisualFx(visState(3), 1.234, { w: 1920, h: 1080 });
  const half = computeVisualFx(visState(3), 1.234, { w: 960, h: 540 });
  assert.ok(Math.abs(half.blurPx - big.blurPx / 2) < 1e-9);
  assert.ok(Math.abs(half.ghostDx - big.ghostDx / 2) < 1e-9);
});

test('visual fx: values grow with level (blur, sway amplitude, double vision, tunnel)', () => {
  const peak = (L, key) => {
    let m = 0;
    for (let i = 0; i < 2000; i++) m = Math.max(m, Math.abs(computeVisualFx(visState(L), i * 0.05)[key]));
    return m;
  };
  for (const key of ['blurPx', 'swayDeg', 'doubleVision', 'tunnel']) {
    let prev = -1;
    for (const L of [0, 1, 2, 3, 4, 5]) { const v = peak(L, key); assert.ok(v >= prev - 1e-9, `${key} at L=${L}`); prev = v; }
  }
});
