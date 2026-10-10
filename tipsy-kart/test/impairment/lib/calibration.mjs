// Spec section 4.3 calibration protocol + target bands (Standard intensity,
// adapted bot, mean over seeds). Used by calibrate.mjs (CLI report) and
// calibration.test.mjs (opt-in test T14, CALIBRATE=1).

import { sweepLevel } from './sim.mjs';

/** [min, max] bands per drink count; null = unbounded on that side. */
export const TARGETS = {
  0: { lap: [1.0, 1.0], off: [0, 0] },
  1: { lap: [1.00, 1.04], off: [0, 1], sdlp: [null, 1.3], rev: [null, 1.2] },
  2: { lap: [1.08, 1.18], off: [3, 10], sdlp: [2.0, null], rev: [1.5, null] },
  3: { lap: [1.15, 1.28], off: [6, 15], sdlp: [2.6, null], rev: [1.7, null] },
  4: { lap: [1.22, 1.38], off: [9, 20], sdlp: [3.2, null], rev: [1.9, null] },
  5: { lap: [1.30, 1.50], off: [12, 25], sdlp: [3.8, null], rev: [2.0, null] },
};

const inBand = (x, b) => !b || ((b[0] == null || x >= b[0] - 1e-9) && (b[1] == null || x <= b[1] + 1e-9));

export function runCalibration({ seeds = 20, laps = 3, levels = [0, 1, 2, 3, 4, 5], log = () => {} } = {}) {
  const seedList = Array.from({ length: seeds }, (_, i) => i + 1);
  const raw = {};
  for (const d of levels) {
    raw[d] = sweepLevel({ drinks: d, seeds: seedList, laps });
    log(`level ${d} done`);
  }
  const base = raw[0].best.m;
  const baseNaive = raw[0].naive;
  const rows = [];
  const checks = [];
  for (const d of levels) {
    const { best, naive } = raw[d];
    const m = best.m;
    const row = {
      drinks: d, combo: best.combo,
      lap: m.lapTime / base.lapTime,
      off: m.offTrackPct,
      sdlp: m.sdlp / base.sdlp,
      rev: m.revPerMin / base.revPerMin,
      finished: m.finishedCount,
      worstTimeRatio: m.maxTime / (base.lapTime * laps),
      naiveExcPerLap: naive.excursionsPerLap,
      naiveSdlp: naive.sdlp / baseNaive.sdlp,
      sdlpAbs: m.sdlp,
    };
    rows.push(row);
    const T = TARGETS[d];
    if (T) {
      for (const key of ['lap', 'off', 'sdlp', 'rev']) {
        if (T[key]) checks.push({ name: `L${d} ${key}`, value: row[key], band: T[key], ok: inBand(row[key], T[key]) });
      }
    }
    if (d === 2) {
      const ok = row.naiveExcPerLap >= 1 || row.naiveSdlp >= 2.5;
      checks.push({ name: 'L2 gate (naive bot: >=1 excursion/lap OR SDLP >= 2.5x)', value: `${row.naiveExcPerLap.toFixed(2)} exc/lap, ${row.naiveSdlp.toFixed(1)}x`, band: null, ok });
    }
    if (d === 5) {
      checks.push({ name: 'L5 finishable: 20/20 finish', value: `${row.finished}/${seeds}`, band: null, ok: row.finished === seeds });
      checks.push({ name: 'L5 worst run <= 2.0x sober time', value: row.worstTimeRatio, band: [null, 2.0], ok: row.worstTimeRatio <= 2.0 });
    }
  }
  if (rows[1] && rows[2]) {
    const cliff = rows[2].sdlpAbs / rows[1].sdlpAbs;
    checks.push({ name: 'cliff SDLP(L2)/SDLP(L1) >= 1.6', value: cliff, band: [1.6, null], ok: cliff >= 1.6 });
  }
  return { rows, checks, allOk: checks.every((c) => c.ok) };
}

export function formatReport({ rows, checks, allOk }) {
  const f = (x, n = 2) => (typeof x === 'number' ? x.toFixed(n) : String(x));
  const bandStr = (b) => (b ? `${b[0] == null ? '' : b[0]}..${b[1] == null ? '' : b[1]}` : '');
  const out = [];
  out.push('drinks | adapted combo (k,La,cap) | lap ratio | off-track % | SDLP x sober | reversals x sober | finished | naive exc/lap');
  for (const r of rows) {
    out.push(`${r.drinks}      | ${r.combo.k},${r.combo.La},${r.combo.cap}`.padEnd(38)
      + ` | ${f(r.lap, 3)} | ${f(r.off, 1)} | ${f(r.sdlp, 1)} | ${f(r.rev, 2)} | ${r.finished} | ${f(r.naiveExcPerLap, 2)}`);
  }
  out.push('');
  for (const c of checks) {
    out.push(`${c.ok ? 'PASS' : 'FAIL'}  ${c.name}: ${typeof c.value === 'number' ? f(c.value, 3) : c.value}${c.band ? `  (target ${bandStr(c.band)})` : ''}`);
  }
  out.push('');
  out.push(allOk ? 'ALL TARGETS MET' : 'SOME TARGETS MISSED');
  return out.join('\n');
}
