# Tipsy Kart: Phone Controller Spec (research lane)

Status: implementation-ready. Audience: the coding agent building the network and controller layer.
Scope: `tipsy-kart/server.js` (network parts only), `tipsy-kart/net/*`, `tipsy-kart/public/controller.html`,
`tipsy-kart/public/js/controller/*`, `tipsy-kart/public/js/net-host.js` and `tipsy-kart/tests/phones.e2e.js`.
Everything here is original design. Nothing comes from Nintendo or the mkw decompilation.

Read section 0 first. Every later section implements it.

---

## 0. Decisions at a glance

| Topic | Decision |
|---|---|
| Transport | WebSocket via the **`ws` npm package (8.x)**, using one `WebSocketServer({noServer:true})` that is shared by both HTTP servers. Plan B (only if `npm install` is impossible): the hand-rolled RFC 6455 module in Appendix A. |
| Fallback transport | **SSE downlink plus `fetch` POST uplink** on the same origin. The phone switches to it automatically if `wss://` fails on iOS, where Safari can reject wss to a self-signed cert even after the page itself was accepted (see 4.3). |
| Origins | HTTP on `PORT` (default **3000**) for the host display and the no-tilt phone link. HTTPS on `HTTPS_PORT` (default **3443**) with a self-signed cert for phones, because tilt needs a secure context. Both servers bind `0.0.0.0` and share one hub. |
| QR default | QR shows **`https://<lan-ip>:3443/controller`**. The lobby also prints the plain `http://<lan-ip>:3000/controller` link, labelled "touch steering only". Set env `TIPSY_JOIN=http` to put the HTTP URL in the QR instead. |
| Certificate | Resolution order: (1) `TIPSY_CERT`/`TIPSY_KEY` env (mkcert, for hosts who want no warnings), (2) cached `tipsy-kart/.cert/`, (3) generate with the `selfsigned` npm package (RSA-2048, SHA-256, SAN = every LAN IP + localhost, EKU serverAuth, 365 days), (4) the `openssl` CLI, (5) give up on HTTPS, warn, and run HTTP only. |
| QR library | Vendor **`qrcode-generator@2.0.4`** (`dist/qrcode.js`, MIT, by Kazuhiko Arase) to `tipsy-kart/public/vendor/qrcode.js`. Render it as inline SVG on the host. No CDN. |
| Room model | One room per server process. The server owns the roster (slot, token, name, color, connected, rtt). The host page owns the game state (race, drinks, impairment). The server relays messages and caches the last per-slot state. |
| Identity | The phone makes a 128-bit random token with `crypto.getRandomValues` (`crypto.randomUUID` does **not** exist on the http origin, which was verified) and keeps it in `localStorage["tipsyKart.token"]`. The token moves between http and https origins in the URL hash. |
| Input rate | The phone samples on every sensor or pointer event. It sends **at most 30 Hz while values change**, sends button edges **immediately**, and sends a **10 Hz heartbeat** when nothing changes. |
| Stale input | Silence for more than **250 ms** makes the kart coast: throttle 0, brake 0, drift false, steer eases to 0 over 150 ms. Silence for more than **5 s** marks the player disconnected. Their slot stays reserved. |
| Steering | **Tilt** is the default when it is available, built from `deviceorientation` beta/gamma → gravity "up" vector → roll angle relative to the screen's horizontal axis, with a calibrated neutral, a 3° deadzone, ±28° full lock and a 1.5 power curve. **Touch stick** is the alternative (floating horizontal thumbstick). The player can switch at any time. |
| Buttons | The right cluster is the same in both modes: a big **GAS** area with a **DRIFT band** just above it, so rolling the thumb up gives gas + drift. Brake and Item sit on the left in tilt mode. Pointer Events handle multi-touch, with zone-level capture and per-move hit-testing. |
| Haptics | Android uses `navigator.vibrate(pattern)` (it needs sticky activation, which the Join tap provides). iOS has no Vibration API, so cues become a full-screen color flash, plus best-effort native haptics on direct taps through a hidden `<input type="checkbox" switch>` inside the button (Safari 17.4+). |
| Screen | Landscape only. In portrait the phone shows a "rotate" overlay. The page sets `touch-action:none` everywhere and adds a `gesturestart` preventDefault. It requests a Screen Wake Lock (secure contexts only) and re-acquires it on `visibilitychange`. Android gets Fullscreen + `screen.orientation.lock('landscape')`. iPhone has neither. |
| Tests | Node's built-in `node:test` with the Playwright **library** from `/opt/node-tools/node_modules/playwright`, with `PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers` (chromium-1194 = Chrome 141, which matches Playwright 1.56.1). The run uses 4 phone contexts and 1 host context. Tilt is faked with CDP `DeviceOrientation.setDeviceOrientationOverride` and multi-touch with CDP `Input.dispatchTouchEvent`. Never run `playwright install`. |

---

## 1. Transport and server

### 1.1 `ws` vs hand-rolled RFC 6455: choose `ws`

| | `ws` 8.22.x | Hand-rolled |
|---|---|---|
| Dependencies | none (zero transitive deps) | none |
| Correctness | Mature. Handles fragmentation, close handshake, limits and backpressure. Sets `TCP_NODELAY` (`socket.setNoDelay()` in `lib/websocket.js`). Server-side `perMessageDeflate` is **off by default** (`lib/websocket-server.js`), which is right for tiny low-latency messages. | About 150 lines. Easy to get subtly wrong (64-bit lengths, masking, close codes, control frames between fragments). |
| Install | Needs `npm install`. The npm registry is reachable in this environment (`npm view ws` → 8.22.0, modified 2026-09-26). | Nothing to install. |

Decision: `tipsy-kart/package.json` declares `"ws": "^8.22.0"` and `"selfsigned": "^5.5.0"`, with `engines.node >=18`.
Implement Appendix A **only** if the build environment cannot install `ws`. `net/hub.js` should hide the socket behind a
tiny `Conn` interface (section 1.6) so that switching to Plan B, or using the SSE fallback, never touches hub logic.

### 1.2 Server layout (`server.js`)

```
http  server  : 0.0.0.0:PORT        (default 3000)  -> static public/, /api/info, /sse, /msg, upgrade /ws
https server  : 0.0.0.0:HTTPS_PORT  (default 3443)  -> identical handler, same hub instance
```

- `hub.attach(server)` is called **once per server**. `hub.js` keeps module-level singleton state, so both servers share one room.
  `attach` registers `server.on('upgrade')` for pathname `/ws` and destroys the socket for any other path. It also registers the
  `/sse` and `/msg` routes through an exported `hub.handleHttp(req,res) -> boolean` that the static handler calls first.
- Static serving: `GET /` → `public/index.html`, `GET /controller` → `public/controller.html`, everything else from `public/`.
  Resolve with `path.resolve` and reject anything outside `public/` (path traversal). Use a small MIME map (html, js, mjs,
  css, svg, png, jpg, webp, json, woff2, mp3, ogg, wav, glb, gltf). Send `Cache-Control: no-store` for `.html`.
- `GET /api/info` → `{ name:"Tipsy Kart", ips:[...ranked], primaryIp, httpPort, httpsPort|null, joinUrl, httpJoinUrl,
  secureJoinUrl|null, certFingerprint|null, joinMode:"https"|"http" }`. The host lobby and the controller both read it.
- HTTPS disabled (`TIPSY_HTTPS=0`, or no cert could be produced) → `httpsPort:null` and `joinUrl = httpJoinUrl`.
- Startup banner (stdout):

```
Tipsy Kart is running
  Big screen (open on this laptop):  http://localhost:3000
  Phones, scan the QR or type:       https://192.168.1.23:3443/controller
  Phones, no-warning link (no tilt): http://192.168.1.23:3000/controller
  Other addresses: 10.0.0.5   (set TIPSY_HOST=<ip> to force one)
```

### 1.3 LAN IP discovery (`net/lan.js`)

`os.networkInterfaces()`, keep entries where `(family === 'IPv4' || family === 4) && !internal`. Node 18.0 to 18.3 reported
`family` as a number, so check both. Drop `169.254.*`. Score and sort:

- +30 `192.168.*`, +20 `10.*`, +10 `172.16-31.*`
- +5 if the interface name matches `/^(en\d|wlan|wlp|wl|eth|Wi-?Fi|Wireless|Ethernet)/i`
- −100 if the name matches `/(docker|br-|veth|vboxnet|vmnet|virbr|utun|tun|tap|zt|tailscale|wg|vEthernet|VirtualBox|VMware|Hyper-V|WSL|Loopback)/i`
- −50 for `192.168.56.*` (VirtualBox host-only) and `100.64.0.0/10` (CGNAT/Tailscale)

`TIPSY_HOST=<ip>` overrides the ranking. The host lobby shows "Wrong address? ▸" so the user can cycle through `ips[]`,
which regenerates the QR on the client. Known traps to print as hints when relevant:
- **WSL2**: if `os.release()` matches `/microsoft/i`, warn that phones cannot reach the WSL2 NAT address. Run Node on
  Windows, or set `networkingMode=mirrored` in `.wslconfig`.
- **Firewalls**: Windows Defender asks to allow Node, so allow it on *Private* networks. macOS asks "Accept incoming network
  connections", so the host must click Allow.
- **Client isolation**: guest, hotel, campus and eduroam-style Wi-Fi often isolates clients, so phones cannot reach the
  laptop. The fix is a phone or laptop hotspot that everyone joins. Show this in the lobby's "Phones can't connect?" help.

### 1.4 Room, slots, colors

- Human slots 0 to 3. Colors are fixed per slot (original palette): 0 `#FF4D6D` "Cherry", 1 `#3A86FF` "Sky",
  2 `#FFBE0B` "Lemon", 3 `#06D6A0` "Mint". The phone tints its whole UI with the slot color.
- `sessionId`: random hex made at server start. A token from an earlier server run is simply treated as new.
- On phone `hello`:
  1. If the token owns a slot (connected or reserved), reuse it. `resumed:true`. Close the token's older connection with code 4003 "replaced".
  2. Otherwise assign the lowest free slot.
  3. If no slot is free, send `{t:"full"}` and keep the connection in a FIFO wait queue. When a slot frees, give it to the queue head and send `welcome`.
- Reservation: a disconnected slot stays reserved for its token. **In the lobby** the reservation ends after **60 s** of
  disconnection. **From raceStart until cupFinished** it never ends automatically, and the kart coasts.
- Idle handling, lobby only. "Idle" means connected but no `input` that differs from the previous one, and no other
  phone message except pong/heartbeat, for **180 s**. At 150 s send `{t:"toast",text:"Still there? Tap anything"}`. At 180 s
  send `kicked{reason:"idle"}` and free the slot. Never kick for idleness during a cup.
- Host kick: the host sends `{t:"kick",slot}`. The server sends `kicked{reason:"host"}`, closes with 4002 and frees the slot.
  A kicked phone shows "You were removed" plus a "Join again" button. That button keeps the token, so a rejoin gets a free
  slot like any newcomer.
- Explicit leave: the phone's "Leave game" button sends `{t:"leave"}`, which frees the slot immediately.

### 1.5 Liveness, reconnect, heartbeat

- The server sends `ping{id}` to each phone every **2 s** and computes `rtt` = now − sentAt on `pong`, then
  `rttEwma = 0.8*rttEwma + 0.2*rtt`.
- **Dead detection**: no message of any kind from a phone for **5 s** → `conn.close(4000)` / `terminate()`. Phones send
  a heartbeat at 10 Hz, so this only fires when the tab is backgrounded, the phone is locked or Wi-Fi is down.
- Phone reconnect: on close, retry after 250 ms, 500 ms, 1 s, 2 s, then every 2 s forever. Also retry immediately on
  `visibilitychange` → visible, `online` and `pageshow`. Always reuse the same token. iOS 26 betas showed flaky first
  `ws://` connects to LAN hosts that needed a second attempt (Apple forums thread 792842), so the retry loop is not optional.
- Host page: connects to `ws://localhost:3000/ws` with role `host`. Only one host is active. A new host hello replaces the
  old one, which gets `{t:"hostReplaced"}` and closes 4004. While no host is connected, phones get `state.hostConnected=false`
  and show "Waiting for the big screen…", and the server drops their inputs.

### 1.6 Connection abstraction and SSE fallback (`net/hub.js`)

```js
// Conn: what the hub sees, whatever the transport.
{ id, kind: 'ws'|'sse', send(obj), close(code, reason), onMessage(fn), onClose(fn), remoteAddress }
```

- **WS Conn**: wraps the `ws` socket. `send` = `ws.send(JSON.stringify(obj))` if `readyState===OPEN`. If
  `ws.bufferedAmount > 64 KB`, drop non-critical messages (state/ping), never `welcome`/`kicked`. Set
  `maxPayload: 4096` on the server, which closes with 1009 if exceeded.
- **SSE Conn** (fallback):
  - `GET /sse?token=<tk>` → `200`, `Content-Type: text/event-stream`, `Cache-Control: no-store`, `Connection: keep-alive`,
    `X-Accel-Buffering: no`. Call `req.socket.setNoDelay(true)` and `req.socket.setTimeout(0)`. Each message is written as
    `data: <json>\n\n`. Write a comment line `:\n\n` every 15 s. When the request closes, the Conn closes.
  - `POST /msg?token=<tk>` with body = JSON **array** of phone messages (≤ 4 KB). For a known SSE Conn the response is
    `204` and each message is fed into `onMessage` in order. Otherwise the response is `409` and the phone reopens SSE.
  - The first uplink must be `hello`, exactly as on WS. Hub logic is identical.
- Everything is JSON text. Unknown `t` values are ignored, never fatal. Any message that fails to parse is dropped and
  counted, and after 20 bad messages the connection closes with 1007.

---

## 2. Message protocol (v1)

All messages are JSON objects with a string `t`. Numbers are plain JSON numbers. `steer` is rounded to 2 decimals.
`P→S` = phone to server, `S→P` = server to phone, `H→S` / `S→H` = host page ↔ server.

### 2.1 Phone ↔ server

| Dir | `t` | Fields | When / rate |
|---|---|---|---|
| P→S | `hello` | `v:1, role:"phone", token:string(22, base64url), name:string(1..12), caps:{secure:bool, tilt:bool, vibrate:bool, ios:bool, transport:"ws"|"sse"}` | First message, within 5 s of connect, or the connection closes 4001 |
| P→S | `input` | `seq:uint, steer:-1..1, throttle:0..1, brake:0..1, drift:bool, item:uint (cumulative item-button presses since page load), mode:"tilt"|"touch"` | ≤30 Hz while changing, immediately on any button edge, 10 Hz heartbeat otherwise. ~110 bytes |
| P→S | `pong` | `id` | On every `ping` |
| P→S | `name` | `name` | Settings change |
| P→S | `ready` | `ready:bool` | Lobby toggle (the host may ignore it) |
| P→S | `drink` | `delta:+1|-1` | "+1 drink" / undo button. Lobby and results screens only, disabled while racing. The host decides. |
| P→S | `leave` | — | Leave button |
| S→P | `welcome` | `v:1, slot, color, colorName, name, token, sessionId, resumed:bool, phase, httpUrl, secureUrl|null` | After hello (or when leaving the wait queue) |
| S→P | `full` | `queuePos` | Room full, waiting |
| S→P | `state` | `phase:"lobby"|"countdown"|"racing"|"finished"|"results"|"cupResults", raceIndex, lap, laps, place, of, item:string|null, drinks, impair:{level:0..1, label:string}, rtt, hostConnected:bool, ready:bool` (any subset is allowed, and the phone merges it) | Full snapshot right after `welcome`, then deltas, forwarded at ≤10 Hz per phone |
| S→P | `vibe` | `cue:"tick"|"go"|"bump"|"boost"|"item"|"lap"|"finish"|"drink"|"warn"` | Event-driven |
| S→P | `toast` | `text, ms` | Event-driven |
| S→P | `ping` | `id` | Every 2 s |
| S→P | `kicked` | `reason:"host"|"idle"` | Then close 4002 |

### 2.2 Host page ↔ server

| Dir | `t` | Fields | Notes |
|---|---|---|---|
| H→S | `hello` | `v:1, role:"host"` | The server replies with `roster` |
| S→H | `roster` | `sessionId, players:[{slot,name,color,colorName,connected,rtt,mode,ready,idle,transport,lastState:{drinks,...}|null}]` | On every roster change, max 4 Hz. `lastState` is the server's cache of the last `state` the host pushed for that slot, so a reloaded host page can restore drinks |
| S→H | `input` | `slot, seq, steer, throttle, brake, drift, item, mode` | Forwarded **immediately**, never batched |
| S→H | `joined` | `slot, name, color, resumed` | |
| S→H | `left` | `slot, reason:"disconnect"|"kicked"|"idle"|"leave"|"expired", released:bool` | `released:false` means the slot is still reserved |
| S→H | `drink` | `slot, delta` | Phone request |
| S→H | `rename` / `ready` | `slot, name` / `slot, ready` | |
| H→S | `state` | `slot|"all", ...state fields` | The server merges into the per-slot cache, adds `rtt`/`hostConnected` and forwards it as S→P `state` |
| H→S | `vibe` / `toast` | `slot|"all", cue` / `slot|"all", text, ms` | |
| H→S | `kick` | `slot` | |

### 2.3 Rates and budget

- Uplink is 4 phones × 30 Hz × ~110 B ≈ 13 KB/s, which is trivial. Phones keep sending the 10 Hz heartbeat even when idle,
  partly to keep the phone's Wi-Fi radio out of power-save, where wake-up latency can reach 100 ms or more.
- End-to-end latency: sensor 16 ms + send tick ≤33 ms + Wi-Fi 2–10 ms + localhost relay <1 ms + host frame ≤16 ms
  ≈ 35–75 ms. Button edges skip the send tick.
- Latency display: `rtt` is shown on host lobby cards (green <40 ms, amber <100 ms, red ≥100 ms) and in phone settings.

### 2.4 Stale-input behaviour (host side, `net-host.js`)

Run a 50 ms `setInterval` that compares `performance.now()` with the last input arrival per slot:
- **≤250 ms**: use the last input as it is.
- **>250 ms**: coast. Call `setPlayerInput(slot,{steer: s*decay, throttle:0, brake:0, drift:false, useItem:false})`, where `steer`
  moves toward 0 linearly over 150 ms.
- On `left` (connection lost): coasting input as above, `session.players[i].connected=false`, emit `playerLeft`.
- On reconnect: `connected=true`, emit `playerJoined` with `{reconnected:true}`. The next real input resumes control.

### 2.5 Item press semantics

`item` is a cumulative counter, so a 33 ms tap can never be lost between send ticks or coalesced. `net-host.js` keeps
`lastItem[slot]`. When `msg.item > lastItem` (with wrap-safe compare), it calls `setPlayerInput` with `useItem:true` for **that
one call**, and every later call has `useItem:false`. Each increment gives exactly one use, so the game should act on `useItem === true`,
or on its rising edge. Drift is a **held** boolean, as the contract says.

---

## 3. Controller UX (`/controller`)

### 3.1 Screens and flow

1. **Join screen**: big name field (prefilled from `localStorage["tipsyKart.name"]`), slot color preview after
   welcome, and a large **"Let's go"** button. That tap is the user gesture that does all of the following, **synchronously in the same
   click handler before any `await`**:
   - `DeviceOrientationEvent.requestPermission()` if it is a function (iOS 13+/Safari 14.5+, Chrome 152+), keeping the promise
   - `document.documentElement.requestFullscreen({navigationUI:'hide'})` if `document.fullscreenEnabled` (Android). Then
     `screen.orientation.lock('landscape').catch(()=>{})`
   - `navigator.wakeLock.request('screen')` if `'wakeLock' in navigator`
   - `navigator.vibrate(1)` on Android, which also gives sticky activation for later vibrations
   - prime the iOS haptic switch (3.7)
2. **Calibrate** (tilt mode only): "Hold your phone like a steering wheel and tap Ready". Average 0.5 s of samples to get the neutral angle.
3. **Pad screen**: the controls (3.4). Top status bar.
4. **Overlay states**: rotate-to-landscape, waiting-for-host, reconnecting (spinner + "Reconnecting… your spot is saved"),
   room full (queue position), kicked.

### 3.2 Layout and page hygiene

```html
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="theme-color" content="#111">
```
```css
html,body{position:fixed;inset:0;overflow:hidden;overscroll-behavior:none;margin:0;
  touch-action:none;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;
  -webkit-tap-highlight-color:transparent;height:100dvh;background:#111;color:#fff}
.pad{padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)}
@media (orientation:portrait){ #rotate{display:flex} }   /* full-screen "Turn your phone sideways" */
```
```js
for (const ev of ['gesturestart','gesturechange','gestureend']) document.addEventListener(ev, e => e.preventDefault()); // iOS pinch
document.addEventListener('touchmove', e => e.preventDefault(), {passive:false});
document.addEventListener('contextmenu', e => e.preventDefault());                     // long-press menu
document.addEventListener('dblclick', e => e.preventDefault());
```
- iOS ignores `user-scalable=no` for accessibility, which is why `touch-action:none` plus the gesture handlers do the real work.
- iPhone Safari has **no Fullscreen API** (iPad only) and **no `screen.orientation.lock`**. The rotate overlay text says:
  "Turn your phone sideways. If it won't rotate, turn off Portrait Orientation Lock in Control Center."
- Text inputs only exist on the join screen. Blur them before switching to the pad, or iOS keeps the keyboard and viewport offset.

### 3.3 Steering: tilt (default when available)

**Source**: `deviceorientation` (beta, gamma). Do not use `devicemotion`. Orientation angles are consistent across platforms,
while `accelerationIncludingGravity` sign conventions have differed between iOS and Android. Chromium's CDP sensor override also fires
reliable `deviceorientation` but delivered nulls for `devicemotion` in our probe.

**Math** (robust for wheel grip, tray grip and anything between, with no gimbal singularity):
```js
const D = Math.PI/180;
function steerDegFromOrientation(beta, gamma, screenAngle) {
  // world "up" expressed in device coords (derived from the spec's Z-X'-Y'' rotation)
  const b = beta*D, g = gamma*D;
  const up = [-Math.cos(b)*Math.sin(g), Math.sin(b), Math.cos(b)*Math.cos(g)];
  // screen-right axis in device coords for the current screen rotation
  const a = ((screenAngle % 360) + 360) % 360;
  const right = a === 90 ? [0,-1,0] : a === 270 ? [0,1,0] : a === 180 ? [-1,0,0] : [1,0,0];
  const d = up[0]*right[0] + up[1]*right[1] + up[2]*right[2];
  return -Math.asin(Math.max(-1, Math.min(1, d))) / D;   // + = right side of screen lowered = steer right
}
const screenAngle = () => (screen.orientation && typeof screen.orientation.angle === 'number')
  ? screen.orientation.angle : (window.orientation || 0);
```
**Pipeline per event** (iOS and Android deliver about 60 Hz):
1. `raw = steerDegFromOrientation(e.beta, e.gamma, screenAngle())`. Skip the event if beta or gamma is null.
2. Low-pass: `f += (raw - f) * (1 - Math.exp(-dt/0.04))` (τ = 40 ms).
3. `rel = f - neutralDeg` (from calibration). `invert` setting → `rel = -rel`.
4. Deadzone 3°: `m = max(0, |rel| - 3) / (maxDeg - 3)`, `maxDeg` default **28°** (settings slider 15–45°).
5. Curve: `steer = sign(rel) * min(1, m) ** 1.5`, round to 0.01.

**Calibration**: average `f` over 500 ms when the player taps Ready. Run it again automatically 300 ms after any `orientationchange`
(angle 90↔270), and when the player double-taps the steering-wheel indicator. Store `neutralDeg` only in memory, because grip changes between sessions.

**Availability matrix**: tilt is available when `window.isSecureContext && 'DeviceOrientationEvent' in window` and, where
`requestPermission` exists, it resolved `"granted"`. As a final check, if no `deviceorientation` event with a non-null beta arrives within
1 s after permission, it counts as unavailable (desktop browsers or sensorless devices). Otherwise use **touch** mode and show why
in settings:
- `http://` origin: "Tilt needs the secure link". Show a button to `secureUrl + '/controller#tk=<token>&nm=<name>'`.
- Permission denied (iOS): "Motion access was blocked. Close the Safari tab and reopen the link to be asked again." A
  denial is remembered for the tab or site, and reload alone may not re-prompt.

### 3.4 Steering: touch stick (alternative, always available)

- Left zone = left 42% of the width, below the status bar. A **floating** stick: `pointerdown` sets the origin at the touch point,
  and only horizontal displacement counts. `steer = clamp(dx / R)`, with `R = 0.11 * min(innerWidth, 900)` px, deadzone
  8% of R, curve exponent 1.3. Draw the base ring and knob at the origin. On release the steer snaps to 0.
- Keyed to the `pointerId` that started in the zone. A second finger in the zone is ignored.

### 3.5 Buttons and multi-touch

Landscape grid, sizes in `vh` so they scale. The status bar is 14 vh.

```
 TILT MODE                                        TOUCH MODE
+-----------+------------------+-----------+     +---------------+--------+------------+
| ITEM      |   wheel/status   | DRIFT band|     | ITEM (corner) |        | DRIFT band |
|           |  (steer gauge)   | (gas+drift|     |  ( stick zone |        | (gas+drift)|
+-----------+                  +-----------+     |    floating ) |        +------------+
| BRAKE     |                  |    GAS    |     |               | BRAKE  |    GAS     |
|           |                  |  (biggest)|     |               | (inner)|  (biggest) |
+-----------+------------------+-----------+     +---------------+--------+------------+
```
- **Right cluster** (both modes) is a single pointer zone, 38% of the width. It has a top 35% **DRIFT band** (= throttle 1 + drift true)
  and a bottom 65% **GAS** area (throttle 1). In touch mode an inner-left strip of the cluster is **BRAKE** (brake 1, throttle 0).
  The zone captures the pointer (`setPointerCapture`) and **hit-tests on every pointermove**, so a thumb can roll between GAS,
  DRIFT and BRAKE without lifting. A finger dragged out of the zone keeps its last sub-region until it lifts.
- **Left cluster in tilt mode**: ITEM (top) and BRAKE (bottom) are separate buttons, each captured to its own pointer.
- **ITEM**: on `pointerdown`, `itemCount++` and send immediately. Show a pressed animation.
- **Auto-gas** setting (default off): throttle = 1 unless brake is held.
- Multi-touch: use **Pointer Events only** (Safari 13+, Chrome 55+), with no mixed touch and mouse handlers. Keep a
  `Map<pointerId, control>`. Release a control on `pointerup`, `pointercancel` and `lostpointercapture`. **Release all** on
  `visibilitychange`(hidden), `blur`, `pagehide` and `orientationchange`, which prevents stuck gas. iOS tracks 5+ touches,
  more than we need.
- Every control state change triggers an immediate `input` send. That is the button edge path.
- Settings sheet (gear icon in the status bar): Steering mode Tilt/Touch, Tilt sensitivity (max angle), Invert tilt,
  Recalibrate, Auto-gas, Left-handed (mirrors the layout), Haptics on/off, Leave game, connection info (transport, rtt).
  Persist all of them except calibration in `localStorage["tipsyKart.settings"]`.

### 3.6 Status bar: drinks and impairment

The left side shows a color chip with the slot number and name. The center shows place (`2nd / 8`), lap (`Lap 2/3`) and held item. The right side shows a
**drinks counter** (cup glyph drawn as an inline SVG × N) and a **tipsy meter**: a 5-segment bar filled by
`impair.level`, with the label text from `impair.label`. The impairment lane decides the labels, and the net layer only forwards them.
When `level` rises, flash the meter and fire the `drink` vibe cue. In lobby/results the pad is replaced by a big card that shows
drinks, "+1 drink" / "undo" buttons, and the race result. The phone never applies impairment to its own input. The host's
`inputFilters` do that (section 5).

### 3.7 Haptics

```js
const PATTERNS = { tick:30, go:[60,40,60], bump:40, boost:[20,30,20], item:15, lap:[40,60,40],
                   finish:[80,50,80,50,200], drink:[200,100,200], warn:[30,30,30,30,30] };
```
- Android Chrome: `navigator.vibrate(PATTERNS[cue])`. Since Chrome 60 it needs a user gesture (sticky activation), which the
  Join tap provides. Firefox Android returns `true` but never vibrates. Safari iOS has **no** `navigator.vibrate` (MDN BCD 8.1.5).
- iOS fallback 1, always on: `vibe` cues show a 120 ms full-screen inset glow in the slot color, with 2 or 3 pulses for multi-part patterns.
- iOS fallback 2, best effort and only on direct taps: put a hidden `<label><input type="checkbox" switch></label>` that covers the
  ITEM and DRIFT controls (`opacity:0`, `position:absolute; inset:0`). The user's real tap toggles the switch, and Safari 17.4+
  plays its native switch haptic. This is the technique the `ios-haptics` package uses (v3 overlays a transparent switch
  instead of calling `label.click()` programmatically. Reports say Apple closed the programmatic path around iOS 26.5).
  Our own pointer handlers still receive the bubbling events. Never depend on it: there are no server-pushed haptics on iOS.
- Settings "Haptics off" disables all of the above.

### 3.8 Wake lock

`navigator.wakeLock.request('screen')` exists only in secure contexts (absent on the http origin in our probe). Safari
16.4+ supports it, but only fully from 18.4 for Home Screen web apps. Chrome Android supports it from 84. Re-request on
`visibilitychange` → visible, because the browser releases it when the page is hidden. On http or when it fails, show a one-time tip
"Set Auto-Lock to Never during the party". The reconnect logic covers screen locks, since the slot is reserved.

---

## 4. Secure context: iOS Safari and Android Chrome

### 4.1 The facts

- `DeviceOrientationEvent.requestPermission()` (Safari iOS 14.5+ per MDN BCD, introduced with iOS 13) must be called with
  **transient user activation**, from a click or touchend, not touchstart. Otherwise it rejects with `NotAllowedError`. It
  resolves `"granted"` or `"denied"`, and iOS auto-declines on non-HTTPS pages. After a denial, Safari often won't ask
  again until the tab or site data is cleared.
- **Chrome** restricted device orientation/motion events to secure contexts in **M76**: listeners can still be registered
  but are never called since M74. Our probe confirmed that on `http://<LAN-IP>` in Chromium 141 `DeviceOrientationEvent` is
  **not even defined**, `isSecureContext === false`, `crypto.randomUUID` and `navigator.wakeLock` are missing, and a CDP
  orientation override delivers nothing.
- Chrome **152** added `DeviceOrientationEvent.requestPermission()` (MDN BCD). An intent-to-ship from June 2026 aligns
  Chromium with WebKit. Our one code path ("if it's a function, call it in the gesture") covers both.
- `http://localhost` and `127.0.0.1` count as secure contexts, which is why the host display is fine on plain http.
  A phone can never reach the laptop as `localhost`.

### 4.2 Default solution: HTTPS with an auto-generated self-signed cert

`net/cert.js`, `async getTlsOptions(ips) -> {key, cert, fingerprint, source} | null`:
1. If `TIPSY_CERT` and `TIPSY_KEY` are set, read those files (`source:"user"`, e.g. mkcert).
2. Else if `tipsy-kart/.cert/key.pem` and `cert.pem` exist, parse them with `new crypto.X509Certificate(pem)`. Reuse them if
   `validTo` is more than 7 days away **and** every current LAN IP is in `subjectAltName`. Otherwise regenerate. Note in the lobby that
   phones will see the warning again.
3. Else generate with `selfsigned` (verified here, 83 ms):
   ```js
   const pems = await require('selfsigned').generate([{name:'commonName', value:'Tipsy Kart LAN'}], {
     keyType:'rsa', keySize:2048, algorithm:'sha256',
     notAfterDate: new Date(Date.now() + 365*864e5),
     extensions: [
       {name:'basicConstraints', cA:false},
       {name:'keyUsage', digitalSignature:true, keyEncipherment:true},
       {name:'extKeyUsage', serverAuth:true},
       {name:'subjectAltName', altNames:[{type:2,value:'localhost'},{type:7,ip:'127.0.0.1'}, ...ips.map(ip=>({type:7,ip}))]},
     ]});
   // pems.private, pems.cert
   ```
   This satisfies Apple's TLS rules for iOS 13+ (RSA ≥2048, SHA-2, names in SAN, EKU serverAuth, validity ≤825 days).
   Verified with `openssl x509 -text`: `CA:FALSE`, `TLS Web Server Authentication`, SAN with IPs.
4. Else, if `require('selfsigned')` throws, fall back to the `openssl` CLI (OpenSSL 1.1.1+ for `-addext`):
   `openssl req -x509 -newkey rsa:2048 -nodes -sha256 -days 365 -subj "/CN=Tipsy Kart LAN" -keyout key.pem -out cert.pem
   -addext "subjectAltName=DNS:localhost,IP:127.0.0.1,IP:<ip>..." -addext "extendedKeyUsage=serverAuth" -addext "basicConstraints=CA:FALSE"`
5. Else return `null`, which means HTTP only with a loud banner.

Write `key.pem` with mode 0600 and add `tipsy-kart/.cert/` to `.gitignore`.

**Guest steps shown on the host lobby** (an illustrated 3-step strip beside the QR, plus the same text on a help page):
- **iPhone (Safari)**: "This Connection Is Not Private" → tap **Show Details** → tap **visit this website** → tap **Visit Website**.
- **Android (Chrome)**: "Your connection is not private" → tap **Advanced** → tap **Proceed to 192.168.x.x (unsafe)**.
- The game shows this text: "This warning appears because the game runs on this laptop, not the internet. The connection is still encrypted."

### 4.3 The wss problem on iOS, and the fallback chain

WebKit has a long history of accepting a self-signed cert for the **page** but rejecting **`wss://`** to the same host
(WebKit bugs 41419 and 158345). Cockpit documents that Safari's WebSocket stack rejects self-signed certs even when trusted
manually. An iOS 26 beta 3 report showed the same failure, which its author said was fixed in beta 5, implying it worked
on iOS ≤18. Current releases may work, but do not rely on it. So the controller runs a **fallback chain**:

1. **WSS** to `wss://<host>:3443/ws`. If it fails to open twice within 4 s, or closes with 1006 before `welcome`, go to 2.
2. **SSE + POST** on the same https origin (section 1.6). These go through the page loader, which already accepted the cert.
   Uplink sends latest-state only: at most one POST in flight; when it finishes, send the newest pending batch. Store
   `sessionStorage["tipsyKart.transport"]="sse"` so reconnects skip step 1 for this tab.
3. If SSE also fails, or the iOS **Show Details** button does nothing (reported on some iOS 26 devices), the phone shows
   "Secure link didn't work → use the basic link (touch steering)". That goes to `httpUrl + '/controller#tk=…&nm=…'`.

Hand-off between origins: `localStorage` is per origin (http:3000 ≠ https:3443), so always pass `#tk=<token>&nm=<name>`
in the hash. On load, the controller reads the hash, saves it to localStorage, and calls `history.replaceState(null,'',location.pathname)`.

### 4.4 Optional, warning-free: mkcert (hosts who party often)

1. `mkcert -install`, then `mkcert -key-file key.pem -cert-file cert.pem 192.168.1.23 localhost 127.0.0.1`.
2. Start with `TIPSY_CERT=cert.pem TIPSY_KEY=key.pem npm start`.
3. For each iPhone: AirDrop `$(mkcert -CAROOT)/rootCA.pem` → Settings → **Profile Downloaded** → Install →
   Settings → General → About → **Certificate Trust Settings** → enable full trust. Android: Settings → Security →
   Encryption & credentials → Install a certificate → CA certificate.

Each guest has to do this once, so it is documented but never the default. Tunnels such as ngrok or cloudflared are
**rejected**: they need internet, add latency and leave the LAN.

### 4.5 Insecure-origin fallback (http) behaviour

The controller works fully with touch steering, buttons, vibration (Android), the fallback reconnect and drinks. Tilt and
wake lock are hidden, with the explanation from 3.3. In dev only, Android users can enable
`chrome://flags/#unsafely-treat-insecure-origin-as-secure` for the LAN URL. Never put that in the guest flow.

---

## 5. Host ↔ game mapping (`public/js/net-host.js`)

Loaded by `/` after the game script. It never touches rendering.

```js
// sketch
const sock = connect('/ws', {role:'host'});            // auto-reconnect like the phone (1.5)
const S = window.game.session;                         // {raceIndex, players:[...]}
on('roster', r => syncPlayers(r.players));             // create/update S.players entries by slot
on('joined', p => { upsert(p); p.connected = true; emit('playerJoined', {...player(p.slot), reconnected: p.resumed}); });
on('left',   p => { coast(p.slot); player(p.slot).connected = false; emit('playerLeft', {slot:p.slot, reason:p.reason, released:p.released});
                    if (p.released) removePlayer(p.slot); });
on('input',  m => { last[m.slot] = {m, at: performance.now()};
                    const useItem = m.item !== lastItem[m.slot] && (lastItem[m.slot] = m.item, true);
                    window.game.setPlayerInput(m.slot, {steer:m.steer, throttle:m.throttle, brake:m.brake, drift:m.drift, useItem}); });
on('drink',  d => { const p = player(d.slot); p.drinks = Math.max(0, p.drinks + d.delta); pushState(d.slot); });
setInterval(staleCheck, 50);                           // 2.4
window.game.on('raceStart',    () => phase('countdown' then 'racing'), vibeAll('go'));
window.game.on('raceFinished', r  => phase('results'), per-slot vibe('finish'));
window.game.on('cupFinished',  c  => phase('cupResults'));
setInterval(pushHud, 200);                             // 5 Hz HUD state per slot, sent only when changed
```

Mapping rules:
- `session.players[i] = {slot, name, color, connected, racesCompleted, drinks}`. The net layer creates and updates name, color,
  connected and drinks. The game owns `racesCompleted`. Seed `drinks` from `roster.players[].lastState.drinks`
  after a host reload.
- **Raw input only.** `setPlayerInput` receives the phone's raw values. The game applies `window.game.inputFilters[slot]`
  (humans only) and `visualFx[slot]`. The net layer never filters.
- HUD values per slot are read with optional chaining from `window.game.getHud?.(slot)` → `{lap, laps, place, of, item}`.
  If that is missing, send phase only.
- Impairment display: `impair = window.game.getImpairment?.(slot) ?? {level: Math.min(1, drinks/6), label: LABELS[...]}`.
  The fallback labels are original: `["Sober","Warm","Giggly","Wobbly","Legless"]`. The impairment lane owns the real values.
- Vibe cues the host fires: `tick` on each countdown number, `go` at start, `lap` per lap, `finish` at the line,
  `drink` when drinks increase, `bump`/`boost`/`item` when the game exposes those events (optional `game.on('hit'|'boost'|'itemUsed')`).
- Expose `window.tipsyNet = { roster, lastInput, rtt, transportBySlot, send }` for tests and debug overlays.

**Contract gaps (integration lane, please confirm):**
1. The contract has `game.on(evt, cb)` but no emitter for the net layer to raise `playerJoined`/`playerLeft`. Recommend
   `window.game.emit(evt, payload)`. `net-host.js` uses `game.emit?.(…)` and falls back to dispatching a
   `CustomEvent('tipsy:'+evt)` on `window`.
2. Optional readers `game.getHud(slot)` and `game.getImpairment(slot)`, so phones show lap, place, item and tipsy level.
3. The `useItem` semantics in 2.5 (true for one `setPlayerInput` call per press).

Lobby UI on the host, owned by the host-UI lane but specified here so the data is there: QR made with
`qrcode(0,'M').addData(joinUrl).make(); el.innerHTML = qr.createSvgTag({cellSize:8, margin:4, scalable:true})`, shown at
≥ 320 px on a white quiet zone. Below it: the URL in large monospace, the http alternative, the 3-step cert help, 4 player
cards
(color, name, rtt dot, tilt/touch icon, transport, drinks, kick ✕) and "Wrong address? ▸".

---

## 6. Test plan

### 6.1 Harness (headless, no installs)

- Library: `require('/opt/node-tools/node_modules/playwright')` (v1.56.1). Set `process.env.PLAYWRIGHT_BROWSERS_PATH =
  '/opt/pw-browsers'` **inside the test file** before requiring it, then call `chromium.launch()`. Chromium-1194 (Chrome 141) matches
  1.56.1, verified. **Never run `playwright install`.** Do not add `@playwright/test`. Use `node --test tests/phones.e2e.js`.
- `package.json` script: `"test:phones": "node --test tests/phones.e2e.js"`.
- The test boots the real server in-process on random ports (`PORT=0`, `HTTPS_PORT=0`, `TIPSY_HOST=127.0.0.1`). `server.js` must
  export `start({port, httpsPort}) -> {httpPort, httpsPort, close()}` and only auto-start when `require.main === module`.
  Phones use `http://127.0.0.1:<p>` (secure context, like localhost) or `https://127.0.0.1:<sp>` with `ignoreHTTPSErrors:true`.
  To exercise the **insecure** path, use the machine's non-loopback IP from `os.networkInterfaces()` with http. Skip
  that test if none exists.
- Each phone is a separate `browser.newContext({...devices['Pixel 7 landscape'], ignoreHTTPSErrors:true})`, which gives isolated
  localStorage, `hasTouch`, `isMobile` and a landscape viewport (`screen.orientation.angle === 90`, verified). The host is a 5th
  context on `http://127.0.0.1:<p>/`. If the game isn't ready yet, the host page may be loaded with a stub `window.game`
  that records `setPlayerInput` calls (inject it with `addInitScript`).
- Proxy note: in this sandbox, run with `NO_PROXY='*'` (or rely on the default noProxy list, which includes 127.0.0.0/8 and 192.168.0.0/16).

### 6.2 Faking sensors, touches and iOS APIs

```js
// Tilt: CDP override (secure origins only; verified it fires 'deviceorientation' with exactly these values)
const cdp = await ctx.newCDPSession(page);
await cdp.send('DeviceOrientation.setDeviceOrientationOverride', {alpha:0, ...betaGammaFor(steerDeg)});

// Inverse of 3.3 for the landscape-90 wheel grip tilted back 30°: produce (beta, gamma) for a desired roll
function betaGammaFor(deltaDeg, tiltBackDeg = 30) {
  const d = deltaDeg*Math.PI/180, t = tiltBackDeg*Math.PI/180;
  const sr = [0,-1,0], su = [1,0,0], z = [0,0,1];          // screen-right / screen-up for angle 90
  const up = [0,1,2].map(i => Math.cos(t)*(-Math.sin(d)*sr[i] + Math.cos(d)*su[i]) + Math.sin(t)*z[i]);
  return { beta: Math.asin(up[1])*180/Math.PI, gamma: Math.atan2(-up[0], up[2])*180/Math.PI };
}
// Expected controller raw angle = asin(cos(t)*sin(d)), e.g. d=20°, t=30° -> 17.2°.

// Fallback for insecure origins / unit tests: synthetic event (DeviceOrientationEvent is undefined on http!)
await page.evaluate(([b,g]) => { const e = new Event('deviceorientation'); Object.assign(e,{alpha:0,beta:b,gamma:g}); dispatchEvent(e); }, [b,g]);

// Multi-touch: two fingers at once (verified: distinct pointerIds, pointerType 'touch')
await cdp.send('Input.dispatchTouchEvent', {type:'touchStart', touchPoints:[{x:gasX,y:gasY,id:1}]});
await cdp.send('Input.dispatchTouchEvent', {type:'touchStart', touchPoints:[{x:gasX,y:gasY,id:1},{x:stickX,y:stickY,id:2}]});
await cdp.send('Input.dispatchTouchEvent', {type:'touchMove',  touchPoints:[{x:gasX,y:gasY,id:1},{x:stickX+60,y:stickY,id:2}]});
await cdp.send('Input.dispatchTouchEvent', {type:'touchEnd',   touchPoints:[]});

// iOS permission emulation: must only succeed inside a user gesture
await ctx.addInitScript(() => {
  window.__perm = [];
  if (window.DeviceOrientationEvent) DeviceOrientationEvent.requestPermission = async () => {
    const ok = navigator.userActivation.isActive; window.__perm.push(ok); return ok ? 'granted' : 'denied'; };
});
// Note: transient activation lasts a few seconds after any CDP touch, so assert "not called on load" on a fresh page.

// Vibration spy / iOS no-vibrate emulation
await ctx.addInitScript(() => { window.__vib = []; navigator.vibrate = p => (window.__vib.push(p), true); });
await ctx.addInitScript(() => { delete Navigator.prototype.vibrate; });   // the "iPhone" variant

// Force the SSE fallback: WebSocket that always fails
await ctx.addInitScript(() => { window.WebSocket = class { constructor(){ setTimeout(()=>{ this.onerror?.(new Event('error')); this.onclose?.({code:1006}); }, 10); } send(){} close(){} }; });
```

### 6.3 Test cases (all automated)

1. **Join x4**: 4 phones (2 over https, 2 over http) → slots {0,1,2,3}, distinct colors, the host roster has 4 entries, and
   `session.players` has 4 entries with `connected:true`. `playerJoined` fired 4 times.
2. **Full**: a 5th phone gets `full{queuePos:1}`. Phone 4 taps Leave → the 5th phone gets `welcome{slot:3}`.
3. **Resume**: close phone 2's page, open a new page in the **same context** → same slot, `resumed:true`, and the host saw
   `left{released:false}` then `joined{resumed:true}`.
4. **Cross-origin hand-off**: on an http phone, the "secure link" button href contains `#tk=<same token>`. Opening it gives the same slot.
5. **Tilt mapping** (https phones): calibrate at δ=0, then δ=+20° → host `steer` ≈ 0.43 (assert 0.33..0.53; the math was checked
   numerically: β=17.2°, γ=−58.4° → raw 17.23° → 0.429). δ=−20° → negative, symmetric within 0.05. δ=+2° → exactly 0 (deadzone). δ=+60° → 1.
6. **Touch + gas** (http phone): hold GAS + drag stick +R → host sees `throttle 1`, `steer ≥ 0.95` within 150 ms. Roll the
   gas finger into the DRIFT band → `drift:true` with throttle still 1. Lift all → throttle 0, steer 0.
7. **Item counter**: 3 quick ITEM taps → exactly 3 `setPlayerInput` calls with `useItem:true`.
8. **Stale/coast**: `ctx.setOffline(true)` on a phone while gas is held → within 400 ms the host input has throttle 0. Within
   6 s `connected:false` and `playerLeft`. `setOffline(false)` → auto-reconnect, same slot.
9. **iOS permission flow**: on a fresh page `__perm` is empty after load. After tapping "Let's go" it is `[true]`, and the mode is tilt.
   A variant stub that returns `'denied'` → touch mode plus the explanation text.
10. **Insecure origin**: http via the LAN IP → `isSecureContext===false`, the tilt option is disabled, and the controller still drives the kart.
11. **SSE fallback**: with the failing-WebSocket init script on an https phone → it still joins, `transport:"sse"` appears in the roster,
    and inputs reach the host. Steer changes reach the host in < 150 ms on loopback.
12. **Kick and idle**: host `kick{slot:1}` → the phone shows the kicked screen and the slot is free. Idle: run the server with
    `TIPSY_IDLE_MS=2000` (test hook) and check the lobby kick at 2 s and no kick during a cup.
13. **Latency**: after 5 s, every roster `rtt` is < 50 ms on loopback, and the phone settings show the rtt.
14. **Vibe**: host `vibe{slot:0,cue:'lap'}` → `__vib` contains `[40,60,40]`. With the "iPhone" variant the `.flash` element
    appears instead.
15. **Page hygiene**: `getComputedStyle(document.body).touchAction === 'none'`. With the page in portrait viewport
    (`page.setViewportSize({width:390,height:844})`) the `#rotate` overlay is visible.
16. **Host reload**: reload the host page → the roster replays, drinks are restored from `lastState`, and phones briefly show
    `hostConnected:false` then true.

### 6.4 Manual real-device checklist (before calling it done)

- iPhone, current iOS, Safari, https QR: cert bypass steps work, the motion prompt appears on "Let's go", tilt steers, and settings
  show which transport is active (`ws` or `sse`). Lock the screen for 10 s and unlock → auto-resume in the same slot.
- iPhone, http link: touch steering, color flash on cues, no errors.
- Android Chrome, https: Proceed (unsafe) → tilt, vibration, fullscreen + landscape lock, wake lock (screen stays on 2+ minutes).
- 4 phones + host for one full 3-race cup on home Wi-Fi: no stuck inputs, rtt mostly < 40 ms.

---

## 7. File plan for the coding agent

```
tipsy-kart/package.json            deps: ws ^8.22.0, selfsigned ^5.5.0; scripts: start, test:phones
tipsy-kart/.gitignore              node_modules/, .cert/
tipsy-kart/server.js               http+https, static, /api/info, banner, exports start()
tipsy-kart/net/hub.js              attach(server), handleHttp(req,res), room/roster/protocol, Conn(ws|sse)
tipsy-kart/net/lan.js              ranked LAN IPv4 list (1.3)
tipsy-kart/net/cert.js             getTlsOptions (4.2)
tipsy-kart/public/controller.html  phone page shell (3.2)
tipsy-kart/public/js/controller/{main,net,tilt,touch,buttons,haptics,ui}.js   ES modules, no build step
tipsy-kart/public/js/net-host.js   host bridge (5)
tipsy-kart/public/vendor/qrcode.js copied verbatim from qrcode-generator@2.0.4 dist/qrcode.js (keeps MIT header)
tipsy-kart/tests/phones.e2e.js     section 6
```
Env vars: `PORT` (3000), `HTTPS_PORT` (3443), `TIPSY_HTTPS` (1), `TIPSY_JOIN` (https|http), `TIPSY_HOST`, `TIPSY_CERT`,
`TIPSY_KEY`, `TIPSY_IDLE_MS` (180000), `TIPSY_LOBBY_RESERVE_MS` (60000).

---

## Appendix A. Plan B: minimal RFC 6455 server (only if `ws` cannot be installed)

- Upgrade: require `GET`, `Upgrade: websocket`, `Sec-WebSocket-Version: 13` and `Sec-WebSocket-Key`. Respond
  `101 Switching Protocols` with `Sec-WebSocket-Accept = base64(sha1(key + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"))`.
  Do not negotiate extensions. Call `socket.setNoDelay(true)`, then push `head` into the parser first.
- Parser (streaming buffer): byte0 = FIN(0x80) | opcode(0x0F). byte1 = MASK(0x80) | len7. len7 = 126 → next 2 bytes BE.
  len7 = 127 → next 8 bytes (reject if > 4096). Client frames **must** be masked (4-byte key, `payload[i] ^= key[i & 3]`),
  otherwise close 1002. Opcodes: 0x1 text, 0x0 continuation (concatenate until FIN), 0x8 close (echo close, then end),
  0x9 ping (reply 0xA with same payload), 0xA pong (ignore), 0x2 binary (close 1003).
- Sender: unmasked frames, FIN=1, opcode 0x1, length encoding as above.
- Close: send `0x88` with 2-byte code, then `socket.end()`. Destroy after 1 s if the peer doesn't close.
- Wrap it in the same `Conn` interface (1.6). Fuzz it in tests with the browser's own WebSocket: 1-byte, 125-, 126-, 65 535-
  and 4 096-byte messages, ping storms and abrupt `ctx.close()`.

## Appendix B. Verified locally (this sandbox, 2026-10-10)

Probe server: Node 22.22, `ws` 8.22, `selfsigned` 5.5 (cert generated in 83 ms). Playwright 1.56.1 + Chromium 141.0.7390.37 (Pixel 7 landscape profile).

| Origin | isSecureContext | DeviceOrientationEvent | crypto.randomUUID | wakeLock | WS echo | CDP orientation override |
|---|---|---|---|---|---|---|
| `http://localhost` | true | defined | yes | yes | ok | fires |
| `http://<LAN IP>` | **false** | **undefined** | **no** | **no** | ok | **does not fire** |
| `https://<LAN IP>` self-signed (`ignoreHTTPSErrors`) | true | defined | yes | yes | wss ok | fires |

Also verified: CDP `Input.dispatchTouchEvent` with two touch points gives two concurrent pointer streams (distinct
`pointerId`, `pointerType:"touch"`). `requestPermission` is absent in Chrome 141, which matches BCD's "152". The `devicemotion`
CDP sensor override delivered null `accelerationIncludingGravity`, which is one more reason to use `deviceorientation`.
Not verifiable headlessly: real iOS Safari behaviour (wss with a self-signed cert, and the permission prompt), so test it with 6.4.

## Sources

- MDN, DeviceOrientationEvent.requestPermission(): https://developer.mozilla.org/en-US/docs/Web/API/DeviceOrientationEvent/requestPermission_static
- MDN browser-compat-data 8.1.5 (npm `@mdn/browser-compat-data`, 2026-10-08), read locally for WakeLock, vibrate, requestFullscreen, ScreenOrientation.lock, requestPermission, switch input, EventSource and setPointerCapture
- Chrome 76 deprecations (device orientation on insecure origins): https://developer.chrome.com/blog/chrome-76-deps-rems/
- Processing forum, M74/M76 console warning, chromestatus 5468407470227456: https://discourse.processing.org/t/device-events-doesnt-work-anymore/11649
- Chromium intent to ship, DeviceOrientation permission request API: https://groups.google.com/a/chromium.org/g/blink-dev/c/ckd2rFmT3PA ; https://issues.chromium.org/issues/40094424
- yal.cc, "Using HTML5 accelerometer and gyroscope in 2020" (gesture, HTTPS auto-decline, touchend vs touchstart): https://yal.cc/js-device-motion/
- WebKit wss vs accepted self-signed cert: https://lists.webkit.org/pipermail/webkit-dev/2011-June/017335.html ; https://bugs.webkit.org/show_bug.cgi?id=158345
- Cockpit, Safari on iPhone/iPad and self-signed WSS: https://cockpit-project.org/running/safari
- Apple Developer Forums, "Websockets (WS/WSS) in iOS26": https://developer.apple.com/forums/thread/792842
- ThinLinc bug 7401, iOS 13 wss with self-signed cert needs SAN: https://bugzilla.cendio.com/show_bug.cgi?id=7401
- Apple, Requirements for trusted certificates in iOS 13 and macOS 10.15: https://support.apple.com/103769
- Safari "Show Details → visit this website" steps: https://docs.cloud.sennheiser.com/en-us/tc-ceiling-medium-plus/lui/security-information.html ; iOS 26 failure report: https://discussions.apple.com/thread/256235137
- mkcert root CA on iOS: https://docs.start9.com/0.3.5.x/device-guides/ios/ca-ios ; https://herongyang.com/PKI/iOS-10-Enable-Full-Trust-for-Root-Certificate-on-iPhone.html
- iOS switch-haptics technique: https://npmjs.com/package/ios-haptics (README v0.0.8 vs v3.2.0, read via npm) ; https://github.com/ionic-team/ionic-framework/issues/29942
- `ws` 8.22 source (`lib/websocket.js` setNoDelay, `lib/websocket-server.js` perMessageDeflate default false), read from the npm tarball
- `selfsigned` 5.5 README (async API, extensions), read via npm
- `qrcode-generator` 2.0.4 README and dist (MIT, `createSvgTag`), read via npm
