# Tipsy Kart

An original browser-based 3D party kart racer. Up to 4 people race on one
laptop or TV, each using their own phone as the controller, against CPU karts.
Everything runs from a small Node server on your local network. No internet
connection is needed once the dependencies are installed.

> Tipsy Kart is just a game. Never drink and drive in real life.

## Run it

```bash
cd tipsy-kart
npm install        # three.js (already vendored) + playwright-core for tests
npm start          # or: PORT=8080 npm start
```

The server binds `0.0.0.0` on `PORT` (default 3000) and prints its URLs:

* **Host display**: open `http://localhost:3000/` on the laptop or TV.
* **Phones**: on the same Wi-Fi, open `http://<laptop-LAN-IP>:3000/controller`.
  The lobby shows this URL and has a QR code slot (`#join-qr`).

Three.js is vendored in `public/vendor/three.module.min.js` (MIT, see
`THREE_LICENSE.txt`) and loaded through an import map, so the game itself
works without npm.

### Playing without phones

Click **Add test player** in the lobby (up to 4 players), then **Start Cup**.

| Player | Steer | Accelerate / brake | Drift | Item |
| --- | --- | --- | --- | --- |
| P1 (slot 0) | A / D | W / S | Space | E |
| P2 (slot 1) | Left / Right | Up / Down | Shift | Enter |

Press **M** to mute or unmute.

### How to play

* **Drift.** Hold drift while you steer into a corner. Sparks change colour from
  teal to amber to pink as the charge builds. Let go for a mini-turbo; a bigger
  charge gives a longer boost.
* **Boost pads.** The orange chevrons on the road give you a burst of speed.
* **Off-road.** Grass, snow and sand shoulders slow you down, and so do mud
  patches on the road.
* **Item crates.** Drive through the spinning crates to roll an item. The odds
  depend on your position: karts at the back get more boosts and attack items.
  * **Fizz Boost**: a burst of speed.
  * **Sticky Spill**: drops a puddle behind you that spins out the next kart to hit it.
  * **Cork Bomb**: a cork thrown forward that bounces off walls and spins out the kart it hits.
  * **Bubble Shield**: blocks one hit for 7 seconds.
* **Respawn.** If you fall off the open ridge on Frosty Pint Pass or get stuck
  for a couple of seconds, you are put back on the track.
* **Scoring.** A cup is 4 races of 3 laps each by default. Places score
  15/12/10/8/6/4/2/1 points.

Circuits: **Hoppy Hills**, **Neon Nightcap**, **Frosty Pint Pass**, **Lime Lagoon**.

## Tests

```bash
npm test            # = node test/smoke.mjs
```

The smoke test boots the server in-process on a random port and opens `/` in
headless Chromium (playwright-core; it never downloads browsers). It falls back
to `/opt/pw-browsers/chromium` or `$CHROMIUM_PATH`. The test then:

1. adds test players and starts the cup,
2. drives slot 0 with `setPlayerInput` and checks that the kart moves and its lap progress grows,
3. checks that the CPU karts move,
4. checks the input-filter and visual-effect seams and that `useItem` is edge-triggered,
5. fast-forwards each race with `debugFinishRace()` and checks the `raceFinished`, `racesCompleted` and `cupFinished` behaviour,
6. checks the 4-player and 1-player layouts,
7. fails if the page logs any console error.

Screenshots are saved to `test/screenshots/`, which is gitignored.

## Architecture

```
tipsy-kart/
  server.js               static server, /controller, /api/info, attaches net/hub.js
  net/hub.js              network hub (phone-controller lane), attach(httpServer)
  public/
    index.html            host display (lobby / race / results / standings)
    controller.html       phone controller (phone-controller lane)
    css/host.css
    vendor/three.module.min.js
    js/main.js            creates window.game, loads optional host plugins
    js/game/
      game.js             session, cup flow, window.game API, fixed-step loop
      race.js             countdown, laps, positions, items, hazards, bumping, rubber-band
      kart.js             arcade kart physics (drift tiers, boost, walls, respawn)
      ai.js               CPU driver (racing line, drifting, items)
      track.js            spline sampling + "where am I" queries (pure data)
      tracks.js           the four original circuits
      trackView.js        road/walls/scenery meshes per theme
      kartModel.js        low-poly kart + geometric driver, sparks, flames, shield
      itemsView.js        item crates, puddles, corks
      viewports.js        split-screen rendering, chase cams, per-player FX + HUD, minimap
      ui.js               DOM screens
      input.js            keyboard fallback
      audio.js            procedural WebAudio engine hum + sound effects
    js/net/               phone-controller lane (host entry: js/net/index.js)
    js/impairment/        impairment lane (host entry: js/impairment/index.js)
  test/smoke.mjs
```

### Server

* `node server.js` (`npm start`) auto-starts the server only when the file is run directly.
* `require('./server').start({ port, host, quiet })` returns a Promise of
  `{ httpServer, port, httpsPort, close() }`. Pass `port: 0` to get a random free port.
  `httpsPort` is read from the hub if `net/hub.js` exports `ready()` and `info()`:
  the server awaits `hub.ready()` for at most 5 s, then reads `hub.info().httpsPort`.
  Otherwise `httpsPort` is `null`. `close()` also calls `hub.close()` if the hub has one.
* If `net/hub.js` exists, `require('./net/hub').attach(httpServer)` is called before the server listens.
* `GET /api/info` returns
  `{ port, lanUrls, controllerUrls, plugins }`.
  `plugins` lists which of `js/net/index.js` and `js/impairment/index.js` exist.

### Host plugins

After `window.game` is built, `js/main.js` imports every module listed in
`/api/info`'s `plugins`. If a module exports a default function, or an
`install` function, it is called with `game`. Other modules can also wait for
the `game-ready` window event or check `window.game.ready === true`. When all
plugins have loaded, the game emits `pluginsLoaded`.

### `window.game` contract

| Member | Description |
| --- | --- |
| `setPlayerInput(slot, {steer:-1..1, throttle:0..1, brake:0..1, drift:bool, useItem:bool})` | Raw input for human slot 0-3. Values are clamped. `useItem` is edge-triggered: one item fires per false-to-true transition, even if the press lands between physics steps. Holding it or resending `true` does nothing more. |
| `addPlayer({slot, name, color})` | Adds a player or reconnects one. `slot` is optional; the first free slot is used. Emits `playerJoined`. |
| `removePlayer(slot)` | In the lobby, removes the player. During a cup, marks them disconnected; their kart coasts. Emits `playerLeft`. |
| `inputFilters[0..3]` | `(input, dt, ctx) => input`, identity by default. Called every physics step (120 Hz) for **human** karts only, with `ctx = {time, speed, kartState, drinks, raceIndex, slot}`. `kartState` holds `speed, maxSpeed, drifting, driftTier, boosting, offroad, spinning, place, lap, item, finished, wrongWay, heading, grounded, racePhase, raceTime, respawning`. `raceTime` is the number of seconds since GO and is negative during the countdown. `respawning` is true while the kart is falling off the track or is frozen just after a respawn. CPU karts never use the filters. |
| `visualFx[0..3]` | `(ctx) => fx`, called every frame for that player's viewport with `ctx = {time, slot, speed, kartState, drinks, raceIndex, viewport:{w,h}}`, where `viewport` is in CSS px. The base fields are `blurPx, swayDeg, doubleVision 0..1, tunnel 0..1, hueShift` (deg). Optional fields: `camLagS` (extra chase-cam lag, seconds), `fovWobbleDeg` (added to FOV this frame), `saturate` (CSS multiplier, default 1), `ghostDx/ghostDy` (double-vision ghost offset in CSS px), `zoom` (canvas scale, default 1), `blink` (0..1 black overlay), `joltPx` (vertical bump in CSS px, where the sign gives the direction). Every field defaults to a no-op. |
| `session` | `{raceIndex, totalRaces, laps, players:[{slot,name,color,connected,racesCompleted,drinks}]}`. `raceIndex` is 0-based. `racesCompleted` is incremented before `raceFinished` fires. The impairment lane owns `drinks`, and may set an optional `bac` number, which the HUD shows as `est. BAC 0.060%`. |
| `on(evt, cb)` → unsubscribe, `off`, `emit(evt, payload)` | Events: `playerJoined`, `playerLeft`, `raceStart`, `raceFinished(results)`, `cupFinished(standings)`, `stateChanged(state)`, `pluginsLoaded`. Identical `playerJoined`/`playerLeft` emits for the same slot within 250 ms are merged, so the hub may emit them too. |
| `startCup(opts?)`, `nextRace()`, `toLobby()` | Cup flow. `opts`: `{races, laps, cpuCount}`, where `cpuCount` is `'auto'` (fill to 8) or a number. `nextRace()` moves from results to the next race, then to the standings, then back to the lobby. |
| `getState()` | A serialisable summary: `phase` (`lobby/countdown/racing/raceResults/cupResults`), `raceIndex`, `totalRaces`, `laps`, `track`, `countdown`, `raceTime`, `players` (with HUD fields merged in), `hud:[{slot, place, lap, totalLaps, item, finished, speed, wrongWay, drifting, driftTier, boosting, totalKarts}]`, `positions` (every kart, with `progress`/`lapProgress`), `standings`, `lastResults`. |
| `impairment.hudModel(slot)` (optional, provided by the impairment lane) | If present, the HUD shows its `bacText`, a bar filled to `barFill` (0..1) in `color` (`green`/`amber`/`red`) with a LIMIT tick at `limitTick` (0..1), and `tierLabel`. The drink count comes from `count` and the icon from `icon`/`water`. The model is polled about every 250 ms per viewport. |
| `refreshUI()` | Re-renders the lobby, results or standings after `drinks` changes outside an event. |
| `debugFinishRace()` | Finishes the current race in the running order and returns the results. |
| `debug.autopilot(slot, on)` | Lets the CPU driver steer a human slot. Its input still goes through `inputFilters`. |
| `debug.setTimeScale(s)` | Speeds up or slows down the simulation. |
| `ready` | `true` once the game is constructed. A `game-ready` window event is also dispatched. |

#### Gameplay events for phone haptics

The following events are emitted with `game.emit` for human slots only. CPU karts never emit them.

| Event | Payload | When |
| --- | --- | --- |
| `hit` | `{slot, kind}` | `kind` is `'slick'` (ran into a Sticky Spill) or `'bouncer'` (hit by a Cork Bomb), or a bump: `'wall'` (wall impact at more than 6 units/s into the wall) or `'kart'` (kart-to-kart bump at more than 5 units/s closing speed). Bumps are throttled to one per 300 ms per slot. |
| `boost` | `{slot, tier, source}` | `source` is `'drift'` (mini-turbo, `tier` 1-3), `'pad'` (boost pad, `tier` 0) or `'item'` (Fizz Boost, `tier` 0). |
| `itemUsed` | `{slot, item}` | An item was fired. `item` is one of `fizz`, `slick`, `bouncer`, `bubble`. |
| `itemGot` | `{slot, item}` | The item roulette finished and the item is ready. |
| `lap` | `{slot, lap, totalLaps}` | The player crossed the line and started lap `lap`, which is 2 or more. |
| `finish` | `{slot, place}` | The player finished the race. `debugFinishRace()` does not emit it. |

`raceFinished` results are an array of
`{place, id, name, color, isHuman, slot, finished, time, bestLap, points, totalPoints}`.
`cupFinished` standings are
`[{rank, id, name, color, isHuman, slot, points}]`.

`stateChanged` fires on every phase change, on every countdown tick, when a
player joins or leaves, and whenever a human's place, lap, item or finish
state changes. During a race it is checked at most 4 times a second.

### Rendering notes

One shared WebGL renderer draws each viewport and copies the frame into that
player's own `<canvas>`. Per-player CSS filters, the tunnel and blink overlays
and the double-vision ghost therefore affect only that player's view. The
split is 1, 2 (stacked), 3 (2x2, with live standings in the spare cell) or 4
(2x2). The kart, track and scenery models are low-poly geometry with vertex
colours, mostly instanced, at about 30-40 draw calls per viewport.
