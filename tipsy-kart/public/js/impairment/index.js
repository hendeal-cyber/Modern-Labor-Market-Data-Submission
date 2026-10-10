// Plugin entry point. The engine's main.js imports `js/impairment/index.js`
// (listed by server.js in /api/info `plugins`) and calls its default export,
// install(game). install.js also self-installs on window.game / `game-ready`;
// both paths are idempotent.
import install from './install.js';
import { TABLE as LIVE_TABLE, CAPS as LIVE_CAPS } from './params.js';

export default install;
export * from './install.js';
export { paramsAt } from './params.js';
export { estimateBAC, levelFor } from './bac.js';
export { computeVisualFx } from './visual.js';

// Read-only snapshots for other lanes. The mutable TABLE in params.js stays
// internal (the calibration harness tunes it).
export const TABLE = Object.freeze(Object.fromEntries(
  Object.entries(LIVE_TABLE).map(([k, row]) => [k, Object.freeze(row.slice())]),
));
export const CAPS = Object.freeze({ ...LIVE_CAPS });
