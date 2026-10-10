// CLI calibration report (spec 4.3):  node tipsy-kart/test/impairment/calibrate.mjs [seeds=20]
//   SPEC_TABLE=1 node ...   runs with the spec's ORIGINAL (pre-tuning) values for the four retuned rows.
//
// Last recorded run (20 seeds, Standard, tuned table at lane/impairment S2):
//   drinks  lap ratio  off-track %  SDLP x sober  reversals x sober
//   1       1.002       0.0          1.2           0.75
//   2       1.118       5.1          6.2           3.15
//   3       1.177      10.4          7.5           3.29
//   4       1.268      18.6          9.2           2.80
//   5       1.333      21.1          9.7           2.73   (20/20 finish, worst 1.46x sober)
// Reversals fall from 3 drinks on BY DESIGN: the adapted bot slows its
// corrections. Do not "fix" that by raising wander.
// Not named *.test.mjs on purpose: `node --test` does not run it. The opt-in
// test form is calibration.test.mjs (set CALIBRATE=1).
import { runCalibration, formatReport } from './lib/calibration.mjs';
import { TABLE } from '../../public/js/impairment/params.js';

if (process.env.SPEC_TABLE) {
  TABLE.delayMs = [0, 30, 130, 180, 230, 280];
  TABLE.deadzone = [0, 0.03, 0.10, 0.14, 0.18, 0.22];
  TABLE.steerZeta = [1.00, 0.80, 0.50, 0.42, 0.36, 0.32];
  TABLE.wanderFastSd = [0, 0.03, 0.10, 0.14, 0.18, 0.22];
  console.error('[calibrate] using the spec ORIGINAL table');
}

const seeds = Number(process.argv[2]) || 20;
const t0 = Date.now();
const res = runCalibration({ seeds, log: (m) => console.error(`[calibrate] ${m} (${((Date.now() - t0) / 1000).toFixed(0)}s)`) });
console.log(formatReport(res));
process.exitCode = res.allOk ? 0 : 1;
