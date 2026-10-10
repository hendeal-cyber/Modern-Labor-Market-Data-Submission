# Impairment lane handoff (branch `lane/impairment`)

Spec: `tipsy-kart/docs/research/impairment.md` (merged from `lane/research-impairment` f1cf4cc). Engine merged from `lane/engine` 1e8234d.
Integration notes, engine requests and the calibration record: `tipsy-kart/docs/INTEGRATION-impairment.md`.

## Status: complete
- All of the spec is implemented in `tipsy-kart/public/js/impairment/` (no DOM in the core). The entry point is `index.js`, whose default export `install(game)` the engine's `main.js` calls automatically.
- `node --test tipsy-kart/test/impairment/`: 60 tests, 58 pass and 2 skipped (the opt-in calibration and E2E).
- `CALIBRATE=1`: all 4.3 targets met (4 table rows retuned; see the integration doc).
- `E2E=1`: the real game with 4 test players at drinks 0, 2 and 5 passes. The filters are identity at 0 and change about 100 % of frames at 2 and 5. Filters are only called for human slots, and the CPU karts receive exactly their AI output. Blur, tunnel and ghost show on every human viewport. raceFinished gives +1. No console errors. Screenshots: `test/screenshots/impairment-*.png`.

## How to run
- `node --test tipsy-kart/test/impairment/` (about 10 s)
- `CALIBRATE=1 node --test tipsy-kart/test/impairment/`, or `node tipsy-kart/test/impairment/calibrate.mjs [seeds]` (`SPEC_TABLE=1` uses the spec's original table)
- `cd tipsy-kart && npm install`, then `E2E=1 node --test test/impairment/`, or `node test/impairment/e2e-browser.mjs`
- Tuning scratch: `node tipsy-kart/test/impairment/lib/tune.mjs wanderFastSd=0,.03,.14,.145,.15,.15 levels=2,3 seeds=8`

## Open items (for other lanes)
- Engine: add `kartState.raceTime` and `respawning` to the filter ctx; pass `viewport {w,h}` to visualFx; show the BAC with 3 decimals. `npm test` (engine smoke) passes with this plugin on lane/engine 1e8234d.
- Phone lane: use `getImpairmentStatus`, `adjustDrinks`, `setWaterMode`, and `game.impairment.on('event')` for haptics.
