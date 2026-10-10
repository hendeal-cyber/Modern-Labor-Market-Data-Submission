// Procedural WebAudio: engine hum per human kart plus simple sound effects.
// Everything is synthesised, no audio files.

export class Audio {
  constructor() {
    this.ctx = null;
    this.muted = false;
    try { this.muted = localStorage.getItem('tipsy-muted') === '1'; } catch (e) { /* storage unavailable */ }
    this.engines = new Map();
  }

  /** Must be called from a user gesture (click / key). */
  unlock() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {}); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try {
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.6;
      this.master.connect(this.ctx.destination);
      this.noiseBuf = this.ctx.createBuffer(1, this.ctx.sampleRate, this.ctx.sampleRate);
      const d = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    } catch (e) {
      this.ctx = null;
    }
  }

  setMuted(m) {
    this.muted = m;
    try { localStorage.setItem('tipsy-muted', m ? '1' : '0'); } catch (e) { /* ignore */ }
    if (this.master) this.master.gain.setTargetAtTime(m ? 0 : 0.6, this.ctx.currentTime, 0.05);
  }

  toggleMute() { this.setMuted(!this.muted); return this.muted; }

  tone(freq, dur, { type = 'square', vol = 0.15, slide = 0, delay = 0 } = {}) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime + delay;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(this.master);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  noise(dur, { vol = 0.2, from = 2000, to = 200, q = 1, delay = 0 } = {}) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime + delay;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const f = this.ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.Q.value = q;
    f.frequency.setValueAtTime(from, t);
    f.frequency.exponentialRampToValueAtTime(Math.max(40, to), t + dur);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(f).connect(g).connect(this.master);
    src.start(t);
    src.stop(t + dur + 0.02);
  }

  sfx(name) {
    switch (name) {
      case 'count': this.tone(440, 0.25, { vol: 0.18 }); break;
      case 'go': this.tone(880, 0.6, { vol: 0.2 }); break;
      case 'box': this.tone(660, 0.08, { vol: 0.08 }); this.tone(990, 0.1, { vol: 0.08, delay: 0.07 }); break;
      case 'itemReady': this.tone(1200, 0.1, { type: 'triangle', vol: 0.12 }); break;
      case 'boost': this.noise(0.5, { vol: 0.25, from: 600, to: 3000 }); break;
      case 'pad': this.noise(0.4, { vol: 0.2, from: 800, to: 3500 }); this.tone(500, 0.3, { type: 'sawtooth', vol: 0.05, slide: 600 }); break;
      case 'hop': this.tone(300, 0.08, { type: 'triangle', vol: 0.08, slide: 200 }); break;
      case 'tier1': case 'tier2': case 'tier3': this.tone(name === 'tier1' ? 700 : name === 'tier2' ? 950 : 1250, 0.09, { type: 'triangle', vol: 0.08 }); break;
      case 'bump': this.noise(0.15, { vol: 0.3, from: 400, to: 80, q: 0.7 }); break;
      case 'spin': this.tone(500, 0.6, { type: 'sawtooth', vol: 0.1, slide: -380 }); break;
      case 'shieldPop': this.tone(1500, 0.15, { type: 'sine', vol: 0.15, slide: -900 }); break;
      case 'throw': this.noise(0.2, { vol: 0.15, from: 1500, to: 400 }); break;
      case 'splat': this.noise(0.3, { vol: 0.2, from: 300, to: 100 }); break;
      case 'lap': this.tone(784, 0.12, { vol: 0.12 }); this.tone(1046, 0.18, { vol: 0.12, delay: 0.12 }); break;
      case 'finalLap': [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.14, { vol: 0.12, delay: i * 0.1 })); break;
      case 'finish': [523, 784, 659, 1046, 1318].forEach((f, i) => this.tone(f, 0.22, { type: 'triangle', vol: 0.15, delay: i * 0.13 })); break;
      case 'respawn': this.tone(300, 0.3, { type: 'sine', vol: 0.1, slide: 500 }); break;
      case 'click': this.tone(900, 0.05, { type: 'triangle', vol: 0.08 }); break;
      default: break;
    }
  }

  /** Engine hum per human kart; speeds: Map(id -> {speed, boosting}) */
  updateEngines(karts) {
    if (!this.ctx) return;
    const live = new Set();
    for (const k of karts) {
      live.add(k.id);
      let e = this.engines.get(k.id);
      if (!e) {
        const o1 = this.ctx.createOscillator(), o2 = this.ctx.createOscillator();
        o1.type = 'sawtooth'; o2.type = 'square';
        const f = this.ctx.createBiquadFilter();
        f.type = 'lowpass'; f.frequency.value = 500;
        const g = this.ctx.createGain();
        g.gain.value = 0;
        o1.connect(f); o2.connect(f); f.connect(g).connect(this.master);
        o1.start(); o2.start();
        e = { o1, o2, f, g };
        this.engines.set(k.id, e);
      }
      const t = this.ctx.currentTime;
      const sp = k.speed;
      const base = 48 + sp * 3.2 + (k.boostTime > 0 ? 40 : 0) + (k.slot || 0) * 3;
      e.o1.frequency.setTargetAtTime(base, t, 0.05);
      e.o2.frequency.setTargetAtTime(base * 0.502, t, 0.05);
      e.f.frequency.setTargetAtTime(300 + sp * 25, t, 0.05);
      e.g.gain.setTargetAtTime(0.035 + Math.min(0.03, sp * 0.001), t, 0.1);
    }
    for (const [id, e] of this.engines) {
      if (!live.has(id)) this.stopEngine(id, e);
    }
  }

  stopEngine(id, e) {
    try { e.g.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05); e.o1.stop(this.ctx.currentTime + 0.3); e.o2.stop(this.ctx.currentTime + 0.3); } catch (err) { /* already stopped */ }
    this.engines.delete(id);
  }

  stopAllEngines() {
    for (const [id, e] of this.engines) this.stopEngine(id, e);
  }
}
