# Phone controller integration (controller lane)

Spec: `docs/research/phone-controls.md`. Branch: `lane/controller`.
This file lists what the engine and the other lanes need to know, and what is still open.

## 1. Nothing to change in `server.js`

`server.js` (engine) already calls `require('./net/hub').attach(httpServer)` in `start()`. That one call:

- wraps the server's existing `'request'` listeners, so `/sse` and `/msg` (POST) are answered by the hub, and
  `/api/info` gets the hub's fields merged into the engine's JSON. Every other request still goes to the
  engine's static handler, so the engine's handler can keep refusing non-GET methods;
- answers WebSocket upgrades on `/ws` (and destroys the socket for any other path or a foreign `Origin`);
- once the HTTP server is listening, starts an **HTTPS twin** on `HTTPS_PORT` (default 3443). It uses the same
  request handler and the same hub, with a self-signed certificate made by `net/cert.js`;
- wraps `httpServer.close()` so the hub's timers, sockets and the HTTPS server shut down with it.

`require('./net/hub').ready()` resolves once HTTPS is listening, or once it has been given up on.
`require('./net/hub').info()` returns the join URLs. The engine's startup banner still prints the plain-HTTP
phone links. The hub prints a second block with the https QR link (set `TIPSY_QUIET=1` to silence it).
Optionally, the engine banner could drop its phone lines and print `hub.info().joinUrl` instead.

## 2. Host page: nothing to change in `index.html`

`public/js/main.js` (engine) imports every entry in `/api/info` `plugins` and calls its default export with
`game`. `public/js/net/index.js` is that entry: its default export (also exported as `install` and `init`)
starts the bridge. It is idempotent and also self-starts on import if `window.game` exists. A page without the
engine's plugin loader would need exactly:

```html
<script type="module" src="/js/net/index.js"></script>
```

**Join QR.** If the page has `#join-qr`, the bridge puts the QR `<svg>` into it as a direct child, so the
engine's `.qr-placeholder > svg` CSS applies. It also writes the https join URL into `#join-url` and the
plain-http "No tilt?" link into `#join-alt`, and adds a "Wrong address? ▸" button plus a "Phones can't
connect?" help block (`#tk-join-extra`) after `#join-alt`. Every 2 s it re-reads `/api/info`, because HTTPS comes
up a moment after HTTP and the engine writes its own http URL into `#join-url` at startup. Without `#join-qr`,
a floating join panel with player cards is shown in the lobby (press **J** to toggle).

## 3. Contract as used (all feature-detected)

| Used | Status on `lane/engine` 3c2d5dc |
|---|---|
| `addPlayer({slot,name,color})`, `removePlayer(slot)` | present |
| `setPlayerInput(slot,{steer,throttle,brake,drift,useItem})` with RAW input | present. The bridge sends `useItem:true` on exactly one call per ITEM press, and the engine latches its rising edge |
| `session.players[]` (found by `.slot`) | present. The bridge sets `name`, `color`, `connected`, `ready`. For `drinks` it calls `game.adjustDrinks(slot, delta)` when that exists and otherwise writes `players[i].drinks` |
| `on(evt)`: raceStart, raceFinished, cupFinished, stateChanged, playerLeft | present |
| `emit(evt)` | present. The bridge emits `playerJoined` (`{slot,name,color,reconnected}`), `playerLeft` (`{slot,reason,released}`), `playerRenamed`, `playerReady` and `drinkChanged`, and also dispatches `tipsy:<evt>` CustomEvents on `window` |
| `getState().phase` | present: lobby, countdown, racing, raceResults, cupResults. These map to the phone phases lobby, countdown, racing, results, cupResults |
| `getState().hud[]` `{slot,place,lap,totalLaps,item,finished,totalKarts}` | present. The phones show place, laps and item from it |
| `getState().countdown` | present. Each new countdown number sends a `tick` vibe |
| `refreshUI()` | present. Called after a phone changes name, drinks or connection |
| `getImpairmentStatus(slot)` → `{drinks,bac,level,tierLabel,limit,overLimit}` | **not on the engine yet** (impairment lane). When present, the phone meter shows `level/5`, because the impairment spec's level runs 0..5, with the label `tierLabel`. Without it, the fallback is drinks/6 with the labels Sober, Warm, Giggly, Wobbly and Legless |
| `adjustDrinks(slot, delta)` | **not on the engine yet** (impairment lane). Used when present |
| `setWaterMode(slot, bool)` | not used: the phone has no water button yet |
| `on('hit'/'boost'/'itemUsed', {slot})` | not emitted by the engine. The phone `bump`/`boost`/`item` vibes stay silent until it is |

Remove-button interop: when the lobby's own remove (✕) button calls `game.removePlayer(slot)` on a phone player,
the bridge sees `playerLeft` with the player gone from `session.players` and sends `kick` to the hub. The phone
then shows "You were removed" and the slot is freed. Without this, the phone would keep a slot that the game
had forgotten.

## 4. Running it and joining from 4 phones

```bash
cd tipsy-kart
npm install          # ws + selfsigned (falls back to net/ws-lite.js and the openssl CLI if they are missing)
npm start            # http :3000 and https :3443
```

1. On the laptop, open `http://localhost:3000/`. The lobby shows a QR code for `https://<lan-ip>:3443/controller`.
2. Each phone (same Wi-Fi) scans it. The first visit shows a certificate warning. On iPhone: Show Details → visit
   this website → Visit Website. On Android: Advanced → Proceed. Then type a name and tap **Let's go**. That tap
   asks for motion access (iOS), enters fullscreen and landscape (Android), and takes a wake lock. Hold the
   phone like a wheel and tap **Ready** to calibrate tilt.
3. Up to 4 phones get slots P1 to P4, coloured Cherry, Sky, Lemon and Mint. A 5th phone waits in a queue.
4. The link under the QR, `http://<lan-ip>:3000/controller`, has no warning but offers touch steering only,
   because browsers withhold motion sensors on insecure origins.

Environment variables: `PORT` (3000), `HTTPS_PORT` (3443), `TIPSY_HTTPS=0` (HTTP only), `TIPSY_JOIN=http` (put
the http URL in the QR), `TIPSY_HOST=<ip>` (force the advertised address), `TIPSY_CERT`/`TIPSY_KEY` (your own,
for example mkcert), `TIPSY_CERT_DIR`, `TIPSY_IDLE_MS` (180000), `TIPSY_LOBBY_RESERVE_MS` (60000),
`TIPSY_HOST_ANY=1` (let a non-local browser be the host), `TIPSY_WS=lite` (force the hand-rolled WebSocket
server) and `TIPSY_QUIET=1`.

## 5. Tests

```bash
cd tipsy-kart
npm run test:net     # node --test --test-concurrency=1 test/net/*.test.js   (44 tests, ~3.5 min)
```

- `protocol.test.js` covers the hub over `ws` and over `ws-lite`. It tests slots, queue, resume, replace, kick,
  idle, reservation, dead detection, SSE+POST, guards, `/api/info`, cert fallbacks, and relay latency < 50 ms.
- `tilt.test.js` covers the steering math (the spec's worked example), the stick curve, phase mapping and QR
  URLs.
- `phones.e2e.test.js` runs the real game host and 4 phones: 2 https (one with WebSocket forced to fail, so
  SSE+POST) and 2 http (one on the LAN IP, so insecure). Extra phones cover the queue and permission cases. It
  checks join, tilt mapping, the stick, gas, drift and item, and a full lap driven by tilt with GAS held. It also
  checks offline coast and reconnect, page reload resume, host reload with drinks restored, kick, the lobby
  remove button, vibes, the iOS permission flow, page hygiene and rtt.
  Latency is budgeted as 150 ms plus two measured host frames, because the sandbox renders with software GL at
  2 to 5 fps. Measured values: touch 200-310 ms, SSE 50-800 ms, coast 220-270 ms.

The e2e suite drives the **real** game with Playwright 1.56 from `/opt/node-tools/node_modules/playwright`
(falling back to the `playwright-core` devDependency), with `PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers`.
It launches `channel: 'chromium'` (the new headless mode). The default headless shell never delivers
`deviceorientation` overrides, so tilt cannot be tested on it. Never run `playwright install`.

## 6. Deviations from the spec and open items

- Controller modules live in `public/js/net/controller/` and the host bridge in `public/js/net/net-host.js`,
  following the lane ownership rule rather than the spec's `public/js/controller/` and `public/js/net-host.js`.
  Tests live in `test/net/`, not `tests/`.
- The host role is accepted only from an address of this machine. Set `TIPSY_HOST_ANY=1` to allow a TV browser
  elsewhere. WebSocket upgrades whose `Origin` host differs from `Host` are refused. Both are hardening the spec
  did not ask for.
- `/msg` accepts up to 16 KB per POST batch (the 4 KB limit applies to each phone message).
- The hand-rolled RFC 6455 server (Appendix A) is included as an automatic fallback when `ws` cannot be
  loaded, and it runs the full protocol suite as well.
- The phone listens for `deviceorientation` from page load on platforms without a permission prompt, so the
  sensor check after "Let's go" is instant.
- The spec's `server.js` `start({port, httpsPort})` returning `httpsPort` is not in the engine's `start()`. Read
  `require('./net/hub').info().httpsPort` after `await hub.ready()`.
- Not verifiable headlessly (spec 6.4): real iOS Safari wss-versus-self-signed behaviour, the motion permission
  prompt, the native switch haptic, and wake lock on hardware.
