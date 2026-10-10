// T6: behavioural monotonicity with the calibration bot (reduced: 5 seeds, 1 lap, one fixed bot setting).
import test from 'node:test';
import assert from 'node:assert/strict';
import { runMany, centerAt, trackPos, LAP } from './lib/sim.mjs';

test('sim geometry: centreline round-trips through the projection', () => {
  for (let s = 0; s < LAP; s += 7.3) {
    const c = centerAt(s);
    const p = trackPos(c.x, c.y);
    const ds = Math.abs(((p.s - s) % LAP + LAP) % LAP);
    assert.ok(Math.min(ds, LAP - ds) < 1e-6, `s=${s}`);
    assert.ok(Math.abs(p.lat) < 1e-9);
  }
});

test('T6 behavioural monotonicity: SDLP and off-track % do not fall as drinks rise; the cliff is real', () => {
  const seeds = [1, 2, 3, 4, 5];
  const combo = { k: 0.7, La: 16, cap: 1.0 };
  const m = [];
  for (let d = 0; d <= 5; d++) m.push(runMany({ drinks: d, seeds, combo, laps: 1 }));
  for (let d = 1; d <= 5; d++) {
    assert.ok(m[d].sdlp >= m[d - 1].sdlp * 0.95, `SDLP ${d}: ${m[d].sdlp} vs ${m[d - 1].sdlp}`);
    assert.ok(m[d].offTrackPct >= m[d - 1].offTrackPct * 0.95 - 1e-9, `off-track ${d}: ${m[d].offTrackPct} vs ${m[d - 1].offTrackPct}`);
  }
  assert.ok(m[2].sdlp / m[1].sdlp >= 1.6, `cliff ratio ${m[2].sdlp / m[1].sdlp}`);
  assert.ok(m[5].finishedCount === 5, 'finishable at the cap');
  assert.equal(m[0].offTrackPct, 0, 'sober bot stays on the track');
});
