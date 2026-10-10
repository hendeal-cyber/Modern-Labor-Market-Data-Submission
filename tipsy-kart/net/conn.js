'use strict';
// Transport-neutral connection objects (phone-controls spec 1.6).
// The hub only ever sees:
//   { id, kind:'ws'|'sse', open, send(obj, critical), close(code, reason), onMessage(fn), onClose(fn), remoteAddress }
// so a WebSocket library, the hand-rolled fallback and the SSE+POST fallback are interchangeable.

let nextId = 1;
const MAX_BAD = 20;
const BUFFER_LIMIT = 64 * 1024;

class Conn {
  constructor(kind, remoteAddress) {
    this.id = nextId++;
    this.kind = kind;
    this.remoteAddress = remoteAddress || '';
    this.open = true;
    this.bad = 0;
    this.meta = {};
    this._msgFn = null;
    this._closeFn = null;
  }

  onMessage(fn) { this._msgFn = fn; }
  onClose(fn) { this._closeFn = fn; }

  /** Parse one JSON text frame from the transport. */
  _rxText(text) {
    let obj;
    try { obj = JSON.parse(text); } catch (e) { this._bad(); return; }
    this._rxObj(obj, text.length);
  }

  _rxObj(obj, size) {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj) || typeof obj.t !== 'string') { this._bad(); return; }
    if (this._msgFn) this._msgFn(obj, size || 0);
  }

  _bad() { if (++this.bad >= MAX_BAD) this.close(1007, 'too many bad messages'); }

  /** Transport tells us it is gone. */
  _closed(code, reason) {
    if (!this.open) return;
    this.open = false;
    if (this._closeFn) this._closeFn(code, reason);
  }
}

class WsConn extends Conn {
  constructor(ws, req) {
    super('ws', req && req.socket && req.socket.remoteAddress);
    this.ws = ws;
    this.hostHeader = req && req.headers ? req.headers.host : null;
    ws.on('message', (data, isBinary) => {
      if (isBinary === true) { this.close(1003, 'text only'); return; }
      this._rxText(typeof data === 'string' ? data : data.toString('utf8'));
    });
    ws.on('close', (code, reason) => this._closed(code, reason));
    ws.on('error', () => { /* 'close' follows */ });
  }

  send(obj, critical) {
    const ws = this.ws;
    if (!this.open || ws.readyState !== 1) return false;
    if (!critical && ws.bufferedAmount > BUFFER_LIMIT) return false; // drop state/ping for a stalled phone
    try { ws.send(JSON.stringify(obj)); return true; } catch (e) { return false; }
  }

  close(code, reason) {
    if (!this.open) return;
    try { this.ws.close(code || 1000, (reason || '').slice(0, 100)); } catch (e) { try { this.ws.terminate(); } catch (e2) { /* gone */ } }
    // A dead peer never completes the close handshake: force it after 1 s.
    const t = setTimeout(() => { try { this.ws.terminate(); } catch (e) { /* gone */ } }, 1000);
    if (t.unref) t.unref();
  }

  terminate() { try { this.ws.terminate(); } catch (e) { /* gone */ } }
}

/** Server-sent-events downlink; the uplink is POST /msg (see hub.handleHttp). */
class SseConn extends Conn {
  constructor(req, res, token) {
    super('sse', req.socket && req.socket.remoteAddress);
    this.res = res;
    this.token = token;
    try { req.socket.setNoDelay(true); req.socket.setTimeout(0); } catch (e) { /* ignore */ }
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-store',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    res.write(':ok\n\n');
    this.keepalive = setInterval(() => { if (this.open) { try { res.write(':\n\n'); } catch (e) { /* closing */ } } }, 15000);
    if (this.keepalive.unref) this.keepalive.unref();
    const gone = () => { clearInterval(this.keepalive); this._closed(1006, 'sse closed'); };
    req.on('close', gone);
    res.on('close', gone);
    res.on('error', gone);
  }

  send(obj, critical) {
    if (!this.open) return false;
    if (!critical && this.res.writableLength > BUFFER_LIMIT) return false;
    try { this.res.write(`data: ${JSON.stringify(obj)}\n\n`); return true; } catch (e) { return false; }
  }

  close(code, reason) {
    if (!this.open) return;
    // EventSource cannot see a close code, so tell the page explicitly.
    this.send({ t: 'closed', code: code || 1000, reason: reason || '' }, true);
    clearInterval(this.keepalive);
    try { this.res.end(); } catch (e) { /* gone */ }
    this._closed(code || 1000, reason);
  }

  terminate() {
    clearInterval(this.keepalive);
    try { this.res.destroy(); } catch (e) { /* gone */ }
    this._closed(1006, 'terminated');
  }
}

module.exports = { Conn, WsConn, SseConn };
