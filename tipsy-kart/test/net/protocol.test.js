'use strict';
// Server-side protocol tests: room/slot/token model, queue, resume, kick, idle, reservation,
// state relay, SSE+POST fallback. Pure Node clients, so these run in a couple of seconds.
// Run twice: against the `ws` package and against the hand-rolled net/ws-lite.js (Plan B).

const { test, describe, before, after, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const { startServer, phone, host, token, sleep, waitFor, Client } = require('./helpers');

function postJson(base, tk, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(`${base}/msg?token=${tk}`);
    const data = JSON.stringify(body);
    const req = http.request({ hostname: u.hostname, port: u.port, path: u.pathname + u.search, method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } },
      (res) => { res.resume(); res.on('end', () => resolve(res.statusCode)); });
    req.on('error', reject); req.end(data);
  });
}

/** Minimal SSE phone: GET /sse for the downlink, POST /msg for the uplink. */
async function ssePhone(base, tk, name = 'Sse') {
  const msgs = [];
  const u = new URL(`${base}/sse?token=${tk}`);
  let closedRes = false;
  const req = http.get({ hostname: u.hostname, port: u.port, path: u.pathname + u.search }, (res) => {
    res.setEncoding('utf8');
    let buf = '';
    res.on('data', (d) => {
      buf += d;
      let i;
      while ((i = buf.indexOf('\n\n')) >= 0) {
        const chunk = buf.slice(0, i); buf = buf.slice(i + 2);
        if (chunk.startsWith('data: ')) { const m = JSON.parse(chunk.slice(6)); msgs.push(m); if (m.t === 'ping') postJson(base, tk, [{ t: 'pong', id: m.id }]); }
      }
    });
    res.on('close', () => { closedRes = true; });
  });
  req.on('error', () => {});
  await sleep(50);
  const st = await postJson(base, tk, [{ t: 'hello', v: 1, role: 'phone', token: tk, name, caps: { transport: 'sse', secure: true } }]);
  assert.equal(st, 204);
  return { msgs, post: (arr) => postJson(base, tk, arr), isClosed: () => closedRes, req, of: (t) => msgs.filter((m) => m.t === t) };
}

for (const impl of ['ws', 'lite']) {
  describe(`hub protocol (${impl})`, () => {
    let srv;
    // a fresh server per test: closed phones keep their slot reserved, which is the behaviour under test elsewhere
    beforeEach(async () => { srv = await startServer({ TIPSY_WS: impl === 'lite' ? 'lite' : '' }); });
    afterEach(async () => { await srv.kill(); });

    test('four phones get distinct slots and colours; host roster sees them', async () => {
      const H = await host(srv.url);
      const ps = [];
      for (let i = 0; i < 4; i++) ps.push(await phone(i % 2 ? srv.secureUrl : srv.url, { name: `P${i}` }));
      const ws = await Promise.all(ps.map((p) => p.wait('welcome')));
      assert.deepEqual(ws.map((w) => w.slot).sort(), [0, 1, 2, 3]);
      assert.equal(new Set(ws.map((w) => w.color)).size, 4);
      assert.deepEqual(ws.map((w) => w.colorName).sort(), ['Cherry', 'Lemon', 'Mint', 'Sky']);
      assert.ok(ws.every((w) => w.v === 1 && w.sessionId && w.resumed === false && w.phase === 'lobby'));
      const r = await H.wait((m) => m.t === 'roster' && m.players.length === 4 && m.players.every((p) => p.connected), 3000, '4-player roster');
      assert.equal(r.players.length, 4);
      assert.equal(H.of('joined').length, 4);
      assert.ok(ps.every((p) => p.of('state').length >= 1), 'welcome is followed by a state snapshot');

      // 5th phone: full + queue, then gets a slot when someone leaves
      const q = await phone(srv.url, { name: 'Fifth' });
      assert.equal((await q.wait('full')).queuePos, 1);
      const slotOf3 = ws.find((w) => w.name === 'P3').slot;
      ps[3].send({ t: 'leave' });
      const w5 = await q.wait('welcome');
      assert.equal(w5.slot, slotOf3);
      await H.wait((m) => m.t === 'left' && m.reason === 'leave' && m.released === true);
      for (const p of [...ps, q, H]) p.close();
      await sleep(100);
    });

    test('reconnect with the same token resumes the slot; older connection is replaced', async () => {
      const H = await host(srv.url);
      const tk = token();
      const a = await phone(srv.url, { tk, name: 'Resu' });
      const w1 = await a.wait('welcome');
      const b = await phone(srv.url, { tk, name: 'Resu' });
      const w2 = await b.wait('welcome');
      assert.equal(w2.slot, w1.slot);
      assert.equal(w2.resumed, true);
      assert.equal((await a.waitClose()).code, 4003);
      assert.equal(H.of('left').filter((l) => l.slot === w1.slot).length, 0, 'replacing is not a disconnect');
      // real disconnect, then resume
      b.close();
      const left = await H.wait((m) => m.t === 'left' && m.slot === w1.slot);
      assert.equal(left.released, false);
      assert.equal(left.reason, 'disconnect');
      const c = await phone(srv.url, { tk, name: 'Resu' });
      assert.equal((await c.wait('welcome')).resumed, true);
      const j = await H.wait((m) => m.t === 'joined' && m.slot === w1.slot && m.resumed === true);
      assert.ok(j);
      c.send({ t: 'leave' });
      await H.wait((m) => m.t === 'left' && m.reason === 'leave');
      H.close();
    });

    test('input is relayed immediately and sanitised; dropped when no host', async () => {
      const p = await phone(srv.url, { name: 'Inp' });
      await p.wait('welcome');
      p.send({ t: 'input', seq: 1, steer: 5, throttle: 1, brake: 0, drift: false, item: 0, mode: 'tilt' });
      await sleep(80);
      const H = await host(srv.url);
      p.send({ t: 'input', seq: 2, steer: 5, throttle: -2, brake: 0.123456, drift: true, item: 3, mode: 'tilt' });
      const m = await H.wait((x) => x.t === 'input');
      assert.equal(m.seq, 2);
      assert.equal(m.steer, 1);
      assert.equal(m.throttle, 0);
      assert.equal(m.brake, 0.12);
      assert.equal(m.drift, true);
      assert.equal(m.item, 3);
      assert.equal(m.mode, 'tilt');
      assert.equal(H.of('input').length, 1, 'the input sent before the host connected was dropped');
      // relay latency through the hub (loopback): 20 inputs, worst case well under the 150 ms budget
      const lat = [];
      for (let i = 0; i < 21; i++) {
        const t0 = process.hrtime.bigint();
        p.send({ t: 'input', seq: 100 + i, steer: 0, throttle: 0, brake: 0, drift: false, item: 3, mode: 'tilt' });
        await H.wait((x) => x.t === 'input' && x.seq === 100 + i, 2000, 'relayed input');
        lat.push(Number(process.hrtime.bigint() - t0) / 1e6);
      }
      lat.sort((x, y) => x - y);
      // median, so a busy shared CI box (scheduler hiccups) does not fail the run; the worst case is logged
      console.log(`relay latency median ${lat[10].toFixed(1)} ms, worst ${lat[20].toFixed(1)} ms`);
      assert.ok(lat[10] < 50, `median relay ${lat[10].toFixed(1)} ms`);
      // unknown types and junk are ignored
      p.send({ t: 'wat', x: 1 });
      p.send('not json');
      p.send({ nope: 1 });
      await sleep(80);
      assert.equal(p.closed, null);
      p.send({ t: 'leave' });
      H.close();
      await sleep(50);
    });

    test('host state reaches phones merged, vibe and toast are forwarded, drinks go to host', async () => {
      const H = await host(srv.url);
      const p = await phone(srv.url, { name: 'Hud' });
      const w = await p.wait('welcome');
      H.send({ t: 'state', slot: 'all', phase: 'racing', raceIndex: 1 });
      H.send({ t: 'state', slot: w.slot, place: 2, of: 8, lap: 1, laps: 3, item: 'bottle', drinks: 2, impair: { level: 0.4, label: 'Giggly' } });
      const st = await p.wait((m) => m.t === 'state' && m.place === 2);
      assert.equal(st.phase, 'racing');
      assert.equal(st.impair.label, 'Giggly');
      H.send({ t: 'vibe', slot: w.slot, cue: 'lap' });
      assert.equal((await p.wait('vibe')).cue, 'lap');
      H.send({ t: 'toast', slot: 'all', text: 'Hello', ms: 1000 });
      assert.equal((await p.wait('toast')).text, 'Hello');
      // drinks are refused while racing
      p.send({ t: 'drink', delta: 1 });
      await sleep(100);
      assert.equal(H.of('drink').length, 0);
      H.send({ t: 'state', slot: 'all', phase: 'results' });
      await p.wait((m) => m.t === 'state' && m.phase === 'results');
      p.send({ t: 'drink', delta: 1 });
      const d = await H.wait('drink');
      assert.deepEqual([d.slot, d.delta], [w.slot, 1]);
      // the server caches lastState for a reloaded host page
      const H2 = await host(srv.url);
      const r = H2.last('roster');
      assert.equal(r.players.find((x) => x.slot === w.slot).lastState.drinks, 2);
      assert.equal((await H.waitClose()).code, 4004, 'old host replaced');
      assert.ok(H.of('hostReplaced').length);
      // host reload flips hostConnected for phones
      H2.close();
      await p.wait((m) => m.t === 'state' && m.hostConnected === false);
      const H3 = await host(srv.url);
      await p.wait((m) => m.t === 'state' && m.hostConnected === true);
      H3.send({ t: 'state', slot: 'all', phase: 'lobby' });
      p.send({ t: 'leave' });
      await sleep(50);
      H3.close();
    });

    test('host kick frees the slot', async () => {
      const H = await host(srv.url);
      const p = await phone(srv.url, { name: 'Kick' });
      const w = await p.wait('welcome');
      H.send({ t: 'kick', slot: w.slot });
      assert.equal((await p.wait('kicked')).reason, 'host');
      assert.equal((await p.waitClose()).code, 4002);
      const l = await H.wait((m) => m.t === 'left' && m.slot === w.slot);
      assert.equal(l.released, true);
      assert.equal(l.reason, 'kicked');
      const again = await phone(srv.url, { tk: p.token, name: 'Kick' });
      assert.equal((await again.wait('welcome')).resumed, false, 'a kicked token joins as a newcomer');
      again.send({ t: 'leave' });
      H.close();
      await sleep(50);
    });

    test('guards: bad token, bad role, oversized, other upgrade path, foreign origin', async () => {
      const a = new Client(srv.url); await a.opened;
      a.send({ t: 'hello', v: 1, role: 'phone', token: 'short', name: 'x' });
      assert.equal((await a.waitClose()).code, 4005);

      const b = await phone(srv.url, { name: 'Big' });
      await b.wait('welcome');
      b.send({ t: 'name', name: 'x'.repeat(5000) });
      assert.equal((await b.waitClose()).code, 1009);

      const c = await phone(srv.url, { name: 'Junk' });
      await c.wait('welcome');
      for (let i = 0; i < 25; i++) c.send('}{');
      assert.equal((await c.waitClose()).code, 1007);

      const WebSocket = require('ws');
      const bad = new WebSocket(srv.url.replace('http', 'ws') + '/other');
      const err = await new Promise((res) => { bad.on('error', (e) => res(e)); bad.on('open', () => res(null)); });
      assert.ok(err, 'upgrade to a path other than /ws is refused');

      const evil = new WebSocket(srv.url.replace('http', 'ws') + '/ws', { headers: { Origin: 'http://evil.example' } });
      const err2 = await new Promise((res) => { evil.on('error', (e) => res(e)); evil.on('open', () => res(null)); });
      assert.ok(err2, 'a foreign Origin is refused');

      // DNS rebinding: a page on evil.example resolving to 127.0.0.1 cannot become the host
      const reb = new Client(srv.url, { headers: { Host: `evil.example:${srv.httpPort}` } }); await reb.opened;
      reb.send({ t: 'hello', v: 1, role: 'host' });
      assert.equal((await reb.waitClose()).code, 4005);

      const hostile = require('../../net/hub').getHub();
      assert.equal(hostile.isLocal({ remoteAddress: '10.9.9.9' }), false);
      assert.equal(hostile.isLocal({ remoteAddress: '::ffff:127.0.0.1' }), true);
      b.close(); c.close();
    });

    test('SSE + POST fallback joins, relays input, reports transport, and is replaced cleanly', async () => {
      const H = await host(srv.url);
      assert.equal(await postJson(srv.url, token(), [{ t: 'pong', id: 1 }]), 409, 'no stream -> 409');
      const tk = token();
      const s = await ssePhone(srv.url, tk, 'Sse1');
      await waitFor(() => s.of('welcome')[0], 2000, 'sse welcome');
      assert.equal(s.of('welcome')[0].resumed, false);
      await s.post([{ t: 'input', seq: 1, steer: 0.5, throttle: 1, brake: 0, drift: false, item: 0, mode: 'touch' },
        { t: 'input', seq: 2, steer: -0.5, throttle: 1, brake: 0, drift: false, item: 1, mode: 'touch' }]);
      await H.wait((m) => m.t === 'input' && m.seq === 2);
      const r = await H.wait((m) => m.t === 'roster' && m.players.some((p) => p.transport === 'sse'));
      assert.ok(r);
      H.send({ t: 'vibe', slot: s.of('welcome')[0].slot, cue: 'go' });
      await waitFor(() => s.of('vibe')[0], 2000, 'sse vibe');
      // a second stream for the same token replaces the first without a leave on the host
      const leftBefore = H.of('left').length;
      const s2 = await ssePhone(srv.url, tk, 'Sse1');
      await waitFor(() => s2.of('welcome')[0], 2000, 'sse resume');
      assert.equal(s2.of('welcome')[0].resumed, true);
      await sleep(100);
      assert.equal(H.of('left').length, leftBefore, 'no left event for a same-token SSE replace');
      await waitFor(() => s.isClosed(), 2000, 'first stream closed');
      await s2.post([{ t: 'leave' }]);
      H.close();
      await sleep(50);
    });
  });
}

describe('timing rules (short timers)', () => {
  let srv;
  before(async () => { srv = await startServer({ TIPSY_IDLE_MS: '1500', TIPSY_LOBBY_RESERVE_MS: '700', TIPSY_LOBBY_CAP_MS: '4000' }); });
  after(async () => { await srv.kill(); });

  // four phones that keep "playing" (changing input) so only the target goes idle
  async function fillRoom(H, n) {
    const ps = [];
    for (let i = 0; i < n; i++) { const p = await phone(srv.url, { name: `F${i}` }); await p.wait('welcome'); ps.push(p); }
    let x = 0;
    const iv = setInterval(() => { x = 1 - x; for (const p of ps) p.send({ t: 'input', seq: 1, steer: x ? 0.5 : -0.5, throttle: 0, brake: 0, drift: false, item: 0, mode: 'touch' }); }, 200);
    return { ps, stop() { clearInterval(iv); for (const p of ps) p.send({ t: 'leave' }); } };
  }

  test('lobby idle kick only while someone is queued; otherwise only at the hard cap; never during a cup', async () => {
    const H = await host(srv.url);
    // alone in the room: no kick at the idle limit (drinks would be wiped for nothing) ...
    const p = await phone(srv.url, { name: 'Idle' });
    const w = await p.wait('welcome');
    const beat = setInterval(() => p.send({ t: 'input', seq: 1, steer: 0, throttle: 0, brake: 0, drift: false, item: 0, mode: 'touch' }), 100);
    await sleep(2200);
    assert.equal(p.of('kicked').length, 0, 'not kicked at the short limit without a queue');
    // ... but the hard cap still applies (toast first)
    await p.wait('toast', 3000, 'still-there toast before the cap');
    const k = await p.wait('kicked', 4000, 'cap kick');
    assert.equal(k.reason, 'idle');
    clearInterval(beat);
    assert.equal((await H.wait((m) => m.t === 'left' && m.slot === w.slot && m.reason === 'idle')).released, true);

    // with someone queued, the short limit applies
    const room = await fillRoom(H, 3);
    const t = await phone(srv.url, { name: 'Target' });
    const wt = await t.wait('welcome');
    const beat2 = setInterval(() => t.send({ t: 'input', seq: 1, steer: 0, throttle: 0, brake: 0, drift: false, item: 0, mode: 'touch' }), 100);
    const q = await phone(srv.url, { name: 'Queued' });
    await q.wait('full');
    const t0 = Date.now();
    assert.equal((await t.wait('kicked', 3000, 'idle kick with a queue')).reason, 'idle');
    assert.ok(Date.now() - t0 < 2000);
    assert.equal((await q.wait('welcome')).slot, wt.slot, 'the queued phone takes the slot');
    clearInterval(beat2);
    q.send({ t: 'leave' });
    room.stop();
    await sleep(200);

    // during a cup nobody is kicked for idleness, even at the cap
    H.send({ t: 'state', slot: 'all', phase: 'racing' });
    const r = await phone(srv.url, { name: 'Race' });
    await r.wait('welcome');
    await sleep(4500);
    assert.equal(r.of('kicked').length, 0);
    r.send({ t: 'leave' });
    H.send({ t: 'state', slot: 'all', phase: 'lobby' });
    H.close();
    await sleep(100);
  });

  test('lobby reservation expires quickly only while someone is queued; otherwise at the cap; never in a cup', async () => {
    const H = await host(srv.url);
    const a = await phone(srv.url, { name: 'Gone' });
    const wa = await a.wait('welcome');
    a.close();
    assert.equal((await H.wait((m) => m.t === 'left' && m.slot === wa.slot && m.released === false)).reason, 'disconnect');
    await sleep(1200);
    assert.equal(H.of('left').filter((m) => m.reason === 'expired').length, 0, 'kept past the reserve time: nobody waiting');
    const exp = await H.wait((m) => m.t === 'left' && m.slot === wa.slot && m.reason === 'expired', 4000, 'cap expiry');
    assert.equal(exp.released, true);

    // with a queue: quick expiry
    const room = await fillRoom(H, 3);
    const b = await phone(srv.url, { name: 'B' });
    const wb = await b.wait('welcome');
    const q = await phone(srv.url, { name: 'Q' });
    await q.wait('full');
    b.close();
    const t0 = Date.now();
    await H.wait((m) => m.t === 'left' && m.slot === wb.slot && m.reason === 'expired', 3000, 'quick expiry');
    assert.ok(Date.now() - t0 < 2000);
    assert.equal((await q.wait('welcome')).slot, wb.slot);
    q.send({ t: 'leave' });
    room.stop();
    await sleep(200);

    // during a cup the reservation holds even past the cap
    H.send({ t: 'state', slot: 'all', phase: 'racing' });
    const c = await phone(srv.url, { name: 'Racer' });
    const wc = await c.wait('welcome');
    c.close();
    await H.wait((m) => m.t === 'left' && m.slot === wc.slot && m.released === false);
    const expiredBefore = H.of('left').filter((m) => m.reason === 'expired').length;
    await sleep(4500);
    assert.equal(H.of('left').filter((m) => m.reason === 'expired').length, expiredBefore, 'reservation holds during a cup');
    const c2 = await phone(srv.url, { tk: c.token, name: 'Racer' });
    assert.equal((await c2.wait('welcome')).resumed, true);
    H.send({ t: 'state', slot: 'all', phase: 'lobby' });
    c2.send({ t: 'leave' });
    H.close();
    await sleep(50);
  });

  test('silent phone is declared dead after 5 s (reservation kept)', async () => {
    const H = await host(srv.url);
    const p = await phone(srv.url, { name: 'Mute', autoPong: false });
    const w = await p.wait('welcome');
    H.send({ t: 'state', slot: 'all', phase: 'racing' });
    const t0 = Date.now();
    const l = await H.wait((m) => m.t === 'left' && m.slot === w.slot, 8000, 'dead detection');
    const dt = Date.now() - t0;
    assert.ok(dt >= 4000 && dt < 7500, `dead after ${dt}ms`);
    assert.equal(l.released, false);
    await p.waitClose(2000);
    H.send({ t: 'state', slot: 'all', phase: 'lobby' });
    H.close();
  });
});

describe('server surface', () => {
  test('/api/info is merged, https serves the same app, hello timeout closes 4001', async () => {
    const srv = await startServer();
    try {
      const i = srv.info;
      assert.equal(i.joinMode, 'https');
      assert.match(i.joinUrl, /^https:\/\/127\.0\.0\.1:\d+\/controller$/);
      assert.match(i.httpJoinUrl, /^http:\/\/127\.0\.0\.1:\d+\/controller$/);
      assert.ok(i.certFingerprint && i.ips.includes('127.0.0.1'));
      assert.ok(Array.isArray(i.lanUrls), 'the static server fields are preserved');
      const sec = await require('./helpers').getJson(`${srv.secureUrl}/api/info`);
      assert.equal(sec.httpsPort, i.httpsPort);
      const idle = new Client(srv.url); await idle.opened;
      const c = await idle.waitClose(7000);
      assert.equal(c.code, 4001);
    } finally { await srv.kill(); }
  });

  test('TIPSY_JOIN=http puts the http url in joinUrl; TIPSY_HTTPS=0 gives http only', async () => {
    const a = await startServer({ TIPSY_JOIN: 'http' });
    try { assert.equal(a.info.joinUrl, a.info.httpJoinUrl); assert.equal(a.info.joinMode, 'http'); assert.ok(a.info.secureJoinUrl); } finally { await a.kill(); }
    const b = await startServer({ TIPSY_HTTPS: '0' });
    try { assert.equal(b.info.httpsPort, null); assert.equal(b.info.secureJoinUrl, null); assert.equal(b.info.joinUrl, b.info.httpJoinUrl); } finally { await b.kill(); }
  });

  test('cert fallback: openssl is used when selfsigned is unavailable', async () => {
    const a = await startServer({ TIPSY_NO_SELFSIGNED: '1' });
    try { assert.equal(a.info.certSource, 'openssl'); assert.ok(a.info.httpsPort); } finally { await a.kill(); }
  });
});
