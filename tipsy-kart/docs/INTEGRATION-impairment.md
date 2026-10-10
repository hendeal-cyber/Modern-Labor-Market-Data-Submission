# Integrating the impairment lane

**Host `index.html`: nothing to add.** The engine's `public/js/main.js` already imports `/js/impairment/index.js` (listed in `/api/info` `plugins`) and calls its default export `install(game)`. If you ever load it by hand instead, add exactly this one tag after the engine's own module script:
`<script type="module" src="/js/impairment/index.js"></script>`
Both paths are idempotent: `install.js` also self-installs on `window.game`, on a `game-ready` event, or by polling.

## What it installs
- `game.inputFilters[0..3]` and `game.visualFx[0..3]` (human slots only; CPUs are never filtered).
- `game.impairment`: `getImpairmentStatus(slot)` -> `{drinks, bac, level, tierLabel, limit, overLimit, tier, water, waters, present}`, `adjustDrinks(slot, delta)`, `setWaterMode(slot, bool)`, `setBody(slot, {bodyKg, sex})`, `setSettings({intensity, limitLine, comfortVisuals, phoneSwim})`, `newNight()`, `hudModel(slot)`, `on(evt, cb)`.
  Bus events: `event` `{type: 'lapse'|'invert'|'hiccup'|'fumble', slot}` (phone haptics), `drinksChanged`, `settingsChanged`, `toast`, `round`. The same `impairmentEvent`/`drinksChanged`/`settingsChanged` are also sent through `game.emit`.
- `session.players[i].drinks` is owned here (+1 per human per `raceFinished`, DNF included, water players get `waters`). Each player also carries `water`, `bodyKg`, `sex`, `drinkLog`, and the mirrored display fields `bac`, `tierLabel`, `overLimit`, `impairLevel`. `session.seed` and `session.settings` are created if missing.
- A small "Tipsy" host settings button and panel (bottom left, hidden while racing), plus the "Round!" banner and race-3 toast at the top centre.

## For the phone-controller lane
Send `game.impairment.getImpairmentStatus(slot)` on `drinksChanged`/`settingsChanged` (and every few seconds for the falling BAC). Forward `game.impairment.on('event', ...)` to that slot's phone for haptics. Wire the phone +1/-1 and water controls (0.8 s hold) to `adjustDrinks` and `setWaterMode`. `session.settings.phoneSwim` says whether the buttons should swim. Do not add any delay on the phone.

## For the engine lane (small requests)
1. Filter ctx `kartState`: please add `raceTime` (s since GO) and `respawning` (or `frozen`). Today the lane infers GO from `racePhase === 'countdown'` and a respawn from a one-step stop to zero speed.
2. `visualFx[slot](arg)`: pass `arg.viewport = {w, h}` (CSS px of that viewport) so `blurPx`, `ghostDx/Dy` and `joltPx` scale to the viewport. Without it they are in px for a 1920x1080 reference.
3. HUD: show `est. BAC 0.060%` (three decimals) from `p.bac`, and optionally `p.tierLabel`.
4. Visual fields: all of `blurPx, swayDeg, doubleVision, tunnel, hueShift, camLagS, fovWobbleDeg, saturate, ghostDx, ghostDy, zoom, blink, joltPx` are consumed by lane/engine 3c2d5dc. The ghost alpha there is `0.42 * doubleVision` (max 0.315), inside the 0.40 cap.
5. `test/smoke.mjs` passes with this plugin installed, on lane/engine 1e8234d (merged here as d0a489c). The 3c2d5dc version used wall-clock sleeps and was flaky under load, with or without the plugin.

## Tests
- `node --test tipsy-kart/test/impairment/`: unit tests (about 7 s). `test/impairment/index.js` is a shim that makes the directory form work on Node 22.
- `CALIBRATE=1 node --test tipsy-kart/test/impairment/`, or `node tipsy-kart/test/impairment/calibrate.mjs [seeds]`: the spec 4.3 calibration (about 45 s). Add `SPEC_TABLE=1` to the CLI to see the spec's original table.
- `E2E=1 node --test tipsy-kart/test/impairment/`, or `node tipsy-kart/test/impairment/e2e-browser.mjs`: the real game in headless Chromium (needs `npm install`). Screenshots go to `test/screenshots/impairment-*.png`.

## Calibration record (20 seeds, Standard, adapted bot = best of the 27-combo grid)
The spec table failed L2 off-track (1.7 %, band 3-10), L4 (lap 1.407, off-track 33.6 %) and L5 (lap 1.665, off-track 40.6 %). The fix followed the spec's tuning order (wander, delay, damping, deadzone) and stays monotone and within the caps:

| Row | Spec L0..5 | Tuned L0..5 |
|---|---|---|
| wanderFastSd | 0, .03, .10, .14, .18, .22 | 0, .03, **.14, .145, .15, .15** |
| delayMs | 0, 30, 130, 180, 230, 280 | 0, 30, 130, **155, 180, 195** |
| steerZeta | 1, .8, .5, .42, .36, .32 | 1, .8, .5, **.40, .33, .28** |
| deadzone | 0, .03, .10, .14, .18, .22 | 0, .03, .10, **.12, .14, .15** |

| Drinks | Lap ratio (target) | Off-track % (target) | SDLP x sober | Reversals x sober |
|---|---|---|---|---|
| 1 | 1.002 (1.00-1.04) | 0.0 (<=1) | 1.2 (<=1.3) | 0.75 (<=1.2) |
| 2 | 1.118 (1.08-1.18) | 5.1 (3-10) | 6.2 (>=2.0) | 3.15 (>=1.5) |
| 3 | 1.167 (1.15-1.28) | 8.7 (6-15) | 7.2 (>=2.6) | 2.95 (>=1.7) |
| 4 | 1.235 (1.22-1.38) | 14.4 (9-20) | 8.3 (>=3.2) | 2.68 (>=1.9) |
| 5 | 1.336 (1.30-1.50) | 21.7 (12-25) | 9.7 (>=3.8) | 2.37 (>=2.0) |

Gate at L2: the naive bot averages 12.9 off-track excursions per lap. Cliff: SDLP(L2)/SDLP(L1) = 5.1. L5: 20/20 seeds finish, and the worst run is 1.49x the sober time.
Bot note: besides the spec's 0.15 s delay and 2 % noise (low-pass, tau 0.25 s), the bot has a human-like aim drift (OU, 0.5 m, tau 2 s). Without it the sober SDLP is 0.13 m and every "x sober" ratio is meaningless.
