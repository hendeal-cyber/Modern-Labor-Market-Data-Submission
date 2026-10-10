'use strict';
// End-to-end: the REAL game (public/index.html) as host + 4 phone browsers (+ extra phones for the
// queue and permission cases), driven through the real hub. Follows phone-controls spec 6.3.
//
// Browser: Playwright 1.56 library + Chromium from /opt/pw-browsers, `channel: 'chromium'` (new
// headless). The default headless shell never delivers deviceorientation overrides. Never run
// `playwright install`.

process.env.PLAYWRIGHT_BROWSERS_PATH = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers';

const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const os = require('os');
const { startServer, sleep } = require('./helpers');

let pw;
try { pw = require('/opt/node-tools/node_modules/playwright'); } catch (e) { pw = require('playwright-core'); }
const { chromium, devices } = pw;

// ---------------------------------------------------------------- tilt helpers (spec 6.2)
function betaGammaFor(deltaDeg, tiltBackDeg = 30) {
  const d = deltaDeg * Math.PI / 180; const t = tiltBackDeg * Math.PI / 180;
  const sr = [0, -1, 0]; const su = [1, 0, 0]; const z = [0, 0, 1];
  const up = [0, 1, 2].map((i) => Math.cos(t) * (-Math.sin(d) * sr[i] + Math.cos(d) * su[i]) + Math.sin(t) * z[i]);
  return { alpha: 0, beta: Math.asin(up[1]) * 180 / Math.PI, gamma: Math.atan2(-up[0], up[2]) * 180 / Math.PI };
}
/** Wheel roll (deg) that makes the controller output `s` (inverse of deadzone + curve + tilt-back). */
function deltaForSteer(s) {
  const m = Math.pow(Math.min(1, Math.abs(s)), 1 / 1.5);
  const raw = m === 0 ? 0 : (3 + m * 25 + 0.3) * Math.sign(s);
  return Math.asin(Math.max(-1, Math.min(1, Math.sin(raw * Math.PI / 180) / Math.cos(Math.PI / 6)))) * 180 / Math.PI;
}

function lanIp() {
  for (const list of Object.values(os.networkInterfaces())) {
    for (const a of list || []) if ((a.family === 'IPv4' || a.family === 4) && !a.internal) return a.address;
  }
  return null;
}

async function until(fn, ms, what) {
  const t0 = Date.now();
  for (;;) {
    const v = await fn();
    if (v) return v;
    if (Date.now() - t0 > ms) throw new Error(`timeout (${ms} ms): ${what}`);
    await sleep(20);
  }
}

/** CDP multi-touch on one page. CDP needs every live point in each event, and touchEnd releases all. */
class Fingers {
  constructor(cdp) { this.cdp = cdp; this.pts = new Map(); }
  list() { return Array.from(this.pts, ([id, p]) => ({ id, x: p.x, y: p.y })); }
  async down(id, x, y) { this.pts.set(id, { x, y }); await this.cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: this.list() }); }
  async move(id, x, y) { this.pts.set(id, { x, y }); await this.cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: this.list() }); }
  async upAll() { this.pts.clear(); await this.cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); }
}

const center = async (page, sel) => { const b = await page.locator(sel).boundingBox(); return { x: b.x + b.width / 2, y: b.y + b.height / 2, b }; };

describe('4 phones + host on the real game', () => {
  let srv; let browser; let host; let hostCtx;
  const P = []; // { ctx, page, cdp, fingers, token, slot }
  const lan = lanIp();

  async function phoneContext({ iphone = false, failWs = false, perm = null } = {}) {
    const ctx = await browser.newContext({ ...devices['Pixel 7 landscape'], ignoreHTTPSErrors: true });
    if (iphone) await ctx.addInitScript(() => { delete Navigator.prototype.vibrate; });
    else await ctx.addInitScript(() => { window.__vib = []; navigator.vibrate = (p) => (window.__vib.push(p), true); });
    if (failWs) {
      await ctx.addInitScript(() => {
        window.WebSocket = class { constructor() { setTimeout(() => { if (this.onerror) this.onerror(new Event('error')); if (this.onclose) this.onclose({ code: 1006 }); }, 10); } send() {} close() {} };
      });
    }
    if (perm) {
      await ctx.addInitScript((answer) => {
        window.__perm = [];
        if (window.DeviceOrientationEvent) {
          DeviceOrientationEvent.requestPermission = async () => {
            const ok = navigator.userActivation.isActive; window.__perm.push(ok);
            return ok && answer === 'granted' ? 'granted' : 'denied';
          };
        }
      }, perm);
    }
    return ctx;
  }

  async function openPhone(ctx, url, { orientation = null } = {}) {
    const page = await ctx.newPage();
    page.on('pageerror', (e) => { page.__errors = (page.__errors || []).concat(e.message); });
    const cdp = await ctx.newCDPSession(page);
    if (orientation != null) await cdp.send('DeviceOrientation.setDeviceOrientationOverride', betaGammaFor(orientation));
    await page.goto(`${url}/controller`);
    await page.waitForFunction(() => window.tipsyController && (window.tipsyController.S.slot != null || window.tipsyController.S.queuePos > 0), null, { timeout: 15000 });
    return { ctx, page, cdp, fingers: new Fingers(cdp) };
  }

  async function letsGo(ph, name) {
    if (name) await ph.page.fill('#name', name);
    await ph.page.tap('#go');
    await ph.page.waitForFunction(() => window.tipsyController.S.started, null, { timeout: 5000 });
    await sleep(50);
  }

  /** Longest host frame (ms) over ~1 s. Messages wait for the frame in progress, so on a software-GL
   *  sandbox (2-5 fps with 4 viewports) end-to-end latency is bounded by this, not by the network. */
  const hostFrameMs = () => host.evaluate(() => new Promise((resolve) => {
    let last = performance.now(); let worst = 0; const t0 = last;
    const f = (t) => { worst = Math.max(worst, t - last); last = t; if (t - t0 < 1000) requestAnimationFrame(f); else resolve(Math.round(worst)); };
    requestAnimationFrame(f);
  }));
  // spec target: < 150 ms on loopback, plus up to two host frames of render time
  const budget = async () => 150 + 2 * (await hostFrameMs());

  const S = (ph) => ph.page.evaluate(() => { const c = window.tipsyController; return Object.assign({}, c.S, { transport: c.link.transport, status: c.link.status }); });
  const hostEval = (fn, arg) => host.evaluate(fn, arg);
  const lastCall = (slot) => hostEval((s) => { for (let i = window.__calls.length - 1; i >= 0; i--) if (window.__calls[i].slot === s) return window.__calls[i]; return null; }, slot);

  async function openHost() {
    host = await hostCtx.newPage();
    host.on('pageerror', (e) => { host.__errors = (host.__errors || []).concat(e.message); });
    await host.goto(`${srv.url}/`);
    await host.waitForFunction(() => window.game && window.tipsyNet && window.tipsyNet.connected, null, { timeout: 20000 });
    await host.evaluate(() => {
      window.__calls = [];
      const orig = window.game.setPlayerInput.bind(window.game);
      window.game.setPlayerInput = (slot, inp) => {
        window.__calls.push(Object.assign({ slot, at: performance.now() }, inp));
        if (window.__calls.length > 40000) window.__calls.splice(0, 20000);
        return orig(slot, inp);
      };
      window.__ev = { joined: [], left: [] };
      addEventListener('tipsy:playerJoined', (e) => window.__ev.joined.push(e.detail));
      addEventListener('tipsy:playerLeft', (e) => window.__ev.left.push(e.detail));
    });
  }

  before(async () => {
    srv = await startServer();
    browser = await chromium.launch({
      channel: 'chromium',
      args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-proxy-server', '--autoplay-policy=no-user-gesture-required'],
    });
    hostCtx = await browser.newContext({ viewport: { width: 640, height: 360 } });
    await openHost();
  });

  after(async () => {
    if (browser) await browser.close();
    if (srv) await srv.kill();
  });

  test('join x4: two https phones (one forced onto SSE), two http phones; slots, colours, roster, session', { timeout: 60000 }, async () => {
    const base3 = lan ? `http://${lan}:${srv.httpPort}` : srv.url;
    P[0] = await openPhone(await phoneContext(), srv.secureUrl, { orientation: 0 });
    P[1] = await openPhone(await phoneContext({ failWs: true }), srv.secureUrl);
    P[2] = await openPhone(await phoneContext(), srv.url);
    P[3] = await openPhone(await phoneContext({ iphone: true }), base3);
    const names = ['Ann', 'Ben', 'Cy', 'Dee'];
    for (let i = 0; i < 4; i++) await letsGo(P[i], names[i]);

    const st = await Promise.all(P.map(S));
    assert.deepEqual(st.map((s) => s.slot).sort(), [0, 1, 2, 3]);
    assert.equal(new Set(st.map((s) => s.color)).size, 4);
    for (let i = 0; i < 4; i++) P[i].slot = st[i].slot;
    // P0 has a (fake) sensor: tilt + calibration screen; the others have none: touch
    assert.equal(st[0].mode, 'tilt');
    assert.ok(await P[0].page.isVisible('#calib'));
    await P[0].page.tap('#calibGo');
    await P[0].page.waitForFunction(() => !window.tipsyController.S.calibrating);
    for (const i of [1, 2, 3]) assert.equal(st[i].mode, 'touch');

    const r = await until(() => hostEval(() => (window.tipsyNet.roster.length === 4 && window.tipsyNet.roster.every((p) => p.connected) ? window.tipsyNet.roster : null)), 5000, '4-player roster');
    assert.deepEqual(r.map((p) => p.name).sort(), names.slice().sort());
    const players = await hostEval(() => window.game.session.players.map((p) => ({ slot: p.slot, name: p.name, connected: p.connected })));
    assert.equal(players.length, 4);
    assert.ok(players.every((p) => p.connected));
    assert.equal(await hostEval(() => window.__ev.joined.length), 4, 'playerJoined fired 4 times');
    // the lobby shows the https join QR
    const qr = await hostEval(() => ({ svg: !!document.querySelector('#join-qr > svg'), url: document.getElementById('join-url').textContent }));
    assert.ok(qr.svg, 'QR svg rendered into #join-qr');
    assert.match(qr.url, /^https:\/\/127\.0\.0\.1:\d+\/controller$/);
  });

  test('SSE fallback: the phone whose WebSocket always fails joins over SSE+POST', async () => {
    const s1 = await S(P[1]);
    assert.equal(s1.transport, 'sse');
    assert.equal(await P[1].page.evaluate(() => sessionStorage.getItem('tipsyKart.transport')), 'sse');
    const r = await hostEval((slot) => window.tipsyNet.roster.find((p) => p.slot === slot).transport, P[1].slot);
    assert.equal(r, 'sse');
    assert.equal(await hostEval((slot) => window.tipsyNet.roster.find((p) => p.slot === slot).transport, P[0].slot), 'ws');
  });

  test('tilt mapping through the hub (calibrated at 0): +20 -> ~0.43, symmetric, deadzone, full lock', { timeout: 20000 }, async () => {
    const steerAt = async (deg) => {
      await P[0].cdp.send('DeviceOrientation.setDeviceOrientationOverride', betaGammaFor(deg));
      await sleep(400); // 40 ms low-pass + send tick + relay
      return (await hostEval((slot) => window.tipsyNet.lastInput(slot), P[0].slot)).steer;
    };
    const plus = await steerAt(20);
    assert.ok(plus >= 0.33 && plus <= 0.53, `+20 deg -> ${plus}`);
    const minus = await steerAt(-20);
    assert.ok(minus < 0 && Math.abs(plus + minus) <= 0.05, `-20 deg -> ${minus}`);
    assert.equal(await steerAt(2), 0);
    assert.equal(await steerAt(60), 1);
    assert.equal(await steerAt(0), 0);
    assert.equal((await lastCall(P[0].slot)).steer, 0, 'the game got it via setPlayerInput');
  });

  test('page hygiene: touch-action none, rotate overlay in portrait', async () => {
    assert.equal(await P[2].page.evaluate(() => getComputedStyle(document.body).touchAction), 'none');
    const extra = await (await phoneContext()).newPage();
    await extra.setViewportSize({ width: 390, height: 844 });
    await extra.goto(`${srv.url}/controller`);
    assert.ok(await extra.isVisible('#rotate'));
    await extra.setViewportSize({ width: 844, height: 390 });
    assert.ok(!(await extra.isVisible('#rotate')));
    await extra.context().close();
  });

  test('insecure origin + cross-origin hand-off keeps the token and the slot', { skip: !lan && 'no LAN IPv4 address', timeout: 30000 }, async () => {
    const ph = P[3];
    assert.equal(await ph.page.evaluate(() => window.isSecureContext), false);
    await ph.page.tap('#cardGear');
    assert.ok(await ph.page.isDisabled('#setMode button[data-mode=tilt]'), 'tilt option disabled');
    assert.match(await ph.page.textContent('#whyTiltText'), /secure link/);
    const token = await ph.page.evaluate(() => window.tipsyController.S.token);
    const href = await ph.page.getAttribute('#secureLink', 'href');
    assert.ok(href.startsWith('https://') && href.includes(`#tk=${token}`), href);
    await ph.page.tap('#setClose');
    // open the secure link in the same browser: different origin, same token via the hash
    const sec = await ph.ctx.newPage();
    await sec.goto(href.replace(lan, '127.0.0.1'));
    await sec.waitForFunction(() => window.tipsyController && window.tipsyController.S.slot != null, null, { timeout: 10000 });
    const s = await sec.evaluate(() => ({ slot: window.tipsyController.S.slot, resumed: window.tipsyController.S.resumed, tk: window.tipsyController.S.token }));
    assert.equal(s.tk, token);
    assert.equal(s.slot, ph.slot);
    assert.equal(s.resumed, true);
    await ph.page.waitForFunction(() => window.tipsyController.S.ended && /somewhere else/.test(window.tipsyController.S.ended.title));
    await sec.close();
    await ph.page.reload();
    await ph.page.waitForFunction(() => window.tipsyController.S.slot != null);
    await letsGo(ph);
    assert.equal((await S(ph)).slot, ph.slot);
  });

  test('room full: a 5th phone queues, takes the freed slot, and leaves again', { timeout: 30000 }, async () => {
    const fifth = await openPhone(await phoneContext(), srv.url);
    await letsGo(fifth, 'Eve');
    assert.equal((await S(fifth)).queuePos, 1);
    assert.ok(await fifth.page.isVisible('#full'));
    // P2 leaves from the settings sheet
    await P[2].page.tap('#cardGear');
    await P[2].page.tap('#setLeave');
    await fifth.page.waitForFunction((slot) => window.tipsyController.S.slot === slot, P[2].slot, { timeout: 5000 });
    assert.ok(!(await fifth.page.isVisible('#full')));
    assert.ok(await P[2].page.isVisible('#ended'));
    const left = await hostEval(() => window.__ev.left.slice(-1)[0]);
    assert.deepEqual([left.reason, left.released], ['leave', true]);
    // the 5th phone leaves; P2 joins again (same token, as a newcomer) and gets its slot back
    await fifth.page.tap('#cardGear');
    await fifth.page.tap('#setLeave');
    await sleep(200);
    await P[2].page.tap('#rejoin');
    await P[2].page.waitForFunction((slot) => window.tipsyController.S.slot === slot, P[2].slot, { timeout: 5000 });
    await fifth.ctx.close();
  });

  test('resume: closing and reopening the page returns the same slot (left released:false, joined reconnected)', { timeout: 30000 }, async () => {
    const ph = P[2];
    const before = await hostEval(() => ({ j: window.__ev.joined.length, l: window.__ev.left.length }));
    await ph.page.close();
    await until(() => hostEval((n) => window.__ev.left.length > n, before.l), 6000, 'left event');
    const left = await hostEval(() => window.__ev.left.slice(-1)[0]);
    assert.equal(left.slot, ph.slot);
    assert.equal(left.released, false);
    assert.equal(await hostEval((slot) => window.game.session.players.find((p) => p.slot === slot).connected, ph.slot), false);
    const again = await openPhone(ph.ctx, srv.url);
    const s = await S(again);
    assert.equal(s.slot, ph.slot);
    assert.equal(s.resumed, true);
    const j = await until(() => hostEval((n) => window.__ev.joined[n], before.j), 3000, 'joined event');
    assert.equal(j.reconnected, true);
    await letsGo(again);
    P[2] = Object.assign(again, { slot: ph.slot });
  });

  test('latency: every rtt < 50 ms on loopback, shown in phone settings', { timeout: 15000 }, async () => {
    await sleep(4500); // at least two ping rounds for the resumed phone
    const rtts = await hostEval(() => window.tipsyNet.roster.map((p) => p.rtt));
    assert.equal(rtts.length, 4);
    assert.ok(rtts.every((x) => x >= 0 && x < 50), JSON.stringify(rtts));
    await P[0].page.tap('#cardGear');
    assert.match(await P[0].page.textContent('#conninfo'), /wss .* \d+ ms/);
    await P[0].page.tap('#setClose');
  });

  test('vibe cues: Android pattern, iPhone colour flash', async () => {
    await hostEval((slot) => window.tipsyNet.vibe(slot, 'lap'), P[0].slot);
    await P[0].page.waitForFunction(() => window.__vib.some((p) => JSON.stringify(p) === '[40,60,40]'), null, { timeout: 3000 });
    assert.equal(await P[3].page.evaluate(() => typeof navigator.vibrate), 'undefined');
    await hostEval((slot) => window.tipsyNet.vibe(slot, 'lap'), P[3].slot);
    await P[3].page.waitForFunction(() => document.getElementById('flash').classList.contains('on'), null, { timeout: 3000 });
  });

  test('connect timeout: a WebSocket that never answers falls back to SSE (and a queued phone stays on its transport)', { timeout: 30000 }, async () => {
    const ctx = await browser.newContext({ ...devices['Pixel 7 landscape'], ignoreHTTPSErrors: true });
    await ctx.addInitScript(() => { window.WebSocket = class { constructor() { this.readyState = 0; } send() {} close() {} }; });
    const page = await ctx.newPage();
    await page.goto(`${srv.secureUrl}/controller`);
    // 2 x 4 s connect timeouts, then SSE; the room is full, so it ends up queued over SSE
    await page.waitForFunction(() => window.tipsyController.link.transport === 'sse' && window.tipsyController.S.queuePos > 0, null, { timeout: 15000 });
    await ctx.close();
  });

  test('phone watchdog: a socket that silently stops delivering is replaced within ~5-7 s, same slot', { timeout: 30000 }, async () => {
    const ph = P[2];
    const before = await hostEval(() => window.__ev.joined.length);
    await ph.page.evaluate(() => { window.tipsyController.link.ws.onmessage = null; }); // deaf, but the TCP socket stays open
    const t0 = Date.now();
    const j = await until(() => hostEval((n) => window.__ev.joined.slice(n).find((x) => x.reconnected), before), 12000, 'watchdog reconnect');
    assert.equal(j.slot, ph.slot);
    const dt = Date.now() - t0;
    assert.ok(dt >= 4000 && dt < 9000, `watchdog after ${dt} ms`);
    await ph.page.waitForFunction(() => window.tipsyController.link.status === 'online');
  });

  test('iOS-style motion permission: only requested inside the Let\'s go tap; denial falls back to touch', { timeout: 30000 }, async () => {
    const ok = await openPhone(await phoneContext({ perm: 'granted' }), srv.secureUrl, { orientation: 0 });
    assert.deepEqual(await ok.page.evaluate(() => window.__perm), [], 'not requested on load');
    await letsGo(ok, 'Ios');
    await ok.page.waitForFunction(() => window.tipsyController.S.tiltWhy !== undefined && window.tipsyController.S.started);
    assert.deepEqual(await ok.page.evaluate(() => window.__perm), [true]);
    assert.equal((await S(ok)).mode, 'tilt');
    await ok.ctx.close();

    const no = await openPhone(await phoneContext({ perm: 'denied' }), srv.secureUrl, { orientation: 0 });
    await letsGo(no, 'Nope');
    const s = await S(no);
    assert.equal(s.mode, 'touch');
    assert.equal(s.tiltWhy, 'denied');
    assert.match(await no.page.evaluate(() => { window.tipsyController.S.settingsOpen = true; document.getElementById('cardGear').click(); return document.getElementById('whyTiltText').textContent; }), /Motion access was blocked/);
    await no.ctx.close();
  });

  test('race: touch stick + gas, drift band roll, release; reaches the game within budget', { timeout: 60000 }, async () => {
    await hostEval(() => { window.game.startCup({ laps: 2, races: 1, cpuCount: 0 }); });
    await host.waitForFunction(() => window.game.getState().phase === 'racing', null, { timeout: 30000 });
    for (const ph of P) await ph.page.waitForFunction(() => !document.getElementById('pad').classList.contains('hidden'), null, { timeout: 5000 });

    const ph = P[2];
    const limit = await budget();
    const gas = await center(ph.page, '#gasArea');
    const stick = await center(ph.page, '#stickZone');
    const R = 0.11 * Math.min(ph.page.viewportSize().width, 900);
    await ph.fingers.down(1, gas.x, gas.y);
    await ph.fingers.down(2, stick.x, stick.y);
    const t0 = Date.now(); // measured from the last touch event the phone received
    await ph.fingers.move(2, stick.x + R + 10, stick.y);
    const hit = await until(async () => { const c = await lastCall(ph.slot); return c && c.throttle === 1 && c.steer >= 0.95 ? c : null; }, 2000, 'gas + full right');
    const dt = Date.now() - t0;
    console.log(`touch gas+steer -> game: ${dt} ms (budget ${limit} ms)`);
    assert.ok(dt < limit, `gas+steer reached the game in ${dt} ms (budget ${limit})`);
    assert.equal(hit.drift, false);
    const drift = await center(ph.page, '#driftBand');
    await ph.fingers.move(1, drift.x, drift.y);
    await until(async () => { const c = await lastCall(ph.slot); return c && c.drift === true && c.throttle === 1; }, 1000, 'drift band');
    await ph.fingers.upAll();
    await until(async () => { const c = await lastCall(ph.slot); return c && c.throttle === 0 && c.steer === 0 && c.drift === false; }, 1000, 'release');
  });

  test('item: 3 quick taps -> exactly 3 setPlayerInput calls with useItem:true', { timeout: 20000 }, async () => {
    const ph = P[2];
    const n0 = await hostEval((s) => window.__calls.filter((c) => c.slot === s && c.useItem).length, ph.slot);
    const item = await center(ph.page, '#itemBtn');
    for (let i = 0; i < 3; i++) { await ph.fingers.down(5, item.x, item.y); await ph.fingers.upAll(); await sleep(40); }
    await sleep(600);
    const n1 = await hostEval((s) => window.__calls.filter((c) => c.slot === s && c.useItem).length, ph.slot);
    assert.equal(n1 - n0, 3);
    assert.equal(await ph.page.evaluate(() => window.tipsyController.controls.itemCount), 3);
  });

  test('SSE phone: stick changes reach the game quickly', { timeout: 20000 }, async () => {
    const ph = P[1];
    const limit = await budget();
    const stick = await center(ph.page, '#stickZone');
    const R = 0.11 * Math.min(ph.page.viewportSize().width, 900);
    await ph.fingers.down(1, stick.x, stick.y);
    const t0 = Date.now();
    await ph.fingers.move(1, stick.x - R - 10, stick.y);
    await until(async () => { const c = await lastCall(ph.slot); return c && c.steer <= -0.95; }, 2000, 'sse steer');
    const dt = Date.now() - t0;
    console.log(`SSE steer -> game: ${dt} ms (budget ${limit} ms)`);
    assert.ok(dt < limit, `sse steer in ${dt} ms (budget ${limit})`);
    await ph.fingers.upAll();
    await until(async () => { const c = await lastCall(ph.slot); return c && c.steer === 0; }, 1000, 'sse release');
  });

  test('tilt-driven lap: phone 0 holds GAS and steers by tilting; the lap counter advances on the phone', { timeout: 300000 }, async () => {
    const ph = P[0];
    await hostEval(async () => {
      const { AIDriver } = await import('/js/game/ai.js');
      // test-only "driving instructor": computes the steer a good driver would use; the PHONE is tilted to match
      window.__pilotSteer = () => {
        const k = window.game.kartBySlot && window.game.kartBySlot.get(window.__pilotSlot);
        if (!k || !window.game.race) return 0;
        if (!window.__pilot || window.__pilot.kart !== k) window.__pilot = new AIDriver(k, 5);
        return window.__pilot.update(0.05, window.game.race).steer;
      };
    });
    await hostEval((s) => { window.__pilotSlot = s; }, ph.slot);
    const gas = await center(ph.page, '#gasArea');
    await ph.fingers.down(1, gas.x, gas.y);
    const lap0 = await hostEval((s) => window.game.getState().hud.find((h) => h.slot === s).lap, ph.slot);
    assert.equal(lap0, 1);
    const t0 = Date.now();
    let lap = 1;
    while (Date.now() - t0 < 280000) {
      const st = await hostEval((s) => ({ steer: window.__pilotSteer(), lap: window.game.getState().hud.find((h) => h.slot === s).lap }), ph.slot);
      lap = st.lap;
      if (lap >= 2) break;
      await ph.cdp.send('DeviceOrientation.setDeviceOrientationOverride', betaGammaFor(deltaForSteer(st.steer)));
      await sleep(25);
    }
    assert.equal(lap, 2, 'kart completed lap 1 under phone control');
    const c = await lastCall(ph.slot);
    assert.equal(c.throttle, 1);
    await ph.page.waitForFunction(() => window.tipsyController.S.lap === 2 && window.tipsyController.S.laps === 2, null, { timeout: 3000 });
    assert.match(await ph.page.textContent('#statMid'), /Lap 2\/2/);
    await ph.cdp.send('DeviceOrientation.setDeviceOrientationOverride', betaGammaFor(0));
    // keep holding gas for the stale test
  });

  test('stale input coasts within 400 ms; dead after ~5 s; the phone reconnects to the same slot', { timeout: 40000 }, async () => {
    const ph = P[0];
    await until(async () => { const c = await lastCall(ph.slot); return c && c.throttle === 1; }, 2000, 'gas held');
    const before = await hostEval(() => ({ j: window.__ev.joined.length, l: window.__ev.left.length }));
    const limit = 250 + await budget(); // 250 ms stale rule + delivery
    // cut the phone's network (like walking out of Wi-Fi range): no heartbeats, no pongs
    await ph.ctx.setOffline(true);
    const t0 = Date.now();
    await until(async () => { const c = await lastCall(ph.slot); return c && c.throttle === 0 && c.drift === false; }, 2000, 'coast');
    const dc = Date.now() - t0;
    console.log(`coasting after ${dc} ms (budget ${Math.max(400, limit)} ms)`);
    assert.ok(dc < Math.max(400, limit), `coasting after ${dc} ms`);
    await until(() => hostEval((n) => window.__ev.left.length > n, before.l), 9000, 'playerLeft after silence');
    assert.ok(Date.now() - t0 < 8000);
    const left = await hostEval(() => window.__ev.left.slice(-1)[0]);
    assert.deepEqual([left.slot, left.released], [ph.slot, false]);
    assert.equal(await hostEval((s) => window.game.session.players.find((p) => p.slot === s).connected, ph.slot), false);
    await ph.ctx.setOffline(false);
    const j = await until(() => hostEval((n) => window.__ev.joined[n], before.j), 8000, 'auto-reconnect');
    assert.deepEqual([j.slot, j.reconnected], [ph.slot, true]);
    assert.equal(await hostEval((s) => window.game.session.players.find((p) => p.slot === s).connected, ph.slot), true);
    await ph.fingers.upAll();
  });

  test('results card: +1 drink from the phone; host reload restores drinks and phones see the host come back', { timeout: 60000 }, async () => {
    await hostEval(() => window.game.debugFinishRace());
    await host.waitForFunction(() => /results/i.test(window.game.getState().phase), null, { timeout: 10000 });
    const ph = P[0];
    await ph.page.waitForFunction(() => !document.getElementById('card').classList.contains('hidden'), null, { timeout: 5000 });
    await ph.page.tap('#drinkPlus');
    await until(() => hostEval((s) => window.game.session.players.find((p) => p.slot === s).drinks === 1, ph.slot), 3000, 'drink counted');
    await ph.page.waitForFunction(() => document.getElementById('cardDrinksN').textContent === '1', null, { timeout: 3000 });

    await ph.page.evaluate(() => {
      window.__hc = [];
      const prev = window.tipsyController.link.handlers.state;
      window.tipsyController.link.on('state', (m) => { if ('hostConnected' in m) window.__hc.push(m.hostConnected); prev(m); });
    });
    await host.close();
    await openHost();
    await until(() => hostEval(() => window.tipsyNet.roster.length === 4), 5000, 'roster replay');
    await until(() => hostEval((s) => (window.game.session.players.find((p) => p.slot === s) || {}).drinks === 1, ph.slot), 3000, 'drinks restored');
    assert.equal(await hostEval(() => window.game.session.players.length), 4);
    await ph.page.waitForFunction(() => window.__hc.includes(false) && window.__hc[window.__hc.length - 1] === true, null, { timeout: 5000 });
  });

  test('host kick and the lobby remove button both free the slot; the phone can join again', { timeout: 30000 }, async () => {
    const ph = P[3];
    await hostEval((s) => window.tipsyNet.kick(s), ph.slot);
    await ph.page.waitForFunction(() => window.tipsyController.S.ended && /removed/.test(window.tipsyController.S.ended.title), null, { timeout: 5000 });
    await until(() => hostEval((s) => !window.tipsyNet.roster.some((p) => p.slot === s), ph.slot), 3000, 'slot freed');
    await ph.page.tap('#rejoin');
    await ph.page.waitForFunction((slot) => window.tipsyController.S.slot === slot, ph.slot, { timeout: 5000 });
    // engine lobby remove (x) on a phone player -> hub kick
    assert.equal(await hostEval(() => window.game.getState().phase), 'lobby', 'the reloaded host page is in its lobby');
    await until(() => hostEval((s) => window.tipsyNet.roster.some((p) => p.slot === s && p.connected), ph.slot), 3000, 'rejoined');
    await hostEval((s) => window.game.removePlayer(s), ph.slot);
    await ph.page.waitForFunction(() => window.tipsyController.S.ended, null, { timeout: 5000 });
    await until(() => hostEval((s) => !window.tipsyNet.roster.some((p) => p.slot === s), ph.slot), 3000, 'slot freed by lobby remove');
  });

  test('no page errors on host or phones', () => {
    const errs = [].concat(host.__errors || [], ...P.map((p) => p.page.__errors || []));
    assert.deepEqual(errs, []);
  });
});
