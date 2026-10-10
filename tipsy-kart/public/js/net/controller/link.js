// Phone <-> server link with the transport fallback chain (phone-controls spec 1.5, 1.6, 4.3):
//   1. wss/ws:   WebSocket on /ws
//   2. SSE+POST: EventSource on /sse for the downlink, fetch POST /msg for the uplink
//   3. caller shows "Secure link didn't work, use the basic link" (event 'secureFailed')
// Reconnects forever with 250/500/1000/2000 ms backoff and always reuses the same token.

import { ssGet, ssSet } from './store.js';

const BACKOFF = [250, 500, 1000, 2000];
const CONNECT_TIMEOUT_MS = 4000; // no welcome/full by then: count it as a failed attempt
const WATCHDOG_MS = 5000;        // the server pings every 2 s; 5 s of silence means the link is dead
const HIDDEN_FORCE_MS = 2000;    // back from > 2 s in the background: assume the socket is stale

export class Link {
  /**
   * @param {{token:string, hello:()=>object}} opts
   */
  constructor({ token, hello }) {
    this.token = token;
    this.hello = hello;
    this.handlers = {};
    this.transport = ssGet('tipsyKart.transport') === 'sse' ? 'sse' : (typeof WebSocket === 'function' ? 'ws' : 'sse');
    this.status = 'connecting'; // connecting | online | reconnecting | closed
    this.terminal = null;       // kicked | replaced | left | fatal
    this.welcomed = false;      // welcomed on the CURRENT connection
    this.everWelcomed = false;
    this.preFailures = 0;
    this.sseFailures = 0;
    this.attempt = 0;
    this.timer = null;
    this.ws = null;
    this.es = null;
    this.queue = [];
    this.pendingInput = null;
    this.inFlight = false;
    this.gen = 0; // bumped for every connection attempt so late events from old ones are ignored
    this.reachable = false; // got welcome OR full on the current connection
    this.lastRx = 0;
    this.connTimer = null;
    this.hiddenAt = 0;
  }

  on(evt, fn) { this.handlers[evt] = fn; return this; }
  emit(evt, a) { if (this.handlers[evt]) { try { this.handlers[evt](a); } catch (e) { console.error(e); } } }

  setStatus(s) { if (s !== this.status) { this.status = s; this.emit('status', s); } }

  start() {
    this.terminal = null;
    this.open();
    const wake = () => { if (document.visibilityState !== 'hidden') this.reconnectNow(); };
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') { this.hiddenAt = performance.now(); return; }
      const away = this.hiddenAt ? performance.now() - this.hiddenAt : 0;
      this.hiddenAt = 0;
      // after a real trip to the background the socket may look OPEN but be dead (iOS especially)
      if (away > HIDDEN_FORCE_MS && !this.terminal) { this.attempt = 0; this.open(); } else wake();
    });
    window.addEventListener('online', wake);
    window.addEventListener('pageshow', wake);
    // phone-side watchdog, for both transports
    this.watchdog = setInterval(() => {
      if (this.terminal || this.status !== 'online' || !this.lastRx) return;
      if (performance.now() - this.lastRx > WATCHDOG_MS) this.down(this.gen, 4000, 'watchdog');
    }, 1000);
  }

  /** After kicked/left: try again as a newcomer with the same token. */
  rejoin() {
    this.terminal = null;
    this.attempt = 0; this.preFailures = 0;
    this.setStatus('connecting');
    this.open();
  }

  open() {
    clearTimeout(this.timer);
    this.teardown();
    if (this.terminal) return;
    this.gen++;
    this.welcomed = false; this.reachable = false;
    this.queue = []; this.pendingInput = null; this.inFlight = false;
    const gen = this.gen;
    clearTimeout(this.connTimer);
    this.connTimer = setTimeout(() => { if (gen === this.gen && !this.reachable) this.down(gen, 1006, 'timeout'); }, CONNECT_TIMEOUT_MS);
    if (this.transport === 'ws') this.openWs(gen); else this.openSse(gen);
  }

  teardown() {
    const ws = this.ws; const es = this.es;
    this.ws = null; this.es = null;
    if (ws) { ws.onopen = ws.onmessage = ws.onclose = ws.onerror = null; try { ws.close(); } catch (e) { /* ignore */ } }
    if (es) { es.onopen = es.onmessage = es.onerror = null; try { es.close(); } catch (e) { /* ignore */ } }
  }

  /** visibilitychange/online/pageshow: skip the backoff wait, but never kill an attempt in flight. */
  reconnectNow() {
    if (this.terminal || this.status === 'online') return;
    if (this.ws && this.ws.readyState <= 1) return;
    if (this.es && this.es.readyState <= 1) return;
    this.open();
  }

  // ---------------------------------------------------------------- websocket

  openWs(gen) {
    const url = `${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}/ws`;
    let ws;
    try { ws = new WebSocket(url); } catch (e) { this.down(gen, 1006, ''); return; }
    this.ws = ws;
    ws.onopen = () => { if (gen === this.gen) ws.send(JSON.stringify(this.hello())); };
    ws.onmessage = (ev) => { if (gen === this.gen) this.onText(ev.data); };
    ws.onclose = (ev) => this.down(gen, ev.code, ev.reason);
    ws.onerror = () => { /* onclose follows */ };
  }

  // ---------------------------------------------------------------- sse + post

  openSse(gen) {
    let es;
    try { es = new EventSource(`/sse?token=${encodeURIComponent(this.token)}`); } catch (e) { this.down(gen, 1006, ''); return; }
    this.es = es;
    es.onopen = () => { if (gen === this.gen) { this.queue.push(this.hello()); this.pump(); } };
    es.onmessage = (ev) => { if (gen === this.gen) this.onText(ev.data); };
    es.onerror = () => {
      if (gen !== this.gen) return;
      if (this.sseClosedCode != null) return; // the server said why; down() already ran or will
      this.down(gen, 1006, '');
    };
  }

  pump() {
    if (this.inFlight || this.transport !== 'sse' || !this.es) return;
    const batch = this.queue.splice(0, 8);
    if (this.pendingInput) { batch.push(this.pendingInput); this.pendingInput = null; }
    if (!batch.length) return;
    this.inFlight = true;
    const gen = this.gen;
    fetch(`/msg?token=${encodeURIComponent(this.token)}`, { method: 'POST', body: JSON.stringify(batch), headers: { 'Content-Type': 'text/plain' }, cache: 'no-store' })
      .then((r) => {
        if (gen !== this.gen) return;
        this.inFlight = false;
        if (r.status === 409) { this.down(gen, 1006, 'no stream'); return; }
        this.pump();
      })
      .catch(() => { if (gen === this.gen) { this.inFlight = false; this.down(gen, 1006, 'post failed'); } });
  }

  // ---------------------------------------------------------------- common

  onText(text) {
    this.lastRx = performance.now();
    let m;
    try { m = JSON.parse(text); } catch (e) { return; }
    if (!m || typeof m.t !== 'string') return;
    switch (m.t) {
      case 'welcome':
        this.welcomed = true; this.reachable = true; clearTimeout(this.connTimer); this.everWelcomed = true; this.attempt = 0; this.preFailures = 0; this.sseFailures = 0;
        this.setStatus('online');
        this.emit('welcome', m);
        return;
      case 'full': // the server answered: the transport works, so this never counts as a failure
        this.reachable = true; clearTimeout(this.connTimer); this.attempt = 0; this.preFailures = 0;
        this.setStatus('online'); this.emit('full', m); return;
      case 'ping': this.send({ t: 'pong', id: m.id }); return;
      case 'kicked': this.terminal = 'kicked'; this.emit('kicked', m); return;
      case 'closed': // SSE equivalent of a close code
        this.sseClosedCode = m.code;
        this.down(this.gen, m.code, m.reason);
        return;
      default: this.emit(m.t, m);
    }
  }

  /** The current connection ended (or never came up). */
  down(gen, code, reason) {
    if (gen !== this.gen) return;
    this.gen++; // ignore everything else from this attempt
    this.teardown();
    this.sseClosedCode = null;
    clearTimeout(this.connTimer);
    const wasWelcomed = this.welcomed || this.reachable;
    this.welcomed = false; this.reachable = false; this.lastRx = 0;
    if (this.terminal) { this.setStatus('closed'); return; }
    if (code === 4003) { this.terminal = 'replaced'; this.setStatus('closed'); this.emit('replaced'); return; }
    if (code === 4002) { this.terminal = 'kicked'; this.setStatus('closed'); this.emit('kicked', { reason: 'host' }); return; }
    if (code === 4005) { this.terminal = 'fatal'; this.setStatus('closed'); this.emit('fatal', { reason }); return; }
    if (code === 1000 && reason === 'left') { this.terminal = 'left'; this.setStatus('closed'); this.emit('left'); return; }

    this.setStatus(this.everWelcomed || wasWelcomed ? 'reconnecting' : 'connecting');
    let delay = BACKOFF[Math.min(this.attempt, BACKOFF.length - 1)];
    this.attempt++;
    if (!wasWelcomed) {
      if (this.transport === 'ws') {
        this.preFailures++;
        if (this.preFailures >= 2) { // wss refused twice: SSE rides the already-trusted page origin
          this.transport = 'sse'; this.preFailures = 0; this.attempt = 0; delay = 0;
          ssSet('tipsyKart.transport', 'sse');
          this.emit('transport', 'sse');
        }
      } else {
        this.sseFailures++;
        if (this.sseFailures === 3) this.emit('secureFailed');
      }
    }
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.open(), delay);
  }

  /** Reliable message (everything except input). */
  send(obj) {
    if (this.transport === 'ws') {
      if (this.ws && this.ws.readyState === 1) { try { this.ws.send(JSON.stringify(obj)); } catch (e) { /* closing */ } }
    } else if (this.es) {
      this.queue.push(obj); this.pump();
    }
  }

  /** Input is latest-wins: over SSE only the newest pending input is kept, one POST in flight at a time. */
  sendInput(obj) {
    if (!this.welcomed) return false;
    if (this.transport === 'ws') {
      if (this.ws && this.ws.readyState === 1) { try { this.ws.send(JSON.stringify(obj)); return true; } catch (e) { return false; } }
      return false;
    }
    this.pendingInput = obj; this.pump();
    return true;
  }
}
