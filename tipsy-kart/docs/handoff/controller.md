# Controller lane handoff

Branch `lane/controller`, worktree `.claude/worktrees/agent-af59c7fef941754e2`. Spec: `docs/research/phone-controls.md`.
`lane/engine` (605d587) is merged; everything is tested against the real game.
Integration notes for other lanes: `docs/INTEGRATION-controller.md`.

## Status: feature-complete, all tests green

`npm run test:net` runs 44 tests in about 3.5 min, and all pass. The engine's `npm test` smoke test also passes with
the plugin loaded.

- `test/net/protocol.test.js`: hub protocol, run against both `ws` and `net/ws-lite.js`. It covers SSE+POST, idle
  kick, lobby reservation, dead detection, cert fallbacks, `/api/info`, and relay latency (< 50 ms).
- `test/net/tilt.test.js`: steering math, phase mapping and QR URLs.
- `test/net/phones.e2e.test.js`: the real game host plus 4 phones (2 https, one of them forced onto SSE, and 2 http,
  one of them on the LAN IP and so insecure), plus extra phones for the queue and permission cases. Phone 0
  drives a full lap by tilt (CDP orientation override) while holding GAS on the touch screen.

## Files

- Server: `net/hub.js`, `net/lan.js`, `net/cert.js`, `net/conn.js`, `net/ws-lite.js`.
- Phone: `public/controller.html` and `public/js/net/controller/{main,link,tilt,controls,haptics,store}.js`.
- Host: `public/js/net/{index,net-host,join-qr}.js`.
- QR library: `public/vendor/qrcode.js`.
- Tests: `test/net/*`.

## Gotchas learned

- Tilt can only be tested with `chromium.launch({channel:'chromium'})`, because the default headless shell
  ignores orientation overrides. Set `DeviceOrientation.setDeviceOrientationOverride` before `goto`.
- `Page.setWebLifecycleState frozen` does NOT stop a visible page's WebSocket traffic. Use `ctx.setOffline(true)`.
- The host renders at 2-5 fps with software GL, so end-to-end latency asserts are budgeted as 150 ms plus two
  measured host frames.
- The `getState()` polling made the engine smoke test's wall-clock checks flaky. The bridge now reads
  `game.phase` and skips `getState()` while no phone is connected.

## Possible next steps

- Wire `getImpairmentStatus` and `adjustDrinks` once `lane/impairment` lands on the engine. They are feature-detected
  already, but no test covers them with the real module yet.
- Have the engine emit `hit`/`boost`/`itemUsed` with `{slot}` so those phone vibes fire.
- Run the real-device checklist (spec 6.4).
