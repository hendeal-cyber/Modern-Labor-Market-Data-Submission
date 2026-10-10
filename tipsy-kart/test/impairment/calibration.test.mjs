// T14: full calibration protocol (slow, opt-in).  CALIBRATE=1 node --test tipsy-kart/test/impairment/
import test from 'node:test';
import assert from 'node:assert/strict';
import { runCalibration, formatReport } from './lib/calibration.mjs';

test('T14 calibration bands (20 seeds, full grid)', { skip: process.env.CALIBRATE ? false : 'set CALIBRATE=1 to run (about a minute)', timeout: 600000 }, () => {
  const res = runCalibration({ seeds: 20 });
  console.log(formatReport(res));
  for (const c of res.checks) assert.ok(c.ok, `${c.name}: ${c.value}`);
});
