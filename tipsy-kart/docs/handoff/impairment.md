# Impairment lane handoff (branch `lane/impairment`)

Spec: `tipsy-kart/docs/research/impairment.md` (merged from `lane/research-impairment` f1cf4cc).

## Done
- Core ES modules in `tipsy-kart/public/js/impairment/` (no DOM in core):
  `rng.js`, `params.js` (table, caps, `paramsAt`), `bac.js` (Widmark, `levelFor`, tiers), `ring.js` (latency ring),
  `filter.js` (`createImpairment`: delay, deadzone, underdamped steer spring, OU wander, pedals lag/wobble,
  missed presses, lapse/invert/hiccup events with safety gating), `visual.js` (`computeVisualFx`),
  `drinks.js` (raceFinished counting, `getImpairmentStatus`, `adjustDrinks`, `setWaterMode`, `setBody`,
  `setSettings`, `newNight`, `hudModel`, bus events), `host-settings.js` (self-injecting DOM panel, banner, toast,
  localStorage), `install.js` (wires `window.game`; handles engine before/after via `game-ready` + polling),
  `index.js` (plugin entry; engine `server.js` already lists `js/impairment/index.js`), `package.json` (`type: module`).
- Tests in `tipsy-kart/test/impairment/*.test.mjs` (T1-T14 covered), helpers in `lib/`, `index.js` shim so
  `node --test tipsy-kart/test/impairment/` works on Node 22 (a bare directory arg is otherwise resolved as a module).
- Calibration harness: `lib/sim.mjs`, `lib/calibration.mjs`, CLI `calibrate.mjs`, opt-in test `calibration.test.mjs`.
- Last verified: 57 tests (56 pass, 1 skipped = calibration); with `CALIBRATE=1` 57/57 pass, ALL TARGETS MET.

## Calibration (20 seeds, adapted bot, Standard intensity)
Retuned rows vs spec (L = 0..5): delayMs [0,30,130,155,180,195] (spec ..180,230,280);
deadzone [0,.03,.10,.12,.14,.15] (spec ..,.14,.18,.22); steerZeta [1,.8,.5,.40,.33,.28] (spec ..,.42,.36,.32);
wanderFastSd [0,.03,.14,.145,.15,.15] (spec 0,.03,.10,.14,.18,.22).
Before tuning (`SPEC_TABLE=1`): L2 off-track 1.7% (band 3-10), L4 lap 1.407 / off 33.6%, L5 lap 1.665 / off 40.6% (all out of band).
After: lap ratio 1.002/1.118/1.167/1.235/1.336, off-track 0/5.1/8.7/14.4/21.7 % for 1..5 drinks, L5 20/20 finish, worst run 1.49x sober.
Bot deviation from 4.3: added human-like aim drift (OU, 0.5 m, tau 2 s) and low-frequency (tau 0.25 s) 2% command noise,
otherwise the sober SDLP is ~0.13 m and every SDLP ratio is meaningless.

## How to run
- Tests: `node --test tipsy-kart/test/impairment/` (about 7 s). Calibration: `CALIBRATE=1 node --test tipsy-kart/test/impairment/`
  or `node tipsy-kart/test/impairment/calibrate.mjs [seeds]` (about 40 s); `SPEC_TABLE=1` runs the original spec table.
- Tuning scratch: `node tipsy-kart/test/impairment/lib/tune.mjs key=0,1,2,3,4,5 ... levels=2,3 seeds=8`.

## Still to do (exact next steps)
1. Write `tipsy-kart/docs/INTEGRATION-impairment.md` containing the one-liner for the host `index.html`:
   `<script type="module" src="/js/impairment/install.js"></script>` (or `/js/impairment/index.js`), plus the calibration/tuning record above
   and the visual-field table below.
2. Commit in logical chunks (core is committed as 5802887; tests, harness, drinks/install/host-settings and docs are not yet split into commits).
3. Final report: branch, SHA, worktree path, file list, test output, calibration numbers, integration steps, deviations.

## Visual fields for the engine lane
Contract fields consumed by engine: blurPx, swayDeg, doubleVision, tunnel, hueShift.
Extras not yet in the engine contract (route to engine lane): camLagS (chase-camera yaw delay), fovWobbleDeg, saturate,
ghostDx/ghostDy (px at 1920x1080; pass viewport as `visualFx[slot](t, {w,h})` to get scaled values), zoom (hides rotated corners), blink (lapse eyelid), joltPx.
Engine should also send `kartState.raceTime` (s since GO), `speedNorm`, `respawning`, `isCpu` in ctx for the safety gating.

## Spec deviations so far
- Four table rows retuned (above). Bot has extra aim/noise realism (above).
- `overLimit` = est. BAC >= limit OR level >= 1.5, so the race-3 floor reads as over the limit for heavy players.
- Water mode reports bac 0 (drinks kept). Empty `results` on raceFinished falls back to connected players.
- Identity path sanitises non-clean input instead of returning NaN; returns the same object for clean input.
- Spring bypassed below Tn 4 ms and substepped by h*wn <= 0.5 (spec's 1e-4 threshold is unstable at 240 Hz).
- `racesCompleted` is not incremented (engine owns it, per contract).
