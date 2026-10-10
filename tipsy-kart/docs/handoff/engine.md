# Engine lane handoff

Branch: `lane/engine`. Worktree: `.claude/worktrees/agent-a99f73f95dc94826e`.

## Done (the smoke test passes, 34/34 checks, with zero console errors)
- `server.js`: binds 0.0.0.0 on PORT (default 3000), prints the LAN URLs and serves `/controller`, `/api/info` (LAN URLs + plugin list) and `/favicon.ico` (204). It exports `start({port, host, quiet}) -> Promise<{httpServer, port, close()}>` and auto-starts only when `require.main === module`. It calls `net/hub.js` `attach(httpServer)` if that file exists.
- Three.js r169 is vendored at `public/vendor/three.module.min.js` and loaded through an import map.
- Host page (`public/index.html` + `js/main.js` + `js/game/*`):
  - Screens: lobby with `#join-qr`, player cards, settings and the disclaimer line; race; results; standings.
  - Four original tracks.
  - Arcade physics: 3 drift tiers, boost pads, mud/off-road, walls, respawn and an open ridge you can fall off.
  - Four items: Fizz Boost, Sticky Spill, Cork Bomb and Bubble Shield, with position-weighted odds.
  - CPU AI with drifting, item use and rubber-banding.
  - 1/2/3/4-way split screen. Each viewport is its own canvas, filled from one shared WebGL renderer.
  - HUD, minimap, procedural audio with mute, and keyboard fallback.
- Host plugins: `js/main.js` imports `js/net/index.js` and `js/impairment/index.js` when they exist (taken from `/api/info` `plugins`). It calls their default export or `install(game)`.
- `test/smoke.mjs` uses playwright-core with `/opt/pw-browsers/chromium` as the fallback.
- `README.md` documents the whole contract.

## Manager contract additions: all done
1. `window.game.emit(evt, payload)` is public. Duplicate `playerJoined`/`playerLeft` emits for the same slot within 250 ms are merged.
2. `useItem` is edge-triggered and latched between physics steps. The smoke test checks this.
3. `getState().hud = [{slot, place, lap, totalLaps, item, finished, speed, ...}]`. The same fields are also merged into `players`.
4. `server.js` exports `start()` and only auto-starts when run directly.
5. The extra visualFx fields `camLagS`, `fovWobbleDeg`, `saturate`, `ghostDx`/`ghostDy`, `zoom`, `blink` and `joltPx` are consumed. Each defaults to a no-op.
6. The title line "Tipsy Kart is just a game. Never drink and drive in real life." is shown.
7. The `game-ready` window event fires and `window.game.ready = true` is set.

## Follow-up (haptics): done
- Per-slot events: `hit {slot, kind}`, `boost {slot, tier, source}`, `itemUsed {slot, item}`, `itemGot {slot, item}`, `lap {slot, lap, totalLaps}` and `finish {slot, place}`. They are emitted for human slots only. Wall and kart bumps are throttled to one per 300 ms per slot.
- `start()` also resolves `httpsPort`, taken from `hub.info()` after `await hub.ready()` (5 s timeout), or `null`.
- The smoke test now waits on simulated time instead of wall-clock time, so a busy machine does not fail it.

## In progress / next steps
- Optional polish: puffier clouds, wheel spin, and a start-boost mechanic.
- Re-run `npm test` after merging the other lanes. The test fails on any console error.

## Run / test
```
cd tipsy-kart && npm install && npm start      # host at http://localhost:3000/
npm test                                         # headless smoke test, screenshots in test/screenshots/
```
