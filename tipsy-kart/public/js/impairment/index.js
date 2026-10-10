// Plugin entry point. The engine's main.js imports `js/impairment/index.js`
// (listed by server.js in /api/info `plugins`) and calls its default export,
// install(game). install.js also self-installs on window.game / `game-ready`;
// both paths are idempotent.
import install from './install.js';

export default install;
export * from './install.js';
export { paramsAt, TABLE, CAPS } from './params.js';
export { estimateBAC, levelFor } from './bac.js';
export { computeVisualFx } from './visual.js';
