// Plugin entry point. server.js (engine lane) lists `js/impairment/index.js` in
// /api/info `plugins` when this file exists, so the host page can import it
// automatically. It simply loads install.js, which does the work.
export * from './install.js';
export { paramsAt, TABLE, CAPS } from './params.js';
export { estimateBAC, levelFor } from './bac.js';
export { computeVisualFx } from './visual.js';
