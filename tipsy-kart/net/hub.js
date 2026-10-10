'use strict';
// Tipsy Kart network hub (phone-controls spec sections 1 and 2).
//
// One room per server process. The hub owns the roster (slot, token, name, colour,
// connection health); the host page owns the game. The hub relays phone input to the
// host page immediately and relays host HUD state back to the phones at <= 10 Hz.
//
// Entry point: attach(httpServer). It
//   - wraps the server's 'request' listeners so /sse, /msg and a merged /api/info are
//     answered here, and everything else falls through to the original static handler;
//   - answers WebSocket upgrades on /ws;
//   - starts the HTTPS twin (default port 3443) with a self-signed cert, reusing the very
//     same request handler, so server.js needs no changes.

const http = require('http');
const https = require('https');
const crypto = require('crypto');
const lan = require('./lan');
const certs = require('./cert');
const { WsConn, SseConn } = require('./conn');

const COLORS = [
  { color: '#FF4D6D', name: 'Cherry' },
  { color: '#3A86FF', name: 'Sky' },
  { color: '#FFBE0B', name: 'Lemon' },
  { color: '#06D6A0', name: 'Mint' },
];
const MAX_PLAYERS = 4;
const PHONE_MAX_BYTES = 4096;
const TOKEN_RE = /^[A-Za-z0-9_-]{16,64}$/;
const DEAD_MS = 5000;
const HELLO_MS = 5000;
const PING_MS = 2000;
const STATE_FLUSH_MS = 100;
const ROSTER_MIN_MS = 250;
const UNSAFE_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

function envInt(name, dflt) {
  const v = parseInt(process.env[name], 10);
  return Number.isFinite(v) && v >= 0 ? v : dflt;
}

function loadWsServerCtor() {
  if (process.env.TIPSY_WS !== 'lite') {
    try { return require('ws').WebSocketServer; } catch (e) { /* fall through to the hand-rolled one */ }
  }
  if (process.env.TIPSY_QUIET !== '1' || process.env.TIPSY_WS === 'lite') console.log('[tipsy-kart] using the built-in WebSocket server (net/ws-lite.js): the `ws` package is not installed or TIPSY_WS=lite');
  return require('./ws-lite').WebSocketServer;
}

function cleanName(s, fallback) {
  // eslint-disable-next-line no-control-regex
  const t = String(s == null ? '' : s).replace(/[\u0000-\u001f\u007f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 12);
  return t || fallback;
}

function num(v, lo, hi, dflt = 0) {
  v = Number(v);
  if (!Number.isFinite(v)) return dflt;
  return v < lo ? lo : v > hi ? hi : v;
}

function safeMerge(target, src, skip) {
  for (const k of Object.keys(src)) {
    if (UNSAFE_KEYS.has(k) || (skip && skip.includes(k))) continue;
    target[k] = src[k];
  }
  return target;
}

class Hub {
  constructor() {
    this.cfg = {
      idleMs: envInt('TIPSY_IDLE_MS', 180000),
      reserveMs: envInt('TIPSY_LOBBY_RESERVE_MS', 60000),
      // Idle kicks and reservation expiry wipe a player's drinks, so they only happen when someone
      // is waiting in the queue for the slot, or after this hard cap.
      capMs: envInt('TIPSY_LOBBY_CAP_MS', 15 * 60000),
      hostAny: process.env.TIPSY_HOST_ANY === '1',
    };
    this.sessionId = crypto.randomBytes(8).toString('hex');
    this.players = new Array(MAX_PLAYERS).fill(null);
    this.queue = []; // { conn, token, name, caps }
    this.host = null;
    this.room = { phase: 'lobby' };
    this.lobbySince = Date.now();
    this.sse = new Map(); // token -> SseConn
    this.conns = new Set();
    this.servers = new Set();
    this.attached = new WeakSet();
    this.origListeners = [];
    this.https = null;
    this.httpPort = null;
    this.httpsPort = null;
    this.tls = null;
    this.tlsNote = null;
    this.rosterTimer = null;
    this.rosterLast = 0;
    this.rosterDirtyFlag = false;
    this.pingSeq = 1;
    this.localAddrs = lan.localAddresses();
    this.timers = [];
    this.wss = null;
    this.ready = new Promise((r) => { this.resolveReady = r; });
    this.dead = false;
  }

  // ---------------------------------------------------------------- info / urls

  info() {
    const ips = lan.getLanIps();
    const primary = ips[0] || null;
    const hostName = primary || 'localhost';
    const httpUrl = this.httpPort != null ? `http://${hostName}:${this.httpPort}` : null;
    const secureUrl = this.httpsPort != null ? `https://${hostName}:${this.httpsPort}` : null;
    const wantHttp = process.env.TIPSY_JOIN === 'http';
    const joinBase = secureUrl && !wantHttp ? secureUrl : httpUrl;
    return {
      name: 'Tipsy Kart',
      ips,
      primaryIp: primary,
      httpPort: this.httpPort,
      httpsPort: this.httpsPort,
      joinUrl: joinBase ? `${joinBase}/controller` : null,
      httpJoinUrl: httpUrl ? `${httpUrl}/controller` : null,
      secureJoinUrl: secureUrl ? `${secureUrl}/controller` : null,
      certFingerprint: this.tls ? this.tls.fingerprint : null,
      certSource: this.tls ? this.tls.source : null,
      certRegenerated: !!(this.tls && this.tls.regenerated),
      joinMode: joinBase && joinBase === secureUrl ? 'https' : 'http',
      hints: lan.hints(),
      sessionId: this.sessionId,
      maxPlayers: MAX_PLAYERS,
    };
  }

  // ---------------------------------------------------------------- attaching servers

  attachServer(server) {
    if (this.attached.has(server)) return;
    this.attached.add(server);
    this.servers.add(server);
    if (!this.wss) {
      const WSS = loadWsServerCtor();
      this.wss = new WSS({ noServer: true, maxPayload: 65536, perMessageDeflate: false });
      this.startTimers();
    }

    // Wrap the existing request listeners (server.js's static handler) once.
    const originals = server.listeners('request');
    if (!this.origListeners.length) this.origListeners = originals;
    server.removeAllListeners('request');
    server.on('request', (req, res) => this.dispatch(req, res));
    server.on('upgrade', (req, socket, head) => this.onUpgrade(req, socket, head));

    if (server instanceof http.Server && !(server instanceof https.Server) && !this.primary) {
      this.primary = server;
      const origClose = server.close;
      // server.close() would otherwise wait forever on our long-lived WS/SSE sockets.
      server.close = (...args) => { this.shutdown(); return origClose.apply(server, args); };
      const onListening = () => {
        const a = server.address();
        this.httpPort = a && typeof a === 'object' ? a.port : null;
        this.startHttps(server).then(() => this.resolveReady(), () => this.resolveReady());
      };
      if (server.listening) onListening(); else server.once('listening', onListening);
    }
  }

  async startHttps(primary) {
    if (process.env.TIPSY_HTTPS === '0') { this.tlsNote = 'HTTPS disabled (TIPSY_HTTPS=0).'; this.banner(); return; }
    let tls = null;
    try { tls = await certs.getTlsOptions(lan.getLanIps(), (m) => console.warn(`[tipsy-kart] ${m}`)); } catch (e) { console.warn('[tipsy-kart] certificate error:', e.message); }
    if (this.dead) return;
    if (!tls) {
      this.tlsNote = 'No TLS certificate could be made: HTTP only. Phones get touch steering, but no tilt.';
      this.banner();
      return;
    }
    this.tls = tls;
    const srv = https.createServer({ key: tls.key, cert: tls.cert }, (req, res) => this.dispatch(req, res));
    srv.on('upgrade', (req, socket, head) => this.onUpgrade(req, socket, head));
    srv.on('tlsClientError', () => { /* a phone that has not accepted the cert yet */ });
    this.attached.add(srv);
    this.servers.add(srv);
    const port = envInt('HTTPS_PORT', 3443);
    const host = process.env.HOST || '0.0.0.0';
    await new Promise((resolve) => {
      srv.once('error', (e) => {
        this.tlsNote = `HTTPS port ${port} unavailable (${e.code || e.message}): HTTP only.`;
        console.warn(`[tipsy-kart] ${this.tlsNote}`);
        this.tls = null;
        resolve();
      });
      srv.listen(port, host, () => { this.https = srv; this.httpsPort = srv.address().port; resolve(); });
    });
    this.banner();
  }

  banner() {
    if (process.env.TIPSY_QUIET === '1') return;
    const i = this.info();
    const lines = [''];
    lines.push('  Tipsy Kart phone controllers');
    if (i.secureJoinUrl) {
      lines.push(`  Phones, scan the QR or type:       ${i.secureJoinUrl}`);
      lines.push(`  Phones, no-warning link (no tilt): ${i.httpJoinUrl}`);
      lines.push(`  (the https link shows a one-time browser warning; see the lobby help)`);
    } else {
      lines.push(`  Phones, type (touch steering only): ${i.httpJoinUrl}`);
      if (this.tlsNote) lines.push(`  ${this.tlsNote}`);
    }
    if (i.ips.length > 1) lines.push(`  Other addresses: ${i.ips.slice(1).join(', ')}   (set TIPSY_HOST=<ip> to force one)`);
    if (lan.isWsl()) lines.push(`  ${lan.hints()[0]}`);
    lines.push('');
    console.log(lines.join('\n'));
  }

  // ---------------------------------------------------------------- HTTP routing

  dispatch(req, res) {
    let pathname = '';
    try { pathname = new URL(req.url, 'http://x').pathname; } catch (e) { pathname = ''; }
    if (pathname === '/api/info') return this.serveInfo(req, res);
    if (this.handleHttp(req, res, pathname)) return undefined;
    const ls = this.origListeners;
    if (!ls.length) { res.writeHead(404); return res.end('Not found'); }
    for (const l of ls) l(req, res);
    return undefined;
  }

  /** Merge our fields into whatever /api/info the static server already answers. */
  serveInfo(req, res) {
    const mine = this.info();
    if (!this.origListeners.length) return this.json(res, 200, mine);
    const writeHead = res.writeHead.bind(res);
    const end = res.end.bind(res);
    let status = 200; let headers = {};
    res.writeHead = (s, h) => { status = s; headers = h || {}; return res; };
    res.end = (chunk) => {
      let body;
      try { body = JSON.stringify(Object.assign({}, JSON.parse(String(chunk)), mine)); } catch (e) { body = JSON.stringify(mine); }
      const h = Object.assign({}, headers, { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(body), 'Cache-Control': 'no-store' });
      writeHead(status, h);
      return end(body);
    };
    for (const l of this.origListeners) l(req, res);
    return undefined;
  }

  json(res, status, obj) {
    const body = JSON.stringify(obj);
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(body), 'Cache-Control': 'no-store' });
    res.end(body);
  }

  /** Handles /sse and /msg. Returns true when the request was answered here. */
  handleHttp(req, res, pathname) {
    if (pathname == null) {
      try { pathname = new URL(req.url, 'http://x').pathname; } catch (e) { return false; }
    }
    if (pathname !== '/sse' && pathname !== '/msg') return false;
    let token = '';
    try { token = new URL(req.url, 'http://x').searchParams.get('token') || ''; } catch (e) { /* invalid */ }
    if (!TOKEN_RE.test(token)) { res.writeHead(400); res.end('bad token'); return true; }

    if (pathname === '/sse') {
      if (req.method !== 'GET') { res.writeHead(405); res.end(); return true; }
      const old = this.sse.get(token);
      if (old) {
        // same-token replace: detach first so the host does not see a leave + join for one phone
        const slot = old.meta && old.meta.slot;
        const p = slot >= 0 ? this.players[slot] : null;
        if (p && p.conn === old) { p.conn = null; old.meta.slot = -1; }
        old.terminate();
      }
      const conn = new SseConn(req, res, token);
      this.sse.set(token, conn);
      conn.onClose(() => { if (this.sse.get(token) === conn) this.sse.delete(token); });
      this.addConn(conn);
      return true;
    }

    // POST /msg
    if (req.method !== 'POST') { res.writeHead(405); res.end(); return true; }
    const chunks = []; let size = 0; let tooBig = false;
    req.on('data', (c) => {
      size += c.length;
      if (size > PHONE_MAX_BYTES * 4) { tooBig = true; return; }
      chunks.push(c);
    });
    req.on('end', () => {
      if (tooBig) { res.writeHead(413); res.end(); return; }
      const conn = this.sse.get(token);
      if (!conn || !conn.open) { res.writeHead(409); res.end('no stream'); return; }
      let arr;
      try { arr = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch (e) { conn._bad(); res.writeHead(400); res.end(); return; }
      if (!Array.isArray(arr)) arr = [arr];
      for (const m of arr.slice(0, 32)) {
        if (!conn.open) break;
        conn._rxObj(m, 0);
      }
      res.writeHead(204);
      res.end();
    });
    req.on('error', () => { try { res.destroy(); } catch (e) { /* gone */ } });
    return true;
  }

  onUpgrade(req, socket, head) {
    let pathname = '';
    try { pathname = new URL(req.url, 'http://x').pathname; } catch (e) { /* invalid */ }
    const origin = req.headers.origin;
    let sameOrigin = true;
    if (origin) { // block other web pages from talking to the game (CSWSH)
      try { sameOrigin = new URL(origin).host === req.headers.host; } catch (e) { sameOrigin = false; }
    }
    if (pathname !== '/ws' || !this.wss || !sameOrigin) { socket.destroy(); return; }
    this.wss.handleUpgrade(req, socket, head, (ws) => this.addConn(new WsConn(ws, req)));
  }

  // ---------------------------------------------------------------- connection lifecycle

  addConn(conn) {
    conn.meta = { role: null, slot: -1, lastRx: Date.now(), helloTimer: null, pings: new Map(), queued: false };
    this.conns.add(conn);
    conn.meta.helloTimer = setTimeout(() => { if (!conn.meta.role) conn.close(4001, 'hello timeout'); }, HELLO_MS);
    conn.onMessage((msg, size) => this.onMessage(conn, msg, size));
    conn.onClose(() => this.onClose(conn));
  }

  onMessage(conn, msg, size) {
    conn.meta.lastRx = Date.now();
    const role = conn.meta.role;
    if (!role) { if (msg.t === 'hello') this.onHello(conn, msg); return; }
    if (role === 'host') { this.onHostMessage(conn, msg); return; }
    if (size > PHONE_MAX_BYTES) { conn.close(1009, 'message too big'); return; }
    this.onPhoneMessage(conn, msg);
  }

  onClose(conn) {
    this.conns.delete(conn);
    clearTimeout(conn.meta.helloTimer);
    if (conn.meta.role === 'host') {
      if (this.host === conn) { this.host = null; this.broadcastState({ hostConnected: false }); }
      return;
    }
    if (conn.meta.queued) {
      this.queue = this.queue.filter((q) => q.conn !== conn);
      this.sendQueuePositions();
      return;
    }
    const slot = conn.meta.slot;
    const p = slot >= 0 ? this.players[slot] : null;
    if (p && p.conn === conn) {
      p.conn = null;
      p.connected = false;
      p.disconnectedAt = Date.now();
      p.rtt = 0;
      this.toHost({ t: 'left', slot, reason: 'disconnect', released: false });
      this.rosterDirty();
    }
  }

  // ---------------------------------------------------------------- hello

  onHello(conn, msg) {
    clearTimeout(conn.meta.helloTimer);
    if (msg.role === 'host') return this.onHostHello(conn);
    if (msg.role !== 'phone') { conn.close(4005, 'bad role'); return undefined; }
    const token = typeof msg.token === 'string' ? msg.token : '';
    if (!TOKEN_RE.test(token)) { conn.send({ t: 'error', code: 'bad-token' }, true); conn.close(4005, 'bad token'); return undefined; }
    conn.meta.role = 'phone';
    conn.meta.token = token;
    const c = msg.caps && typeof msg.caps === 'object' ? msg.caps : {};
    const caps = {
      secure: !!c.secure, tilt: !!c.tilt, vibrate: !!c.vibrate, ios: !!c.ios,
      transport: c.transport === 'sse' || c.transport === 'ws' ? c.transport : conn.kind,
    };
    const now = Date.now();

    let p = this.players.find((x) => x && x.token === token);
    if (p) { // resume
      if (p.conn && p.conn !== conn) {
        const old = p.conn;
        p.conn = null; // detach first so its close handler does not report a disconnect
        old.meta.slot = -1;
        old.close(4003, 'replaced');
      }
      p.conn = conn; p.connected = true; p.disconnectedAt = 0;
      if (msg.name) p.name = cleanName(msg.name, p.name);
      p.caps = caps; p.transport = conn.kind; p.lastActive = now; p.toasted = false;
      conn.meta.slot = p.slot;
      this.welcome(p, true);
      return undefined;
    }

    const qi = this.queue.findIndex((q) => q.token === token);
    if (qi >= 0) { const q = this.queue[qi]; this.queue.splice(qi, 1); q.conn.meta.queued = false; q.conn.close(4003, 'replaced'); }

    const free = this.players.findIndex((x) => !x);
    const name = cleanName(msg.name, `Player ${free >= 0 ? free + 1 : this.queue.length + 5}`);
    if (free < 0) {
      conn.meta.queued = true;
      this.queue.push({ conn, token, name, caps });
      conn.send({ t: 'full', queuePos: this.queue.length }, true);
      return undefined;
    }
    this.assign(free, conn, token, name, caps);
    return undefined;
  }

  assign(slot, conn, token, name, caps) {
    const col = COLORS[slot];
    const p = {
      slot, token, name, color: col.color, colorName: col.name, conn, connected: true,
      disconnectedAt: 0, rtt: 0, rttEwma: 0, mode: 'touch', ready: false, caps,
      transport: conn.kind, lastState: {}, pending: {}, lastInput: null, lastItem: 0,
      lastActive: Date.now(), toasted: false,
    };
    this.players[slot] = p;
    conn.meta.slot = slot;
    conn.meta.queued = false;
    this.welcome(p, false);
  }

  welcome(p, resumed) {
    const i = this.info();
    p.conn.send({
      t: 'welcome', v: 1, slot: p.slot, color: p.color, colorName: p.colorName, name: p.name, token: p.token,
      sessionId: this.sessionId, resumed, phase: this.room.phase, httpUrl: i.httpPort != null ? i.httpJoinUrl.replace(/\/controller$/, '') : null,
      secureUrl: i.secureJoinUrl ? i.secureJoinUrl.replace(/\/controller$/, '') : null,
    }, true);
    p.conn.send(this.snapshot(p), true);
    this.toHost({ t: 'joined', slot: p.slot, name: p.name, color: p.color, resumed });
    this.rosterDirty();
  }

  snapshot(p) {
    return Object.assign({ t: 'state' }, this.room, p.lastState, {
      rtt: Math.round(p.rttEwma || 0), hostConnected: !!this.host, ready: !!p.ready,
    });
  }

  promote() {
    this.queue = this.queue.filter((q) => q.conn.open);
    while (this.queue.length) {
      const free = this.players.findIndex((x) => !x);
      if (free < 0) break;
      const q = this.queue.shift();
      this.assign(free, q.conn, q.token, q.name, q.caps);
    }
    this.sendQueuePositions();
  }

  sendQueuePositions() {
    this.queue.forEach((q, i) => q.conn.send({ t: 'full', queuePos: i + 1 }, true));
  }

  release(slot, reason) {
    const p = this.players[slot];
    if (!p) return;
    this.players[slot] = null;
    if (p.conn) { p.conn.meta.slot = -1; }
    this.toHost({ t: 'left', slot, reason, released: true });
    this.rosterDirty();
    this.promote();
  }

  kick(slot, reason) {
    const p = this.players[slot];
    if (!p) return;
    const conn = p.conn;
    if (conn) { conn.send({ t: 'kicked', reason }, true); p.conn = null; conn.meta.slot = -1; }
    this.release(slot, reason === 'host' ? 'kicked' : reason);
    if (conn) conn.close(4002, 'kicked');
  }

  // ---------------------------------------------------------------- phone messages

  onPhoneMessage(conn, msg) {
    if (conn.meta.queued) {
      if (msg.t === 'leave') conn.close(1000, 'left');
      else if (msg.t === 'pong') this.onPong(conn, msg);
      return;
    }
    const p = this.players[conn.meta.slot];
    if (!p || p.conn !== conn) return;
    const now = Date.now();
    switch (msg.t) {
      case 'input': {
        if (!this.host) return;
        const inp = {
          t: 'input', slot: p.slot, seq: num(msg.seq, 0, 4294967295, 0) >>> 0,
          steer: Math.round(num(msg.steer, -1, 1) * 100) / 100,
          throttle: Math.round(num(msg.throttle, 0, 1) * 100) / 100,
          brake: Math.round(num(msg.brake, 0, 1) * 100) / 100,
          drift: msg.drift === true || msg.drift === 1,
          item: num(msg.item, 0, 4294967295, 0) >>> 0,
          mode: msg.mode === 'tilt' ? 'tilt' : 'touch',
        };
        const prev = p.lastInput;
        if (!prev || prev.steer !== inp.steer || prev.throttle !== inp.throttle || prev.brake !== inp.brake
          || prev.drift !== inp.drift || prev.item !== inp.item || prev.mode !== inp.mode) {
          p.lastActive = now; p.toasted = false;
        }
        if (!prev || prev.mode !== inp.mode) { p.mode = inp.mode; this.rosterDirty(); }
        p.lastInput = inp;
        this.host.send(inp, true);
        break;
      }
      case 'pong': this.onPong(conn, msg); break;
      case 'name': {
        const n = cleanName(msg.name, p.name);
        if (n !== p.name) { p.name = n; this.toHost({ t: 'rename', slot: p.slot, name: n }); this.rosterDirty(); }
        this.touch(p, now);
        break;
      }
      case 'ready':
        p.ready = !!msg.ready;
        p.pending.ready = p.ready;
        this.toHost({ t: 'ready', slot: p.slot, ready: p.ready });
        this.rosterDirty();
        this.touch(p, now);
        break;
      case 'drink': {
        const delta = msg.delta === 1 ? 1 : msg.delta === -1 ? -1 : 0;
        if (!delta) break;
        this.touch(p, now);
        const ph = this.room.phase;
        if (ph === 'racing' || ph === 'countdown') break; // lobby / results only
        this.toHost({ t: 'drink', slot: p.slot, delta });
        break;
      }
      case 'leave':
        p.conn = null; conn.meta.slot = -1;
        this.release(p.slot, 'leave');
        conn.close(1000, 'left');
        break;
      default: break; // unknown types are ignored, never fatal
    }
  }

  touch(p, now) { p.lastActive = now; p.toasted = false; }

  onPong(conn, msg) {
    const sent = conn.meta.pings.get(msg.id);
    if (sent == null) return;
    conn.meta.pings.delete(msg.id);
    const p = this.players[conn.meta.slot];
    if (!p || p.conn !== conn) return;
    const rtt = Math.max(0, Date.now() - sent);
    p.rtt = rtt;
    p.rttEwma = p.rttEwma ? 0.8 * p.rttEwma + 0.2 * rtt : rtt;
    p.pending.rtt = Math.round(p.rttEwma);
    this.rosterDirty();
  }

  // ---------------------------------------------------------------- host messages

  isLocal(conn) {
    if (this.cfg.hostAny) return true;
    const a = String(conn.remoteAddress || '').replace(/^::ffff:/, '');
    return this.localAddrs.has(a) || lan.localAddresses().has(a);
  }

  /** Anti DNS-rebinding: the Host header must name this machine, not some outside hostname. */
  hostHeaderOk(conn) {
    if (this.cfg.hostAny || conn.hostHeader == null) return true;
    let h = String(conn.hostHeader).trim().toLowerCase();
    if (h.startsWith('[')) h = h.slice(1, h.indexOf(']'));
    else h = h.replace(/:\d+$/, '');
    return h === 'localhost' || h === '127.0.0.1' || h === '::1' || lan.localAddresses().has(h);
  }

  onHostHello(conn) {
    if (!this.isLocal(conn) || !this.hostHeaderOk(conn)) { conn.send({ t: 'error', code: 'host-not-local' }, true); conn.close(4005, 'host must be local'); return undefined; }
    conn.meta.role = 'host';
    if (this.host && this.host !== conn) {
      const old = this.host;
      this.host = null;
      old.send({ t: 'hostReplaced' }, true);
      old.close(4004, 'replaced');
    }
    this.host = conn;
    this.sendRoster(true);
    this.broadcastState({ hostConnected: true });
    return undefined;
  }

  onHostMessage(conn, msg) {
    if (this.host !== conn) return;
    switch (msg.t) {
      case 'state': this.onHostState(msg); break;
      case 'vibe': {
        const cue = typeof msg.cue === 'string' ? msg.cue.slice(0, 16) : '';
        if (cue) this.toPhones(msg.slot, { t: 'vibe', cue });
        break;
      }
      case 'toast': {
        const text = typeof msg.text === 'string' ? msg.text.slice(0, 80) : '';
        if (text) this.toPhones(msg.slot, { t: 'toast', text, ms: num(msg.ms, 300, 10000, 2500) });
        break;
      }
      case 'kick': if (Number.isInteger(msg.slot)) this.kick(msg.slot, 'host'); break;
      case 'ping': conn.send({ t: 'pong', id: msg.id }, true); break;
      default: break;
    }
  }

  onHostState(msg) {
    if (msg.slot === 'all' || msg.slot === undefined || msg.slot === null) {
      const before = this.room.phase;
      safeMerge(this.room, msg, ['t', 'slot']);
      if (this.room.phase !== before) {
        if (this.room.phase === 'lobby') {
          this.lobbySince = Date.now();
          for (const p of this.players) if (p) { p.lastActive = Date.now(); p.toasted = false; }
        }
        this.rosterDirty();
      }
      for (const p of this.players) if (p && p.conn) safeMerge(p.pending, msg, ['t', 'slot']);
      return;
    }
    const p = Number.isInteger(msg.slot) ? this.players[msg.slot] : null;
    if (!p) return;
    safeMerge(p.lastState, msg, ['t', 'slot']);
    safeMerge(p.pending, msg, ['t', 'slot']);
    if (typeof msg.ready === 'boolean') p.ready = msg.ready;
    this.rosterDirty();
  }

  // ---------------------------------------------------------------- sending

  toHost(obj) { if (this.host) this.host.send(obj, obj.t !== 'roster'); }

  /** slot may be a number or 'all'. */
  toPhones(slot, obj) {
    if (slot === 'all' || slot === undefined) {
      for (const p of this.players) if (p && p.conn) p.conn.send(obj);
    } else if (Number.isInteger(slot) && this.players[slot] && this.players[slot].conn) {
      this.players[slot].conn.send(obj);
    }
  }

  broadcastState(fields) {
    for (const p of this.players) if (p && p.conn) safeMerge(p.pending, fields);
  }

  flushStates() {
    for (const p of this.players) {
      if (!p || !p.conn) { if (p) p.pending = {}; continue; }
      const keys = Object.keys(p.pending);
      if (!keys.length) continue;
      const out = Object.assign({ t: 'state' }, p.pending);
      p.pending = {};
      p.conn.send(out);
    }
  }

  rosterObject() {
    return {
      t: 'roster', sessionId: this.sessionId,
      players: this.players.filter(Boolean).map((p) => ({
        slot: p.slot, name: p.name, color: p.color, colorName: p.colorName, connected: p.connected,
        rtt: Math.round(p.rttEwma || 0), mode: p.mode, ready: p.ready, idle: this.isIdle(p),
        transport: p.transport, caps: p.caps, lastState: Object.keys(p.lastState).length ? p.lastState : null,
      })),
      queue: this.queue.length,
    };
  }

  /** Idle limit right now: the short one only while someone is queued for a slot. */
  idleLimit() { return this.queue.length ? Math.min(this.cfg.idleMs, this.cfg.capMs) : this.cfg.capMs; }

  isIdle(p) {
    return p.connected && this.room.phase === 'lobby' && Date.now() - p.lastActive >= this.idleLimit() * 5 / 6;
  }

  rosterDirty() {
    this.rosterDirtyFlag = true;
    if (!this.host || this.rosterTimer) return;
    const wait = Math.max(0, this.rosterLast + ROSTER_MIN_MS - Date.now());
    this.rosterTimer = setTimeout(() => { this.rosterTimer = null; this.sendRoster(); }, wait);
    if (this.rosterTimer.unref) this.rosterTimer.unref();
  }

  sendRoster(force) {
    if (!this.host || (!this.rosterDirtyFlag && !force)) return;
    this.rosterDirtyFlag = false;
    this.rosterLast = Date.now();
    this.host.send(this.rosterObject(), true);
  }

  // ---------------------------------------------------------------- timers

  startTimers() {
    const add = (fn, ms) => { const t = setInterval(() => { try { fn(); } catch (e) { console.error('[tipsy-kart] hub timer:', e); } }, ms); if (t.unref) t.unref(); this.timers.push(t); };
    add(() => this.flushStates(), STATE_FLUSH_MS);
    add(() => this.pingAll(), PING_MS);
    add(() => this.sweep(), 250);
  }

  pingAll() {
    for (const conn of this.conns) {
      if (conn.meta.role !== 'phone') continue;
      const id = this.pingSeq++;
      conn.meta.pings.set(id, Date.now());
      if (conn.meta.pings.size > 8) conn.meta.pings.delete(conn.meta.pings.keys().next().value);
      conn.send({ t: 'ping', id });
    }
  }

  sweep() {
    const now = Date.now();
    for (const conn of Array.from(this.conns)) {
      if (conn.meta.role === 'phone' && now - conn.meta.lastRx > DEAD_MS) {
        if (conn.terminate) conn.terminate(); else conn.close(4000, 'timeout');
      }
    }
    const lobby = this.room.phase === 'lobby';
    for (const p of this.players.slice()) {
      if (!p) continue;
      if (p.connected) {
        if (!lobby) continue;
        const idle = now - p.lastActive;
        const limit = this.idleLimit();
        if (idle >= limit) this.kick(p.slot, 'idle');
        else if (idle >= limit * 5 / 6 && !p.toasted) {
          p.toasted = true;
          p.conn.send({ t: 'toast', text: 'Still there? Tap anything', ms: 4000 });
          this.rosterDirty();
        }
      } else if (lobby && now - Math.max(p.disconnectedAt, this.lobbySince) > (this.queue.length ? Math.min(this.cfg.reserveMs, this.cfg.capMs) : this.cfg.capMs)) {
        this.release(p.slot, 'expired');
      }
    }
  }

  // ---------------------------------------------------------------- shutdown

  shutdown() {
    if (this.dead) return;
    this.dead = true;
    this.resolveReady();
    for (const t of this.timers) clearInterval(t);
    clearTimeout(this.rosterTimer);
    for (const conn of Array.from(this.conns)) { try { if (conn.terminate) conn.terminate(); else conn.close(1001, 'server closing'); } catch (e) { /* gone */ } }
    if (this.https) { try { this.https.close(); if (this.https.closeAllConnections) this.https.closeAllConnections(); } catch (e) { /* gone */ } }
    try { if (this.wss) this.wss.close(); } catch (e) { /* gone */ }
    singleton = null;
  }
}

let singleton = null;
function getHub() {
  if (!singleton) singleton = new Hub();
  return singleton;
}

module.exports = {
  /** server.js calls this once with the plain HTTP server. */
  attach(httpServer) { const h = getHub(); h.attachServer(httpServer); return h; },
  /** Optional for custom routers: answers /sse and /msg, returns true if it handled the request. */
  handleHttp(req, res) { return getHub().handleHttp(req, res); },
  info() { return singleton ? singleton.info() : null; },
  /** Resolves once the HTTPS twin is listening (or has been given up on). */
  ready() { return singleton ? singleton.ready : Promise.resolve(); },
  /** Stop timers, sockets and the HTTPS twin (server.js start().close() calls this). */
  close() { if (singleton) singleton.shutdown(); },
  getHub,
  COLORS,
};
