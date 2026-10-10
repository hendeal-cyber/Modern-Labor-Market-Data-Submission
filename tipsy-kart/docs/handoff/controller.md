# Controller lane handoff (WIP checkpoint)

Branch `lane/controller`, worktree `.claude/worktrees/agent-af59c7fef941754e2`. Spec: `docs/research/phone-controls.md`.
Engine branch `lane/engine` was merged (only the server skeleton existed at the time).

## Done and tested
- `net/hub.js`: room/slot/token model, wait queue, resume, replace (4003), kick, lobby idle kick, lobby
  reservation expiry, ping/rtt, dead detection (5 s), state relay (<=10 Hz), roster (<=4 Hz), host loopback-only
  check, Origin check, HTTPS twin started from `attach()` by wrapping the request listeners (no server.js change),
  merged `/api/info`, `/sse` + `/msg` fallback.
- `net/lan.js` (ranking), `net/cert.js` (env -> cache -> selfsigned -> openssl -> HTTP only),
  `net/conn.js`, `net/ws-lite.js` (hand-rolled RFC 6455, used when `ws` is missing or `TIPSY_WS=lite`).
- `public/vendor/qrcode.js` (qrcode-generator 2.0.4, MIT).
- `test/net/helpers.js`, `test/net/protocol.test.js`: 20 tests pass (ws and lite, SSE, timers, cert fallbacks).
  Run: `cd tipsy-kart && node --test test/net/protocol.test.js` (about 55 s).
- Committed earlier as 626e8c4.

## Written but NOT yet run or tested (this checkpoint)
- `public/controller.html` and `public/js/net/controller/{store,tilt,haptics,link,controls,main}.js`.
- `public/js/net/{net-host,join-qr,index}.js` (host bridge, `#join-qr` panel, plugin entry).
- Known to check: `main.js` render() logic, CSS layout in landscape, iOS switch overlay, mapPhase heuristics.

## Next steps
1. Open `/controller` in Playwright (Chromium from /opt/pw-browsers, library at
   /opt/node-tools/node_modules/playwright, `PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers`, never `playwright install`)
   and fix JS errors.
2. Write `test/net/tilt.test.js` (unit-test `steerDegFromOrientation`, `curve`, `stickCurve` via dynamic import;
   spec values: delta 20 deg with 30 deg tilt-back -> raw 17.23 -> steer 0.43).
3. Write `test/net/phones.e2e.test.js` per spec 6.3 (4 Pixel 7 landscape contexts + host context, mock `window.game`
   served with `context.route`, CDP `DeviceOrientation.setDeviceOrientationOverride`, `Input.dispatchTouchEvent`).
4. Add `package.json` script `test:net` (already added), check `node --test test/net/` works.
5. Write `docs/INTEGRATION-controller.md`: host index.html needs `<script type="module" src="/js/net/index.js"></script>`
   (plugin loader in server.js already lists it); optional `<div id="join-qr">`; engine contract gaps (game.emit,
   useItem once per press, per-slot HUD in getState, server.js start()); impairment `level` is treated as 0..5.
6. Merge `lane/engine` again if it advanced; re-run tests; final report via SubagentHandback.

## Deviations noted so far
- Host role accepted only from a local address (override `TIPSY_HOST_ANY=1`); foreign WS Origins refused.
- Controller modules live in `public/js/net/controller/` (ownership rule), not `public/js/controller/`.
- package.json/.gitignore (engine files) got minimal edits: deps `ws`, `selfsigned`, script `test:net`, `.cert/`.
