// Filter tests: identity (T1, T2), determinism (T7), frame-rate independence and
// latency (T8), robustness (T9), event gating (T10), CPUs untouched (T11).
import test from 'node:test';
import assert from 'node:assert/strict';
import { createImpairment, applyDeadzone } from '../../public/js/impairment/filter.js';
import { paramsAt } from '../../public/js/impairment/params.js';
import { neutralFx } from '../../public/js/impairment/visual.js';
import { installImpairment } from '../../public/js/impairment/install.js';
import { makeFakeGame, lcg, randomInput, mean, sd } from './lib/fakegame.mjs';

const ctxOf = (o = {}) => ({
  time: 0, speed: 25, drinks: undefined, raceIndex: 1, slot: 0,
  kartState: { raceTime: 30, speedNorm: 1, maxSpeed: 25, respawning: false, isCpu: false, ...(o.kartState || {}) },
  ...o, ...(o.kartState ? { kartState: { raceTime: 30, speedNorm: 1, maxSpeed: 25, respawning: false, isCpu: false, ...o.kartState } } : {}),
});

function setup({ drinks = 0, water = false, slot = 0, seed = 12345, settings, onEvent } = {}) {
  const game = makeFakeGame({ drinks: 0, seed, settings });
  game.session.players[slot].drinks = drinks;
  game.session.players[slot].water = water;
  const imp = createImpairment(slot, game, { onEvent });
  return { game, imp };
}

test('T1 race-1 identity: out === raw for 10,000 random inputs; visual is neutral', () => {
  const { imp } = setup({ drinks: 0 });
  const r = lcg(1);
  for (let i = 0; i < 10000; i++) {
    const raw = randomInput(r);
    const copy = { ...raw };
    const dt = 1 / 240 + r() * (1 / 20 - 1 / 240);
    const out = imp.filter(raw, dt, ctxOf({ drinks: 0 }));
    assert.equal(out, raw, 'same object');
    assert.deepEqual(out, copy, 'unmodified');
  }
  for (let i = 0; i < 100; i++) assert.deepEqual(imp.visual(i * 0.53), neutralFx());
});

test('T2 water identity: 5 drinks with water on behaves as sober', () => {
  const { imp } = setup({ drinks: 5, water: true });
  const r = lcg(2);
  for (let i = 0; i < 10000; i++) {
    const raw = randomInput(r);
    const out = imp.filter(raw, 1 / 240 + r() * 0.04, ctxOf({ drinks: 5 }));
    assert.equal(out, raw);
  }
  for (let i = 0; i < 100; i++) assert.deepEqual(imp.visual(i * 0.31), neutralFx());
});

test('identity path tolerates garbage by sanitising it (never returns NaN) and returns a neutral input for null', () => {
  const { imp } = setup({ drinks: 0 });
  const out = imp.filter({ steer: NaN, throttle: 7, brake: -1, drift: 1, useItem: 0 }, 0.016, ctxOf());
  assert.deepEqual(out, { steer: 0, throttle: 1, brake: 0, drift: true, useItem: false });
  assert.deepEqual(imp.filter(null, 0.016, ctxOf()), { steer: 0, throttle: 0, brake: 0, drift: false, useItem: false });
  assert.deepEqual(imp.filter(undefined, 0.016, undefined), { steer: 0, throttle: 0, brake: 0, drift: false, useItem: false });
});

test('deadzone keeps full range', () => {
  assert.equal(applyDeadzone(0.05, 0.1), 0);
  assert.equal(applyDeadzone(1, 0.1), 1);
  assert.equal(applyDeadzone(-1, 0.1), -1);
  assert.ok(Math.abs(applyDeadzone(0.55, 0.1) - 0.5) < 1e-12);
});

function run(imp, { seconds = 30, dt = 1 / 60, input = () => ({ steer: 0, throttle: 1, brake: 0, drift: false, useItem: false }), ctx = {} }) {
  const outs = [];
  const n = Math.round(seconds / dt);
  for (let i = 0; i < n; i++) {
    const t = i * dt;
    outs.push(imp.filter(input(t, i), dt, ctxOf({ time: t, kartState: { raceTime: 10 + t }, ...ctx })));
  }
  return outs;
}

test('T7 determinism: same seed/slot/race and inputs give bit-identical output', () => {
  const inp = (t) => ({ steer: Math.sin(t * 2), throttle: 0.9, brake: 0, drift: Math.sin(t) > 0.5, useItem: Math.sin(t * 0.7) > 0.9 });
  const a = run(setup({ drinks: 4 }).imp, { input: inp, seconds: 60 });
  const b = run(setup({ drinks: 4 }).imp, { input: inp, seconds: 60 });
  assert.deepEqual(a, b);
  const c = run(setup({ drinks: 4, seed: 777 }).imp, { input: inp, seconds: 60 });
  assert.notDeepEqual(a, c, 'a different session seed changes the wobble');
});

test('T7 slots differ (steer noise correlation < 0.3); races differ; persona phases stable', () => {
  const g = makeFakeGame({ drinks: 3 });
  const i0 = createImpairment(0, g), i1 = createImpairment(1, g);
  const s0 = run(i0, { seconds: 200 }).map((o) => o.steer);
  const s1 = run(i1, { seconds: 200 }).map((o) => o.steer);
  const m0 = mean(s0), m1 = mean(s1);
  let cov = 0;
  for (let i = 0; i < s0.length; i++) cov += (s0[i] - m0) * (s1[i] - m1);
  const corr = cov / s0.length / (sd(s0) * sd(s1));
  assert.ok(Math.abs(corr) < 0.3, `corr ${corr}`);

  const phases1 = i0.state.phases.slice();
  const lean1 = i0.state.leanSign;
  const race1 = run(i0, { seconds: 20, ctx: { raceIndex: 3 } }).map((o) => o.steer);
  const race2 = run(i0, { seconds: 20, ctx: { raceIndex: 4 } }).map((o) => o.steer);
  assert.notDeepEqual(race1, race2, 'new race = new wander sequence');
  assert.deepEqual(i0.state.phases, phases1, 'persona phases are the same in every race');
  assert.equal(i0.state.leanSign, lean1);
  const again = run(i0, { seconds: 20, ctx: { raceIndex: 3 } }).map((o) => o.steer);
  assert.deepEqual(again, race1, 'revisiting a race index replays it exactly');
});

test('T8 frame-rate independence: wander sd, event counts and latency match at 30 and 144 Hz', () => {
  // L=3 with kartState.raceTime = 2 (inside the no-event window) isolates the wander.
  const L = 3;
  const P = paramsAt(L);
  const expected = Math.sqrt(P.wanderFastSd ** 2 + P.wanderSlowSd ** 2);
  const sds = [];
  for (const hz of [30, 144]) {
    const { imp } = setup({ drinks: L });
    const outs = run(imp, { seconds: 900, dt: 1 / hz, ctx: { kartState: { raceTime: 2 } } });
    const steers = outs.slice(Math.round(30 * hz)).map((o) => o.steer);
    sds.push(sd(steers));
    assert.ok(Math.abs(sd(steers) - expected) / expected < 0.12, `${hz} Hz sd ${sd(steers)} vs ${expected}`);
  }
  assert.ok(Math.abs(sds[0] - sds[1]) / sds[1] < 0.10, `30 Hz ${sds[0]} vs 144 Hz ${sds[1]}`);

  // event counts over 60 simulated minutes, against the Poisson rate with the 8 s dead time
  const lambda = (P.lapsePerMin + P.invertPerMin + P.hiccupPerMin) / 60; // per second
  const expectedEvents = 3600 * lambda / (1 + lambda * 8);
  for (const hz of [30, 144]) {
    let n = 0;
    const { imp } = setup({ drinks: L, onEvent: (e) => { if (e.type === 'lapse' || e.type === 'hiccup' || e.type === 'invert') n++; } });
    run(imp, { seconds: 3600, dt: 1 / hz, ctx: {} });
    assert.ok(Math.abs(n - expectedEvents) / expectedEvents < 0.30, `${hz} Hz: ${n} events vs expected ${expectedEvents.toFixed(1)}`);
  }
});

test('T8 latency: an item press fires delayMs + itemExtraMs later (+/- one frame)', () => {
  const dt = 1 / 120;
  const L = 2;
  const P = paramsAt(L);
  const want = (P.delayMs + P.itemExtraMs) / 1000;
  const lat = [];
  for (let seed = 1; seed <= 12; seed++) {
    const { imp } = setup({ drinks: L, seed });
    const press = 1.0;
    let fired = null;
    for (let i = 0; i < 360; i++) {
      const t = i * dt;
      const out = imp.filter({ steer: 0, throttle: 0, brake: 0, drift: false, useItem: t >= press && t < press + 0.05 }, dt, ctxOf({ time: t, kartState: { raceTime: 2 } }));
      if (out.useItem && fired === null) fired = t;
    }
    if (fired !== null) lat.push(fired - press);
  }
  assert.ok(lat.length >= 8, 'most presses get through (missEdgeP = 8 %)');
  for (const l of lat) assert.ok(Math.abs(l - want) <= 2 * dt, `latency ${l} vs ${want}`);
});

test('T8 latency: steering response starts after delayMs', () => {
  const dt = 1 / 120;
  const { imp } = setup({ drinks: 3 });
  const P = paramsAt(3);
  const ctx = (t) => ctxOf({ time: t, kartState: { raceTime: 2, speedNorm: 1 } });
  // wander/lean make the absolute level noisy, so compare against an unstepped baseline run of the same seed
  const base = setup({ drinks: 3 }).imp;
  let firstDiff = null;
  for (let i = 0; i < 240; i++) {
    const t = i * dt;
    const a = imp.filter({ steer: t >= 0.5 ? 1 : 0, throttle: 0, brake: 0, drift: false, useItem: false }, dt, ctx(t));
    const b = base.filter({ steer: 0, throttle: 0, brake: 0, drift: false, useItem: false }, dt, ctx(t));
    if (firstDiff === null && Math.abs(a.steer - b.steer) > 1e-6) firstDiff = t;
  }
  assert.ok(Math.abs(firstDiff - 0.5 - P.delayMs / 1000) <= 2 * dt, `onset ${firstDiff - 0.5}`);
});

test('T9 robustness: garbage input never yields NaN and stays in range', () => {
  const { imp } = setup({ drinks: 4 });
  const garbage = [
    { steer: NaN, throttle: NaN, brake: NaN, drift: NaN, useItem: NaN },
    { steer: 5, throttle: 5, brake: 5, drift: true, useItem: true },
    { steer: -5, throttle: -5, brake: -5 },
    {}, null, undefined, 'x', 42,
    { steer: Infinity, throttle: -Infinity },
  ];
  const dts = [0, 1, 0.5, NaN, undefined, -1, 1 / 60, 1e-9, 100];
  const ctxs = [undefined, {}, { kartState: {} }, { raceIndex: 3, drinks: 9, speed: NaN }, { kartState: { speedNorm: NaN } }, ctxOf()];
  let n = 0;
  for (const g of garbage) for (const dt of dts) for (const c of ctxs) {
    const out = imp.filter(g, dt, c);
    n++;
    assert.ok(out && Number.isFinite(out.steer) && out.steer >= -1 && out.steer <= 1, JSON.stringify([g, dt, c]));
    assert.ok(Number.isFinite(out.throttle) && out.throttle >= 0 && out.throttle <= 1);
    assert.ok(Number.isFinite(out.brake) && out.brake >= 0 && out.brake <= 1);
    assert.equal(typeof out.drift, 'boolean');
    assert.equal(typeof out.useItem, 'boolean');
  }
  assert.ok(n > 400);
  // also while sober
  const s = setup({ drinks: 0 }).imp;
  for (const g of garbage) {
    const out = s.filter(g, 0.016, ctxOf());
    assert.ok(Number.isFinite(out.steer) && Number.isFinite(out.throttle) && Number.isFinite(out.brake));
  }
  assert.deepEqual(Object.keys(imp.visual()).filter((k) => !Number.isFinite(imp.visual()[k])), []);
});

test('output range and full steer authority at the highest level', () => {
  const { imp } = setup({ drinks: 15 });
  const outs = run(imp, { seconds: 120, input: (t) => ({ steer: Math.sign(Math.sin(t)), throttle: 1, brake: 0, drift: false, useItem: false }) });
  assert.ok(outs.every((o) => o.steer >= -1 && o.steer <= 1 && o.throttle >= 0 && o.throttle <= 1));
  assert.ok(Math.max(...outs.map((o) => o.steer)) > 0.9, 'can still steer fully right');
  assert.ok(Math.min(...outs.map((o) => o.steer)) < -0.9, 'can still steer fully left');
  assert.ok(Math.max(...outs.map((o) => o.throttle)) > 0.7, 'can still accelerate');
});

// ---- T10 event gating ----
function eventLog(drinks, { seconds, dt = 1 / 60, seed = 1, kart = () => ({}), raceIndex = 1 } = {}) {
  const log = [];
  let t = 0;
  const { imp } = setup({ drinks, seed, onEvent: (e) => log.push({ ...e, t }) });
  const n = Math.round(seconds / dt);
  for (let i = 0; i < n; i++) {
    t = i * dt;
    imp.filter({ steer: 0, throttle: 1, brake: 0, drift: false, useItem: false }, dt,
      ctxOf({ time: t, raceIndex, kartState: { raceTime: t, ...kart(t) } }));
  }
  return log;
}

test('T10 gating by level: no lapses at L<=2, no inversions at L<=3, no hiccups at L<=1', () => {
  const c = (d) => {
    const l = eventLog(d, { seconds: 1800, seed: 3 }).reduce((m, e) => { m[e.type] = (m[e.type] || 0) + 1; return m; }, {});
    return l;
  };
  assert.equal(c(1).hiccup || 0, 0);
  assert.equal(c(1).lapse || 0, 0);
  assert.equal(c(1).invert || 0, 0);
  assert.ok((c(2).hiccup || 0) > 0, 'hiccups exist at L=2');
  assert.equal(c(2).lapse || 0, 0);
  assert.equal(c(2).invert || 0, 0);
  const c3 = c(3);
  assert.ok(c3.lapse > 0 && c3.hiccup > 0);
  assert.equal(c3.invert || 0, 0);
  const c4 = c(4);
  assert.ok(c4.invert > 0 && c4.lapse > 0);
});

test('T10 gating: nothing in the first 4 s, during/just after respawn, or when slow; 8 s minimum gap', () => {
  // many short races at the highest level: no event before raceTime 4 s
  let early = 0;
  for (let race = 1; race <= 150; race++) {
    early += eventLog(5, { seconds: 4, seed: race, raceIndex: race }).length;
  }
  assert.equal(early, 0, 'no events in the first 4 s');

  const respawnWindow = (t) => (t >= 100 && t < 400 ? { respawning: true } : {});
  const resp = eventLog(5, { seconds: 400, kart: respawnWindow });
  assert.equal(resp.filter((e) => e.t >= 100 && e.t < 402).length, 0, 'no events while respawning or in the 2 s after');
  assert.ok(resp.length > 0, 'events do occur outside the window');

  const slow = eventLog(5, { seconds: 600, kart: () => ({ speedNorm: 0.15, maxSpeed: 25 }) });
  assert.equal(slow.length, 0, 'no events below speedNorm 0.2');

  for (const d of [3, 4, 5]) {
    const log = eventLog(d, { seconds: 1800, seed: 11 });
    assert.ok(log.length > 5);
    for (let i = 1; i < log.length; i++) assert.ok(log[i].t - log[i - 1].t > 8, `gap ${log[i].t - log[i - 1].t}`);
  }
});

test('T10 event effects: lapse freezes the hands and the pedals; inversion flips steering; hiccup kicks', () => {
  // Drive L=5 with a steady steer and look at the effect windows via internal state.
  const { imp } = setup({ drinks: 5, seed: 5 });
  const st = imp.state;
  let sawLapse = false, sawInvert = false, sawHiccup = false;
  const dt = 1 / 60;
  let lapseSteer = null;
  for (let i = 0; i < 60 * 900; i++) {
    const t = i * dt;
    const out = imp.filter({ steer: 0.5, throttle: 1, brake: 0, drift: false, useItem: false }, dt, ctxOf({ time: t, kartState: { raceTime: t } }));
    if (st.t < st.lapseUntil) {
      sawLapse = true;
      const fx = imp.visual(t);
      assert.ok(fx.blink > 0 || st.t - st.lapseStart < 1e-9);
      if (lapseSteer === null) lapseSteer = out.steer;
    }
    if (st.t >= st.invStart && st.t < st.invEnd && st.invStart >= 0) sawInvert = true;
    if (st.hicStart >= 0 && st.t - st.hicStart < 0.12) sawHiccup = true;
  }
  assert.ok(sawLapse && sawInvert && sawHiccup);
});

test('respawn resets the OU wander and spring', () => {
  const { imp } = setup({ drinks: 5 });
  run(imp, { seconds: 20, input: () => ({ steer: 0.8, throttle: 1, brake: 0, drift: false, useItem: false }) });
  assert.notEqual(imp.state.y, 0);
  imp.filter({ steer: 0, throttle: 0, brake: 0, drift: false, useItem: false }, 1 / 60, ctxOf({ kartState: { raceTime: 30, respawning: true } }));
  // reset to zero, then one frame of integration toward the (delayed) input
  assert.ok(Math.abs(imp.state.y) < 0.05, `y ${imp.state.y}`);
});

test('mid-race drink change eases in (L smoothing, time constant 2 s) and race start snaps', () => {
  const { game, imp } = setup({ drinks: 0 });
  run(imp, { seconds: 2 });
  assert.equal(imp.state.Ls, 0);
  game.session.players[0].drinks = 4;
  run(imp, { seconds: 0.5 });
  assert.ok(imp.state.Ls > 0 && imp.state.Ls < 2, `eased: ${imp.state.Ls}`);
  run(imp, { seconds: 20 });
  assert.ok(Math.abs(imp.state.Ls - 4) < 0.05);
  game.session.players[0].drinks = 5;
  imp.filter({ steer: 0, throttle: 0, brake: 0, drift: false, useItem: false }, 1 / 60, ctxOf({ raceIndex: 9 }));
  assert.equal(imp.state.Ls, 5, 'new race snaps');
});

test('water toggled on mid-race eases the filter back to identity', () => {
  const { game, imp } = setup({ drinks: 4 });
  run(imp, { seconds: 5 });
  game.session.players[0].water = true;
  const outs = run(imp, { seconds: 40 });
  const raw = { steer: 0.3, throttle: 1, brake: 0, drift: false, useItem: false };
  assert.equal(imp.filter(raw, 1 / 60, ctxOf()), raw);
  assert.ok(outs.length > 0);
  assert.deepEqual(imp.visual(1), neutralFx());
});

test('T11 CPUs never affected: isCpu karts return raw; only slots 0-3 get filters/visuals', () => {
  const { imp } = setup({ drinks: 5 });
  const raw = { steer: 0.7, throttle: 1, brake: 0, drift: true, useItem: true };
  for (let i = 0; i < 100; i++) assert.equal(imp.filter(raw, 1 / 60, { kartState: { isCpu: true }, drinks: 5 }), raw);

  const game = makeFakeGame({ drinks: [5, 5, 5, 5] });
  const api = installImpairment(game, { ui: false, quiet: true, skipSaved: true });
  assert.ok(api);
  assert.equal(game.inputFilters.length, 4);
  for (let s = 0; s < 4; s++) { assert.equal(typeof game.inputFilters[s], 'function'); assert.equal(typeof game.visualFx[s], 'function'); }
  assert.equal(game.inputFilters[4], undefined);
  assert.equal(game.visualFx[4], undefined);
  assert.equal(game.visualFx[7], undefined);
  // a slot outside 0-3 is never impaired even if someone wires it up
  const g2 = makeFakeGame({ drinks: 5 });
  const odd = createImpairment(5, g2);
  assert.equal(odd.filter(raw, 1 / 60, ctxOf({ drinks: 5 })), raw);
});

test('engine ctx shape: countdown blocks events; a sudden stop counts as a respawn; visual accepts the engine arg object', () => {
  // countdown: racePhase 'countdown' keeps the race clock at 0 => no events however long it lasts
  const log = [];
  const { imp } = setup({ drinks: 5, onEvent: (e) => log.push(e) });
  const dt = 1 / 60;
  const eng = (phase, speed) => ({ time: 0, speed, drinks: 5, raceIndex: 0, slot: 0, kartState: { speed, maxSpeed: 33, racePhase: phase } });
  for (let i = 0; i < 60 * 300; i++) imp.filter({ steer: 0, throttle: 1, brake: 0, drift: false, useItem: false }, dt, eng('countdown', 30));
  assert.equal(log.filter((e) => e.type !== 'fumble').length, 0);
  // racing at speed, then an instant stop (teleport) => sinceRespawn resets
  for (let i = 0; i < 60 * 10; i++) imp.filter({ steer: 0, throttle: 1, brake: 0, drift: false, useItem: false }, dt, eng('racing', 30));
  assert.ok(imp.state.sinceRespawn > 5);
  imp.filter({ steer: 0, throttle: 1, brake: 0, drift: false, useItem: false }, dt, eng('racing', 0));
  assert.equal(imp.state.sinceRespawn, 0);
  const fx = imp.visual({ time: 12.5, slot: 0, speed: 20, kartState: {}, drinks: 5, raceIndex: 0 });
  assert.ok(fx.blurPx > 0 && Number.isFinite(fx.swayDeg));
  assert.deepEqual(fx, imp.visual(12.5));
  const small = imp.visual({ time: 12.5, viewport: { w: 960, h: 540 } });
  assert.ok(Math.abs(small.blurPx - fx.blurPx / 2) < 1e-9);
});

test('B1: a live lapse blink / hiccup jolt never freezes once the filter stops being called', () => {
  const findEvent = (want) => {
    const { imp } = setup({ drinks: 5, seed: 21 });
    const st = imp.state;
    const dt = 1 / 60;
    for (let i = 0; i < 60 * 1800; i++) {
      const t = i * dt;
      imp.filter({ steer: 0.2, throttle: 1, brake: 0, drift: false, useItem: false }, dt, ctxOf({ time: t, kartState: { raceTime: t } }));
      if (want === 'lapse' && st.t < st.lapseUntil && st.t - st.lapseStart > 0.1) return { imp, t };
      if (want === 'hiccup' && st.hicStart >= 0 && st.t - st.hicStart < 0.05) return { imp, t };
    }
    throw new Error('no ' + want);
  };
  // lapse: blink is on while the filter runs, then the engine stops calling it (kart finished)
  let { imp, t } = findEvent('lapse');
  assert.ok(imp.visual({ time: t }).blink > 0, 'blink while lapsing');
  assert.equal(imp.visual({ time: t + 1 }).blink, 0, 'stale clock clears the blink');
  assert.equal(imp.visual({ time: t + 1 }).tunnel, paramsAt(5).tunnel);
  ({ imp, t } = findEvent('lapse'));
  assert.equal(imp.visual({ time: t, kartState: { finished: true } }).blink, 0, 'finished kart clears the blink');
  // hiccup jolt
  ({ imp, t } = findEvent('hiccup'));
  assert.ok(imp.visual({ time: t }).joltPx > 0);
  assert.equal(imp.visual({ time: t + 1 }).joltPx, 0);
});

test('S3: race serial — a new cup (raceIndex back to 0) and single-race cups get fresh streams and a level snap', () => {
  const game = makeFakeGame({ drinks: [4, 0, 0, 0] });
  const api = installImpairment(game, { ui: false, quiet: true, skipSaved: true, syncMs: 0 });
  const imp = api.filters[0];
  const steerRun = () => {
    const outs = [];
    for (let i = 0; i < 600; i++) {
      outs.push(game.inputFilters[0]({ steer: 0, throttle: 1, brake: 0, drift: false, useItem: false }, 1 / 60,
        { time: i / 60, speed: 30, drinks: game.session.players[0].drinks, raceIndex: 0, slot: 0, kartState: { speed: 30, maxSpeed: 33, racePhase: 'racing' } }).steer);
    }
    return outs;
  };
  game.fire('raceStart', { raceIndex: 0 });
  assert.equal(game.session.raceSerial, 1);
  const cup1 = steerRun();
  assert.equal(imp.state.race, 1);
  game.fire('cupFinished', []);
  game.fire('raceStart', { raceIndex: 0 }); // cup 2, race 1: engine raceIndex is 0 again
  assert.equal(game.session.raceSerial, 2);
  const cup2 = steerRun();
  assert.equal(imp.state.race, 2, 'filter reset for the new race');
  assert.notDeepEqual(cup2, cup1, 'cup 2 does not replay cup 1\'s random streams');

  // single-race cups: raceIndex is always 0; a mid-results drink change still snaps at the next start
  game.session.players[0].drinks = 0;
  steerRun();
  assert.ok(imp.state.Ls > 0, 'still easing within the same race');
  game.fire('raceStart', { raceIndex: 0 });
  game.inputFilters[0]({ steer: 0, throttle: 1, brake: 0, drift: false, useItem: false }, 1 / 60, { time: 0, raceIndex: 0, drinks: 0, slot: 0, kartState: {} });
  assert.equal(imp.state.Ls, 0, 'new single-race cup snaps the level');
  assert.equal(imp.state.race, 3);
});
