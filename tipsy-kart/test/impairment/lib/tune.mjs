// Scratch tuning helper: node lib/tune.mjs key=0,1,2,3,4,5 key2=... [levels=0,1,2,3,4,5] [seeds=8]
import { sweepLevel } from './sim.mjs';
import { TABLE } from '../../../public/js/impairment/params.js';

let levels = [0, 1, 2, 3, 4, 5];
let nSeeds = 8;
for (const a of process.argv.slice(2)) {
  const [k, v] = a.split('=');
  if (k === 'levels') { levels = v.split(',').map(Number); continue; }
  if (k === 'seeds') { nSeeds = Number(v); continue; }
  TABLE[k] = v.split(',').map(Number);
}
const seeds = Array.from({ length: nSeeds }, (_, i) => i + 1);
let base = null;
for (const d of [0, ...levels.filter((x) => x !== 0)]) {
  const { best, naive } = sweepLevel({ drinks: d, seeds });
  const m = best.m;
  if (!base) base = m;
  console.log(d, 'best', JSON.stringify(best.combo), 'fin', m.finishedCount, 'lap', (m.lapTime / base.lapTime).toFixed(3), 'off%', m.offTrackPct.toFixed(1), 'sdlp', m.sdlp.toFixed(2), 'x', (m.sdlp / base.sdlp).toFixed(1), 'rev x', (m.revPerMin / base.revPerMin).toFixed(2), 'exc', m.excursionsPerLap.toFixed(2), '| naive: sdlp', naive.sdlp.toFixed(2), 'exc', naive.excursionsPerLap.toFixed(2), 'lap', (naive.lapTime / base.lapTime).toFixed(2));
}
