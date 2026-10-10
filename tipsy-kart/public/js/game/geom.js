// Small geometry helpers: merge coloured primitives into one vertex-coloured
// BufferGeometry so each low-poly model is a single draw call.
import * as THREE from 'three';

export class GeoBuilder {
  constructor() {
    this.pos = [];
    this.col = [];
    this._m = new THREE.Matrix4();
    this._q = new THREE.Quaternion();
    this._e = new THREE.Euler();
    this._c = new THREE.Color();
  }

  /**
   * Add a geometry (disposed afterwards) with a flat colour.
   * opts: {x,y,z, rx,ry,rz, sx,sy,sz} or a Matrix4 via opts.matrix
   * color may be a function (vertexIndex, x, y, z) -> hex for per-vertex tints.
   */
  add(geo, color, opts = {}) {
    let g = geo.index ? geo.toNonIndexed() : geo;
    if (g !== geo) geo.dispose();
    const m = opts.matrix || this._m.compose(
      new THREE.Vector3(opts.x || 0, opts.y || 0, opts.z || 0),
      this._q.setFromEuler(this._e.set(opts.rx || 0, opts.ry || 0, opts.rz || 0)),
      new THREE.Vector3(opts.sx ?? opts.s ?? 1, opts.sy ?? opts.s ?? 1, opts.sz ?? opts.s ?? 1),
    );
    g.applyMatrix4(m);
    const p = g.attributes.position.array;
    const c = this._c;
    if (typeof color !== 'function') c.set(color);
    for (let i = 0; i < p.length; i += 3) {
      this.pos.push(p[i], p[i + 1], p[i + 2]);
      if (typeof color === 'function') c.set(color(i / 3, p[i], p[i + 1], p[i + 2]));
      this.col.push(c.r, c.g, c.b);
    }
    g.dispose();
    return this;
  }

  /** Raw triangle (world coords) with a colour. */
  tri(ax, ay, az, bx, by, bz, cx, cy, cz, color) {
    this.pos.push(ax, ay, az, bx, by, bz, cx, cy, cz);
    const c = this._c.set(color);
    this.col.push(c.r, c.g, c.b, c.r, c.g, c.b, c.r, c.g, c.b);
  }

  /** Quad a-b-c-d (counter-clockwise when seen from the front). */
  quad(a, b, c, d, color) {
    this.tri(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z, color);
    this.tri(a.x, a.y, a.z, c.x, c.y, c.z, d.x, d.y, d.z, color);
  }

  build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3));
    g.computeVertexNormals();
    g.computeBoundingSphere();
    return g;
  }
}

/** Deterministic PRNG (mulberry32). */
export function rng(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shade(hex, f) {
  const c = new THREE.Color(hex);
  if (f >= 0) c.lerp(new THREE.Color(0xffffff), f);
  else c.lerp(new THREE.Color(0x000000), -f);
  return c.getHex();
}

let blobTex = null;
export function blobTexture() {
  if (blobTex) return blobTex;
  const cv = document.createElement('canvas');
  cv.width = cv.height = 64;
  const g = cv.getContext('2d');
  const gr = g.createRadialGradient(32, 32, 2, 32, 32, 31);
  gr.addColorStop(0, 'rgba(0,0,0,0.55)');
  gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, 64, 64);
  blobTex = new THREE.CanvasTexture(cv);
  return blobTex;
}
