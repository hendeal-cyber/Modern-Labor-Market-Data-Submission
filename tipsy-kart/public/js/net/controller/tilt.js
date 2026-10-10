// Tilt steering (phone-controls spec 3.3).
// deviceorientation (beta, gamma) -> gravity "up" vector in device coordinates -> roll angle
// against the screen's horizontal axis. Works for a wheel grip, a tray grip and anything between,
// with no gimbal singularity. Pure functions are exported separately so Node can unit-test them.

const D = Math.PI / 180;

/** Roll in degrees. Positive = right side of the screen lowered = steer right. */
export function steerDegFromOrientation(beta, gamma, screenAngle) {
  const b = beta * D; const g = gamma * D;
  // world "up" in device coordinates (derived from the spec's Z-X'-Y'' rotation)
  const up = [-Math.cos(b) * Math.sin(g), Math.sin(b), Math.cos(b) * Math.cos(g)];
  // screen-right axis in device coordinates for the current screen rotation
  const a = ((screenAngle % 360) + 360) % 360;
  const right = a === 90 ? [0, -1, 0] : a === 270 ? [0, 1, 0] : a === 180 ? [-1, 0, 0] : [1, 0, 0];
  const d = up[0] * right[0] + up[1] * right[1] + up[2] * right[2];
  return -Math.asin(Math.max(-1, Math.min(1, d))) / D;
}

export function currentScreenAngle() {
  try {
    if (screen.orientation && typeof screen.orientation.angle === 'number') return screen.orientation.angle;
  } catch (e) { /* ignore */ }
  return typeof window.orientation === 'number' ? window.orientation : 0;
}

/** Deadzone + power curve. relDeg is the angle relative to the calibrated neutral. */
export function curve(relDeg, { maxDeg = 28, deadDeg = 3, exponent = 1.5, invert = false } = {}) {
  let rel = invert ? -relDeg : relDeg;
  const mag = Math.max(0, Math.abs(rel) - deadDeg) / Math.max(1, maxDeg - deadDeg);
  const s = Math.sign(rel) * Math.min(1, mag) ** exponent;
  return Math.round(s * 100) / 100 + 0; // + 0 turns -0 into 0
}

/** Floating horizontal thumbstick curve (spec 3.4). */
export function stickCurve(dx, radius, deadFrac = 0.08, exponent = 1.3) {
  const n = Math.max(-1, Math.min(1, dx / radius));
  const m = Math.max(0, Math.abs(n) - deadFrac) / (1 - deadFrac);
  return Math.round(Math.sign(n) * m ** exponent * 100) / 100 + 0;
}

/** Normalise an angle to 0/90/180/270. */
export function normAngle(a) { return ((Math.round(a / 90) * 90) % 360 + 360) % 360; }

/**
 * The landscape frame to steer in. iPhones cannot lock orientation, so a hard roll can rotate the
 * page to portrait (0/180) mid-corner: keep using the last landscape angle (90/270) in that case.
 */
export function landscapeAngle(screenAngle, lastLandscape = 90) {
  const a = normAngle(screenAngle);
  return a === 90 || a === 270 ? a : lastLandscape;
}

export class Tilt {
  /**
   * @param {object} settings {maxDeg, invert}, read live
   * @param {{angle?:()=>number}} [opts] angle source (tests); defaults to the screen orientation
   */
  constructor(settings, opts = {}) {
    this.settings = settings;
    this.angleFn = opts.angle || currentScreenAngle;
    this.landscape = landscapeAngle(this.angleFn(), 90);
    this.filtered = 0;
    this.neutral = 0;
    this.has = false;
    this.last = 0;
    this.running = false;
    this.listening = false;
    this.raw = 0;
    this._h = (e) => this.onEvent(e);
  }

  /** Start receiving events (no waiting). Safe to call early where no permission prompt exists. */
  listen() {
    if (this.listening || typeof window === 'undefined') return;
    this.listening = true;
    window.addEventListener('deviceorientation', this._h);
  }

  /** Starts listening. Resolves true if a real (non-null beta) event arrives within 1 s. */
  start() {
    if (this.running) return Promise.resolve(this.has);
    this.running = true;
    this.listen();
    return new Promise((resolve) => {
      const t0 = performance.now();
      const poll = () => {
        if (this.has) return resolve(true);
        if (performance.now() - t0 > 1000) return resolve(false);
        return setTimeout(poll, 30);
      };
      poll();
    });
  }

  stop() {
    this.running = false; this.listening = false;
    if (typeof window !== 'undefined') window.removeEventListener('deviceorientation', this._h);
  }

  onEvent(e) {
    if (e.beta == null || e.gamma == null) return;
    const a = landscapeAngle(this.angleFn(), this.landscape);
    if (a !== this.landscape) {
      // a real 90 <-> 270 flip: the screen's right axis reversed, so mirror the neutral (and the
      // filter state) instead of recalibrating mid-race
      this.landscape = a;
      this.neutral = -this.neutral;
      this.filtered = -this.filtered;
    }
    this.raw = steerDegFromOrientation(e.beta, e.gamma, this.landscape);
    if (!this.has) { this.filtered = this.raw; this.last = performance.now(); this.has = true; }
  }

  /** Advance the 40 ms low-pass to "now". Time-based, so irregular or sparse events still converge. */
  tick() {
    const now = performance.now();
    const dt = Math.min(1, Math.max(0, (now - this.last) / 1000));
    this.last = now;
    this.filtered += (this.raw - this.filtered) * (1 - Math.exp(-dt / 0.04));
    return this.filtered;
  }

  /**
   * Wait `delayMs` (the tap itself jolts the phone), then average the filtered angle for `ms` and make it
   * the neutral. Memory only: grip changes per session.
   */
  calibrate(ms = 600, delayMs = 300) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const samples = [];
        const iv = setInterval(() => { if (this.has) samples.push(this.tick()); }, 20);
        setTimeout(() => {
          clearInterval(iv);
          if (samples.length) this.neutral = samples.reduce((x, y) => x + y, 0) / samples.length;
          resolve(this.neutral);
        }, ms);
      }, delayMs);
    });
  }

  /** Current steer in -1..1. */
  steer() {
    if (!this.has) return 0;
    return curve(this.tick() - this.neutral, this.settings);
  }
}
