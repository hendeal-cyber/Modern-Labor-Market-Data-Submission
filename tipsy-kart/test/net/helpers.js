'use strict';
// Shared test helpers: boot the real `node server.js` on free ports, and a tiny
// Node-side WebSocket / SSE phone and host client for protocol tests.

const { spawn } = require('child_process');
const net = require('net');
const path = require('path');
const os = require('os');
const fs = require('fs');
const crypto = require('crypto');
const WebSocket = require('ws');

const ROOT = path.join(__dirname, '..', '..');

// The sandbox proxy must never touch loopback / LAN traffic.
process.env.NO_PROXY = '*';
process.env.no_proxy = '*';

function freePort() {
  return new Promise((resolve, reject) => {
    const s = net.createServer();
    s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => resolve(p)); });
    s.on('error', reject);
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitFor(fn, ms = 5000, what = 'condition') {
  const t0 = Date.now();
  for (;;) {
    let v;
    try { v = await fn(); } catch (e) { v = null; }
    if (v) return v;
    if (Date.now() - t0 > ms) throw new Error(`timeout waiting for ${what}`);
    await sleep(25);
  }
}

async function getJson(url) {
  const http = url.startsWith('https') ? require('https') : require('http');
  return new Promise((resolve, reject) => {
    http.get(url, { rejectUnauthorized: false }, (res) => {
      let b = ''; res.on('data', (c) => { b += c; });
      res.on('end', () => { try { resolve(JSON.parse(b)); } catch (e) { reject(e); } });
    }).on('error', reject);
  });
}

/**
 * Start server.js as a child process. env overrides are merged over a quiet loopback-only setup.
 * @returns {{httpPort, httpsPort, url, secureUrl, info, kill()}}
 */
async function startServer(env = {}) {
  const httpPort = await freePort();
  const httpsPort = await freePort();
  const certDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tipsy-cert-'));
  const child = spawn(process.execPath, [path.join(ROOT, 'server.js')], {
    cwd: ROOT,
    env: Object.assign({}, process.env, {
      PORT: String(httpPort), HTTPS_PORT: String(httpsPort), TIPSY_HOST: '127.0.0.1',
      TIPSY_QUIET: '1', TIPSY_CERT_DIR: certDir, NO_PROXY: '*',
    }, env),
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let log = '';
  child.stdout.on('data', (d) => { log += d; });
  child.stderr.on('data', (d) => { log += d; });
  let exited = false;
  child.on('exit', () => { exited = true; });
  const url = `http://127.0.0.1:${httpPort}`;
  const wantHttps = env.TIPSY_HTTPS !== '0';
  const info = await waitFor(async () => {
    if (exited) throw new Error(`server exited early:\n${log}`);
    const i = await getJson(`${url}/api/info`);
    return !wantHttps || i.httpsPort ? i : null;
  }, 15000, 'server /api/info').catch((e) => { child.kill(); throw new Error(`${e.message}\n${log}`); });
  return {
    httpPort, httpsPort: info.httpsPort, url, secureUrl: info.httpsPort ? `https://127.0.0.1:${info.httpsPort}` : null, info,
    log: () => log,
    kill() { return new Promise((resolve) => { if (exited) return resolve(); child.once('exit', () => { try { fs.rmSync(certDir, { recursive: true, force: true }); } catch (e) { /* ignore */ } resolve(); }); child.kill('SIGTERM'); }); },
  };
}

function token() { return crypto.randomBytes(16).toString('base64url'); }

/** Node-side WebSocket client that records every message and the close code. */
class Client {
  constructor(base, opts = {}) {
    this.msgs = [];
    this.closed = null;
    this.autoPong = opts.autoPong !== false;
    this.waiters = [];
    const wsUrl = base.replace(/^http/, 'ws') + '/ws';
    this.ws = new WebSocket(wsUrl, { rejectUnauthorized: false, headers: opts.headers });
    this.opened = new Promise((resolve) => { this.ws.on('open', resolve); this.ws.on('error', () => resolve()); });
    this.ws.on('message', (d) => {
      let m; try { m = JSON.parse(d.toString()); } catch (e) { return; }
      if (m.t === 'ping' && this.autoPong) this.send({ t: 'pong', id: m.id });
      this.msgs.push(m);
      this.waiters = this.waiters.filter((w) => !w.try());
    });
    this.ws.on('close', (code, reason) => { this.closed = { code, reason: reason.toString() }; this.waiters = this.waiters.filter((w) => !w.try()); });
  }

  send(obj) { if (this.ws.readyState === 1) this.ws.send(typeof obj === 'string' ? obj : JSON.stringify(obj)); }
  of(t) { return this.msgs.filter((m) => m.t === t); }
  last(t) { const a = this.of(t); return a[a.length - 1]; }

  /** Resolves with the first (already seen or future) message matching pred. */
  wait(pred, ms = 3000, what = 'message') {
    const p = typeof pred === 'string' ? ((t) => (m) => m.t === t)(pred) : pred;
    return new Promise((resolve, reject) => {
      const w = {
        try: () => { const m = this.msgs.find(p); if (m) { clearTimeout(timer); resolve(m); return true; } if (this.closed) { clearTimeout(timer); reject(new Error(`closed ${JSON.stringify(this.closed)} while waiting for ${what}`)); return true; } return false; },
      };
      const timer = setTimeout(() => { this.waiters = this.waiters.filter((x) => x !== w); reject(new Error(`timeout waiting for ${what}: got ${this.msgs.map((m) => m.t).join(',')}`)); }, ms);
      if (!w.try()) this.waiters.push(w);
    });
  }

  waitClose(ms = 3000) { return waitFor(() => this.closed, ms, 'close'); }
  close() { try { this.ws.close(); } catch (e) { /* ignore */ } }
}

async function phone(base, { tk = token(), name = 'Tester', caps, autoPong = true } = {}) {
  const c = new Client(base, { autoPong });
  c.token = tk;
  await c.opened;
  c.send({ t: 'hello', v: 1, role: 'phone', token: tk, name, caps: caps || { secure: true, tilt: false, vibrate: false, ios: false, transport: 'ws' } });
  return c;
}

async function host(base) {
  const c = new Client(base);
  await c.opened;
  c.send({ t: 'hello', v: 1, role: 'host' });
  await c.wait('roster', 3000, 'roster');
  return c;
}

module.exports = { startServer, Client, phone, host, token, sleep, waitFor, getJson, freePort, ROOT };
