// Fixed-capacity input latency ring buffer (spec section 5.3).
// Samples are time-stamped by the filter's internal clock. Reading returns the
// newest sample whose timestamp is <= (now - delay), or the oldest one if the
// buffer does not reach that far back yet. Capacity 512 covers 0.5 s at 1 kHz
// and far more at game frame rates.
//
// The delayed stream never runs backwards (a growing delay holds the last
// sample instead of replaying old ones, so a press is never delivered twice),
// and when it jumps forward over several samples (a shrinking delay, a frame
// hitch) the button flags are OR-ed across every skipped sample, so a one-step
// drift/useItem pulse is never dropped.

export class InputRing {
  constructor(capacity = 512) {
    this.cap = capacity;
    this.t = new Float64Array(capacity);
    this.steer = new Float64Array(capacity);
    this.throttle = new Float64Array(capacity);
    this.brake = new Float64Array(capacity);
    this.drift = new Uint8Array(capacity);
    this.useItem = new Uint8Array(capacity);
    this.head = 0;   // index of the next write
    this.count = 0;
    this.lastT = -Infinity; // timestamp of the sample returned by the last read()
    // scratch object returned by read(); callers must not retain it
    this.out = { t: 0, steer: 0, throttle: 0, brake: 0, drift: false, useItem: false };
  }

  clear() { this.head = 0; this.count = 0; this.lastT = -Infinity; }

  get length() { return this.count; }

  push(t, r) {
    const i = this.head;
    this.t[i] = t;
    this.steer[i] = r.steer;
    this.throttle[i] = r.throttle;
    this.brake[i] = r.brake;
    this.drift[i] = r.drift ? 1 : 0;
    this.useItem[i] = r.useItem ? 1 : 0;
    this.head = (i + 1) % this.cap;
    if (this.count < this.cap) this.count++;
  }

  /** Newest sample with t <= target; falls back to the oldest stored sample. */
  read(target) {
    if (this.count === 0) return null;
    if (target < this.lastT) target = this.lastT; // never rewind
    let pick = (this.head - this.count + this.cap) % this.cap; // oldest
    let pickN = this.count;
    for (let n = 1; n <= this.count; n++) {
      const i = (this.head - n + this.cap) % this.cap;
      if (this.t[i] <= target) { pick = i; pickN = n; break; }
    }
    // OR the button flags over every sample consumed since the previous read
    let drift = this.drift[pick] === 1, useItem = this.useItem[pick] === 1;
    for (let n = pickN + 1; n <= this.count; n++) {
      const i = (this.head - n + this.cap) % this.cap;
      if (!(this.t[i] > this.lastT)) break;
      if (this.drift[i]) drift = true;
      if (this.useItem[i]) useItem = true;
    }
    this.lastT = this.t[pick];
    const o = this.out;
    o.t = this.t[pick];
    o.steer = this.steer[pick];
    o.throttle = this.throttle[pick];
    o.brake = this.brake[pick];
    o.drift = drift;
    o.useItem = useItem;
    return o;
  }
}
