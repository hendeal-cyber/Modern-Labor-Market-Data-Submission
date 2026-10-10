// Track data model: samples a closed spline into evenly spaced frames and
// answers "where am I on the track?" queries for physics, laps and AI.
// Pure data, no rendering, so it also runs under Node for quick tests.
import * as THREE from 'three';

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

export class Track {
  constructor(def) {
    this.def = def;
    this.W = def.halfWidth;          // half road width
    this.S = def.shoulder;           // off-road shoulder width each side
    this.edge = this.W + this.S;     // lateral distance of the walls
    const pts = def.points.map(([x, z, y]) => new THREE.Vector3(x, y, z));
    this.curve = new THREE.CatmullRomCurve3(pts, true, 'centripetal');
    this.length = this.curve.getLength();
    const N = (this.N = Math.max(64, Math.round(this.length / 2)));
    this.ds = this.length / N;
    const sp = this.curve.getSpacedPoints(N);
    sp.pop();

    this.Px = new Float32Array(N); this.Py = new Float32Array(N); this.Pz = new Float32Array(N);
    this.Tx = new Float32Array(N); this.Ty = new Float32Array(N); this.Tz = new Float32Array(N);
    this.Rx = new Float32Array(N); this.Rz = new Float32Array(N); // flat right vector
    this.curv = new Float32Array(N);   // signed curvature, >0 = turning right
    this.bank = new Float32Array(N);   // bank angle (rad), >0 raises the right side
    this.line = new Float32Array(N);   // racing line lateral offset
    this.wallL = new Uint8Array(N).fill(1);
    this.wallR = new Uint8Array(N).fill(1);

    for (let i = 0; i < N; i++) {
      this.Px[i] = sp[i].x; this.Py[i] = sp[i].y; this.Pz[i] = sp[i].z;
    }
    for (let i = 0; i < N; i++) {
      const a = (i - 1 + N) % N, b = (i + 1) % N;
      let tx = this.Px[b] - this.Px[a], ty = this.Py[b] - this.Py[a], tz = this.Pz[b] - this.Pz[a];
      const l = Math.hypot(tx, ty, tz) || 1;
      tx /= l; ty /= l; tz /= l;
      this.Tx[i] = tx; this.Ty[i] = ty; this.Tz[i] = tz;
      // right = cross(t, up) with up = (0,1,0) -> (-tz, 0, tx)
      const rl = Math.hypot(tz, tx) || 1;
      this.Rx[i] = -tz / rl; this.Rz[i] = tx / rl;
    }
    // curvature from heading change over a few samples
    const K = 3;
    const raw = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const a = (i - K + N) % N, b = (i + K) % N;
      // dot(t_b - t_a, right_i) / (2K ds)
      const dx = this.Tx[b] - this.Tx[a], dz = this.Tz[b] - this.Tz[a];
      raw[i] = (dx * this.Rx[i] + dz * this.Rz[i]) / (2 * K * this.ds);
    }
    this.curv = smooth(raw, 2);
    const bankK = def.bank ?? 1;
    const bankRaw = new Float32Array(N);
    for (let i = 0; i < N; i++) bankRaw[i] = clamp(-this.curv[i] * 3.2 * bankK, -0.24, 0.24);
    this.bank = smooth(bankRaw, 8);
    const lineRaw = new Float32Array(N);
    for (let i = 0; i < N; i++) lineRaw[i] = clamp(this.curv[i] * 45, -1, 1) * (this.W - 2.6);
    // look slightly ahead so the line moves to the apex before the corner
    const shifted = new Float32Array(N);
    for (let i = 0; i < N; i++) shifted[i] = lineRaw[(i + 4) % N];
    this.line = smooth(shifted, 12);

    for (const nw of def.noWall || []) {
      const i0 = Math.floor(nw.at0 * N), i1 = Math.ceil(nw.at1 * N);
      for (let k = i0; k <= i1; k++) {
        const i = ((k % N) + N) % N;
        if (nw.side !== 'right') this.wallL[i] = 0;
        if (nw.side !== 'left') this.wallR[i] = 0;
      }
    }

    this.boostPads = (def.boostPads || []).map((p) => ({ s: p.at * this.length, d: p.d || 0, len: 5, halfW: 2.2 }));
    this.itemRows = (def.itemRows || []).map((at) => at * this.length);
    this.mud = (def.mud || []).map((m) => ({ s0: m.at0 * this.length, s1: m.at1 * this.length, d0: m.d0, d1: m.d1 }));
  }

  wrapS(s) {
    const L = this.length;
    return ((s % L) + L) % L;
  }

  idxAt(s) {
    return Math.floor(this.wrapS(s) / this.ds) % this.N;
  }

  curvAt(s) { return this.curv[this.idxAt(s)]; }
  lineAt(s) { return this.line[this.idxAt(s)]; }

  /** World-space point on the road surface at distance s and lateral offset d. */
  pointAt(s, d, out = new THREE.Vector3()) {
    s = this.wrapS(s);
    const f = s / this.ds;
    const i = Math.floor(f) % this.N, j = (i + 1) % this.N, u = f - Math.floor(f);
    const cx = this.Px[i] + (this.Px[j] - this.Px[i]) * u;
    const cy = this.Py[i] + (this.Py[j] - this.Py[i]) * u;
    const cz = this.Pz[i] + (this.Pz[j] - this.Pz[i]) * u;
    const rx = this.Rx[i] + (this.Rx[j] - this.Rx[i]) * u;
    const rz = this.Rz[i] + (this.Rz[j] - this.Rz[i]) * u;
    const b = this.bank[i] + (this.bank[j] - this.bank[i]) * u;
    return out.set(cx + rx * d, cy + d * Math.tan(b), cz + rz * d);
  }

  /** Unit tangent at s (3D). */
  tangentAt(s, out = new THREE.Vector3()) {
    const i = this.idxAt(s);
    return out.set(this.Tx[i], this.Ty[i], this.Tz[i]);
  }

  /** Heading angle (forward = (sin h, 0, cos h)) of the track at s. */
  headingAt(s) {
    const i = this.idxAt(s);
    return Math.atan2(this.Tx[i], this.Tz[i]);
  }

  /** Grid slot for kart number n (0 = pole). */
  gridSlot(n) {
    const row = Math.floor(n / 2), col = n % 2;
    return { s: this.length - 7 - row * 6.5 - col * 2.5, d: col === 0 ? -3.6 : 3.6 };
  }

  /**
   * Locate a world position on the track.
   * hint: previous sample index (or -1 for a full search).
   */
  query(x, y, z, hint, out) {
    const N = this.N, Px = this.Px, Py = this.Py, Pz = this.Pz;
    let best = -1, bestD = Infinity, bestU = 0;
    const scan = (from, to) => {
      for (let k = from; k <= to; k++) {
        const j = ((k % N) + N) % N, j2 = (j + 1) % N;
        const ax = Px[j], az = Pz[j];
        const ex = Px[j2] - ax, ez = Pz[j2] - az;
        const len2 = ex * ex + ez * ez || 1;
        let u = ((x - ax) * ex + (z - az) * ez) / len2;
        u = u < 0 ? 0 : u > 1 ? 1 : u;
        const px = ax + ex * u - x, pz = az + ez * u - z;
        const py = Py[j] + (Py[j2] - Py[j]) * u - y;
        const d2 = px * px + pz * pz + py * py * 0.15;
        if (d2 < bestD) { bestD = d2; best = j; bestU = u; }
      }
    };
    if (hint >= 0) scan(hint - 6, hint + 14);
    const lim = this.edge + 14;
    if (hint < 0 || bestD > lim * lim) { bestD = Infinity; scan(0, N - 1); }

    const i = best, j = (best + 1) % N, u = bestU;
    const cx = Px[i] + (Px[j] - Px[i]) * u;
    const cy = Py[i] + (Py[j] - Py[i]) * u;
    const cz = Pz[i] + (Pz[j] - Pz[i]) * u;
    let rx = this.Rx[i] + (this.Rx[j] - this.Rx[i]) * u;
    let rz = this.Rz[i] + (this.Rz[j] - this.Rz[i]) * u;
    const rl = Math.hypot(rx, rz) || 1; rx /= rl; rz /= rl;
    const bank = this.bank[i] + (this.bank[j] - this.bank[i]) * u;
    const d = (x - cx) * rx + (z - cz) * rz;
    const ad = Math.abs(d);
    const s = (i + u) * this.ds;
    const wallHere = d < 0 ? this.wallL[i] && this.wallL[j] : this.wallR[i] && this.wallR[j];

    out.idx = i;
    out.s = s;
    out.d = d;
    out.cx = cx; out.cy = cy; out.cz = cz;
    out.rx = rx; out.rz = rz;
    out.tx = this.Tx[i]; out.ty = this.Ty[i]; out.tz = this.Tz[i];
    out.bank = bank;
    out.groundY = cy + d * Math.tan(bank);
    out.onRoad = ad <= this.W;
    out.wall = !!wallHere;
    out.hasGround = ad <= this.edge + 0.4 || !!wallHere;
    let mud = false;
    if (out.onRoad) {
      for (const m of this.mud) {
        if (s >= m.s0 && s <= m.s1 && d >= m.d0 && d <= m.d1) { mud = true; break; }
      }
    }
    out.offroad = (!out.onRoad && out.hasGround) || mud;
    out.mud = mud;
    return out;
  }
}

function smooth(arr, radius) {
  const N = arr.length;
  const out = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    let sum = 0, wsum = 0;
    for (let k = -radius; k <= radius; k++) {
      const w = radius + 1 - Math.abs(k);
      sum += arr[(i + k + N) % N] * w;
      wsum += w;
    }
    out[i] = sum / wsum;
  }
  return out;
}

export function makeQuery() {
  return {
    idx: 0, s: 0, d: 0, cx: 0, cy: 0, cz: 0, rx: 1, rz: 0, tx: 0, ty: 0, tz: 1, bank: 0,
    groundY: 0, onRoad: true, wall: true, hasGround: true, offroad: false, mud: false,
  };
}
