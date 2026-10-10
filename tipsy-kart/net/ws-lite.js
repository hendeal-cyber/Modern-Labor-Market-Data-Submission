'use strict';
// Plan B (phone-controls spec, Appendix A): a minimal RFC 6455 server used ONLY when the
// `ws` package cannot be loaded (for example node_modules was never installed).
// It mimics the small part of the `ws` API that net/conn.js and net/hub.js use:
//   new WebSocketServer({noServer, maxPayload}).handleUpgrade(req, socket, head, cb(ws))
//   ws: 'message'(data,isBinary) 'close'(code,reason) 'error', readyState, bufferedAmount,
//       send(text), close(code, reason), terminate()
// Text frames only, no extensions, unmasked server frames, masked client frames required.

const crypto = require('crypto');
const { EventEmitter } = require('events');

const GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

class LiteSocket extends EventEmitter {
  constructor(socket, maxPayload) {
    super();
    this.socket = socket;
    this.maxPayload = maxPayload;
    this.readyState = 1;
    this.buf = Buffer.alloc(0);
    this.frag = null; // { chunks, len }
    this.closeSent = false;
    this.closeEmitted = false;
    socket.setNoDelay(true);
    socket.on('data', (d) => this.onData(d));
    socket.on('error', () => this.finish(1006, ''));
    socket.on('close', () => this.finish(this.peerCode || 1006, this.peerReason || ''));
    socket.on('end', () => { try { socket.end(); } catch (e) { /* gone */ } });
  }

  get bufferedAmount() { return this.socket.writableLength || 0; }

  onData(d) {
    this.buf = this.buf.length ? Buffer.concat([this.buf, d]) : d;
    while (this.readyState === 1 || this.readyState === 2) {
      const b = this.buf;
      if (b.length < 2) return;
      const fin = (b[0] & 0x80) !== 0;
      const op = b[0] & 0x0f;
      const masked = (b[1] & 0x80) !== 0;
      let len = b[1] & 0x7f;
      let off = 2;
      if (len === 126) { if (b.length < 4) return; len = b.readUInt16BE(2); off = 4; }
      else if (len === 127) {
        if (b.length < 10) return;
        const hi = b.readUInt32BE(2); const lo = b.readUInt32BE(6);
        if (hi !== 0 || lo > this.maxPayload) return this.fail(1009);
        len = lo; off = 10;
      }
      if (!masked) return this.fail(1002);
      if (len > this.maxPayload) return this.fail(1009);
      if (b.length < off + 4 + len) return;
      const mask = b.subarray(off, off + 4);
      const payload = Buffer.from(b.subarray(off + 4, off + 4 + len));
      for (let i = 0; i < payload.length; i++) payload[i] ^= mask[i & 3];
      this.buf = b.subarray(off + 4 + len);
      if (!this.frame(fin, op, payload)) return;
    }
  }

  frame(fin, op, payload) {
    if (op >= 0x8) { // control frames
      if (!fin || payload.length > 125) { this.fail(1002); return false; }
      if (op === 0x8) {
        this.peerCode = payload.length >= 2 ? payload.readUInt16BE(0) : 1005;
        this.peerReason = payload.length > 2 ? payload.subarray(2).toString('utf8') : '';
        this.sendClose(this.peerCode === 1005 ? 1000 : this.peerCode);
        this.readyState = 3;
        try { this.socket.end(); } catch (e) { /* gone */ }
        return false;
      }
      if (op === 0x9) this.raw(0xA, payload);
      return true;
    }
    if (op === 0x2) { this.fail(1003); return false; }
    if (op === 0x0) { // continuation
      if (!this.frag) { this.fail(1002); return false; }
      this.frag.chunks.push(payload); this.frag.len += payload.length;
      if (this.frag.len > this.maxPayload) { this.fail(1009); return false; }
      if (fin) { const all = Buffer.concat(this.frag.chunks); this.frag = null; this.emit('message', all, false); }
      return true;
    }
    if (op !== 0x1 || this.frag) { this.fail(1002); return false; }
    if (!fin) { this.frag = { chunks: [payload], len: payload.length }; return true; }
    this.emit('message', payload, false);
    return true;
  }

  raw(op, payload) {
    if (this.socket.destroyed || !this.socket.writable) return;
    const n = payload.length;
    let head;
    if (n < 126) head = Buffer.from([0x80 | op, n]);
    else if (n < 65536) { head = Buffer.alloc(4); head[0] = 0x80 | op; head[1] = 126; head.writeUInt16BE(n, 2); }
    else { head = Buffer.alloc(10); head[0] = 0x80 | op; head[1] = 127; head.writeUInt32BE(0, 2); head.writeUInt32BE(n, 6); }
    this.socket.write(Buffer.concat([head, payload]));
  }

  send(data) {
    if (this.readyState !== 1) return;
    this.raw(0x1, Buffer.from(String(data), 'utf8'));
  }

  sendClose(code, reason) {
    if (this.closeSent) return;
    this.closeSent = true;
    const r = Buffer.from(reason || '', 'utf8');
    const p = Buffer.alloc(2 + r.length);
    p.writeUInt16BE(code, 0); r.copy(p, 2);
    this.raw(0x8, p);
  }

  fail(code) { this.close(code, ''); this.buf = Buffer.alloc(0); return false; }

  close(code = 1000, reason = '') {
    if (this.readyState >= 2) return;
    this.readyState = 2;
    this.sendClose(code, reason);
    const t = setTimeout(() => this.terminate(), 1000);
    if (t.unref) t.unref();
  }

  terminate() {
    this.readyState = 3;
    try { this.socket.destroy(); } catch (e) { /* gone */ }
    this.finish(1006, '');
  }

  finish(code, reason) {
    this.readyState = 3;
    if (this.closeEmitted) return;
    this.closeEmitted = true;
    this.emit('close', code, Buffer.from(reason || ''));
  }
}

class WebSocketServer {
  constructor(opts = {}) { this.maxPayload = opts.maxPayload || 65536; }

  handleUpgrade(req, socket, head, cb) {
    const key = req.headers['sec-websocket-key'];
    const up = String(req.headers.upgrade || '').toLowerCase();
    if (req.method !== 'GET' || up !== 'websocket' || req.headers['sec-websocket-version'] !== '13' || !key) {
      socket.end('HTTP/1.1 400 Bad Request\r\nConnection: close\r\n\r\n');
      return;
    }
    const accept = crypto.createHash('sha1').update(key + GUID).digest('base64');
    socket.write(`HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ${accept}\r\n\r\n`);
    const ws = new LiteSocket(socket, this.maxPayload);
    cb(ws, req);
    if (head && head.length) ws.onData(head);
  }

  close() { /* sockets are owned by the hub */ }
}

module.exports = { WebSocketServer };
