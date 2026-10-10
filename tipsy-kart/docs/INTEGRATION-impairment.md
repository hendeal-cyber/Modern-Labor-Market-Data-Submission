# Integrating the impairment lane

**Host `index.html`: nothing to add.** The engine's `public/js/main.js` already imports `/js/impairment/index.js` (listed in `/api/info` `plugins`) and calls its default export `install(game)`. If you ever load it by hand instead, add exactly this one tag after the engine's own module script:
`<script type="module" src="/js/impairment/index.js"></script>`
Both paths are idempotent: `install.js` also self-installs on `window.game`, on a `game-ready` event, or by polling.

## What it installs
- `game.inputFilters[0..3]` and `game.visualFx[0..3]` (human slots only; CPUs are never filtered).
- `game.impairment`: `getImpairmentStatus(slot)` -> `{drinks, bac, level, tierLabel, limit, overLimit, tier, water, waters, present}`, `adjustDrinks(slot, delta)`, `setWaterMode(slot, bool)`, `setBody(slot, {bodyKg, sex})`, `setSettings({intensity, limitLine, comfortVisuals, phoneSwim})`, `newNight()`, `hudModel(slot)`, `on(evt, cb)`.
  Bus events: `event`, `drinksChanged`, `settingsChanged`, `toast`, `round`.
- **Phone haptics contract:** every impairment event is sent with `game.emit('impairmentEvent', {type, slot})`. `type` is one of `'lapse' | 'invert' | 'hiccup' | 'fumble'`, and `slot` is 0-3 (humans only). Those are the only two keys. The same payload goes on the bus as `event`. `drinksChanged` (`[{slot, drinks, water}]`) and `settingsChanged` (the settings object) are also sent through `game.emit`.
- `getImpairmentStatus(slot).bac` is always the honest estimated BAC, also in water mode, where the level is 0 and the HUD shows the water icon. `overLimit = bac >= limit || (!water && level >= 1.5)`. The HUD bar colour is red whenever `overLimit` is true.
- Per-race state (the filter reset, the level snap and the random streams) is keyed on `session.raceSerial`, a night-wide counter bumped on every `raceStart`. The engine's `raceIndex` restarts at 0 each cup, so cup 2 would otherwise replay cup 1, and single-race cups would never reset.
- `index.js` exports read-only (deep-frozen) `TABLE` and `CAPS` copies. The mutable table in `params.js` is internal, for tuning only.
- `session.players[i].drinks` is owned here (+1 per human per `raceFinished`, DNF included, water players get `waters`). Each player also carries `water`, `bodyKg`, `sex`, `drinkLog`, and the mirrored display fields `bac`, `tierLabel`, `overLimit`, `impairLevel`. `session.seed` and `session.settings` are created if missing.
- A small "Tipsy" host settings button and panel (bottom left, hidden while racing), plus the "Round!" banner and race-3 toast at the top centre.

## For the phone-controller lane
Send `game.impairment.getImpairmentStatus(slot)` on `drinksChanged`/`settingsChanged` (and every few seconds for the falling BAC). Forward `game.impairment.on('event', ...)` to that slot's phone for haptics. Wire the phone +1/-1 and water controls (0.8 s hold) to `adjustDrinks` and `setWaterMode`. `session.settings.phoneSwim` says whether the buttons should swim. Do not add any delay on the phone.

## For the engine lane
Done in lane/engine 63542d1 and 5c03af5, merged here:
- `kartState.raceTime` (negative in the countdown) and `respawning` are used directly. The racePhase and speed-drop inferences remain only as fallbacks.
- `visualFx` gets `viewport {w, h}`, so `blurPx`, `ghostDx/Dy` and `joltPx` are in that viewport's CSS px.
- The HUD reads `hudModel(slot)`. These field names are stable: `icon`, `count`, `drinks`, `bacText` (`est. BAC 0.060%`), `barFill`, `limitTick`, `color` (`green`/`amber`/`red`), `tierLabel`, `overLimit` and `water`.
- `kartState.finished` stays fresh, which makes the B1 blink and jolt clearing reliable.
- `joltPx` renders as translateY, and `zoom: 1` is a no-op.

All of `blurPx, swayDeg, doubleVision, tunnel, hueShift, camLagS, fovWobbleDeg, saturate, ghostDx, ghostDy, zoom, blink, joltPx` are consumed. The ghost alpha is `0.42 * doubleVision` (max 0.315), inside the 0.40 cap.
- `zoom` is always 1, because the engine rolls the camera itself. A renderer that rotates the canvas with CSS can set `session.settings.cssRotateZoom = true` to get the corner-hiding zoom (at most 1.13).
- `joltPx` is halved by Comfort visuals.
- A lapse blink or hiccup jolt is cleared when `visualFx` is called with `kartState.finished`, or with a `time` more than 0.1 s past the last filter call.

**Open, for the engine lane:** `test/smoke.mjs` (5c03af5, around line 159) sets `session.players[0].bac = 0.06` and waits for the HUD to show `est. BAC 0.060%`. With this plugin installed, the HUD reads `game.impairment.hudModel(0)`, which derives BAC from drinks, so that check times out. Every other check passes, and the whole smoke test passes when `js/impairment/index.js` is absent. The fix belongs in the smoke test: when `game.impairment` exists, call `game.impairment.adjustDrinks(0, 2)` (which gives est. BAC 0.060%) instead of writing `p.bac`.

## Tests
- `node --test tipsy-kart/test/impairment/`: unit tests (about 7 s). `test/impairment/index.js` is a shim that makes the directory form work on Node 22.
- `CALIBRATE=1 node --test tipsy-kart/test/impairment/`, or `node tipsy-kart/test/impairment/calibrate.mjs [seeds]`: the spec 4.3 calibration (about 45 s). Add `SPEC_TABLE=1` to the CLI to see the spec's original table.
- `E2E=1 node --test tipsy-kart/test/impairment/`, or `node tipsy-kart/test/impairment/e2e-browser.mjs`: the real game in headless Chromium (needs `npm install`). Screenshots go to `test/screenshots/impairment-*.png`.

## Calibration record (20 seeds, Standard, adapted bot = best of the 27-combo grid)
The spec table failed L2 off-track (1.7 %, band 3-10), L4 (lap 1.407, off-track 33.6 %) and L5 (lap 1.665, off-track 40.6 %). The fix followed the spec's tuning order (wander, delay, damping, deadzone) and stays monotone and within the caps:

| Row | Spec L0..5 | Tuned L0..5 |
|---|---|---|
| wanderFastSd | 0, .03, .10, .14, .18, .22 | 0, .03, **.14, .155, .16, .16** |
| delayMs | 0, 30, 130, 180, 230, 280 | 0, 30, 130, **165, 185, 195** |
| steerZeta | 1, .8, .5, .42, .36, .32 | 1, .8, .5, **.40, .33, .28** |
| deadzone | 0, .03, .10, .14, .18, .22 | 0, .03, .10, **.12, .14, .15** |

| Drinks | Lap ratio (target) | Off-track % (target) | SDLP x sober | Reversals x sober |
|---|---|---|---|---|
| 1 | 1.002 (1.00-1.04) | 0.0 (<=1) | 1.2 (<=1.3) | 0.75 (<=1.2) |
| 2 | 1.118 (1.08-1.18) | 5.1 (3-10) | 6.2 (>=2.0) | 3.15 (>=1.5) |
| 3 | 1.177 (1.15-1.28) | 10.4 (6-15) | 7.5 (>=2.6) | 3.29 (>=1.7) |
| 4 | 1.268 (1.22-1.38) | 18.6 (9-20) | 9.2 (>=3.2) | 2.80 (>=1.9) |
| 5 | 1.333 (1.30-1.50) | 21.1 (12-25) | 9.7 (>=3.8) | 2.73 (>=2.0) |

Gate at L2: the naive bot averages 12.9 off-track excursions per lap. Cliff: SDLP(L2)/SDLP(L1) = 5.1. L5: 20/20 seeds finish, and the worst run is 1.46x the sober time.
History: the first tuning (wander .145/.15/.15 and delay 155/180/195 at L3..5) also passed. It flattened the step from race 3 to race 4 (off-track 8.7 % then 14.4 %), so the review (S2) restored the escalation with the rows above. Off-track at L4 now sits at 18.6 %, close to the 20 % ceiling, so do not raise L4 further.
**Reversal rate falls with drinks from L3 on, by design.** The adapted bot slows and smooths its corrections as latency grows, so it reverses less while it weaves more. Do not "fix" this by raising wander.
Bot note: besides the spec's 0.15 s delay and 2 % noise (low-pass, tau 0.25 s), the bot has a human-like aim drift (OU, 0.5 m, tau 2 s). Without it the sober SDLP is 0.13 m and every "x sober" ratio is meaningless.
