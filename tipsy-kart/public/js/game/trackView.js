// Builds the Three.js scene for a Track: road, curbs, walls, ground, sky,
// boost pads, mud, start gantry, item boxes and procedural themed scenery.
import * as THREE from 'three';
import { GeoBuilder, rng, shade } from './geom.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);

export class TrackView {
  constructor(track) {
    this.track = track;
    this.theme = track.def.theme;
    this.group = new THREE.Group();
    this.disposables = [];
    this.animated = [];
    this.rand = rng(track.def.id.length * 9973 + 17);
    this.minY = this.computeMinY();
    this.buildLights();
    this.buildSky();
    this.buildGround();
    this.buildRoad();
    this.buildWalls();
    this.buildPads();
    this.buildMud();
    this.buildGantry();
    this.buildScenery();
  }

  own(x) { this.disposables.push(x); return x; }

  computeMinY() {
    const t = this.track;
    let m = Infinity;
    for (let i = 0; i < t.N; i++) m = Math.min(m, t.Py[i] - t.edge * Math.abs(Math.tan(t.bank[i])));
    return m - 0.6;
  }

  /** surface point for sample i at lateral offset d, lifted by h along world up */
  sp(i, d, h = 0) {
    const t = this.track, N = t.N;
    i = ((i % N) + N) % N;
    return V(t.Px[i] + t.Rx[i] * d, t.Py[i] + d * Math.tan(t.bank[i]) + h, t.Pz[i] + t.Rz[i] * d);
  }

  buildLights() {
    const th = this.theme;
    const hemi = new THREE.HemisphereLight(th.hemiSky, th.hemiGround, th.night ? 1.4 : 2.0);
    const sun = new THREE.DirectionalLight(th.sun, th.night ? 1.1 : 2.2);
    sun.position.set(120, 200, 80);
    this.group.add(hemi, sun);
  }

  buildSky() {
    const th = this.theme;
    const geo = this.own(new THREE.SphereGeometry(900, 24, 12));
    const top = new THREE.Color(th.sky[0]), hor = new THREE.Color(th.sky[1]);
    const cols = [];
    const p = geo.attributes.position;
    const c = new THREE.Color();
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i) / 900;
      c.copy(hor).lerp(top, Math.min(1, Math.max(0, Math.pow(Math.max(0, y), 0.5) * 2.2)));
      cols.push(c.r, c.g, c.b);
    }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
    const sky = new THREE.Mesh(geo, this.own(new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false })));
    sky.renderOrder = -10;
    sky.frustumCulled = false;
    this.sky = sky;
    this.group.add(sky);
    if (th.night) {
      const r = this.rand, pts = [];
      for (let i = 0; i < 500; i++) {
        const a = r() * Math.PI * 2, e = 0.15 + r() * 1.3;
        pts.push(Math.cos(a) * Math.cos(e) * 800, Math.sin(e) * 800, Math.sin(a) * Math.cos(e) * 800);
      }
      const g = this.own(new THREE.BufferGeometry());
      g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
      const stars = new THREE.Points(g, this.own(new THREE.PointsMaterial({ color: 0xffffff, size: 2.2, sizeAttenuation: false, fog: false })));
      stars.frustumCulled = false;
      this.stars = stars;
      this.group.add(stars);
    }
  }

  buildGround() {
    const th = this.theme;
    const y = this.minY;
    const size = 1600, seg = 48;
    const geo = this.own(new THREE.PlaneGeometry(size, size, seg, seg).rotateX(-Math.PI / 2).toNonIndexed());
    const p = geo.attributes.position;
    const cols = [];
    const a = new THREE.Color(th.ground), b = new THREE.Color(th.groundAlt), c = new THREE.Color();
    const r = this.rand;
    for (let i = 0; i < p.count; i += 3) {
      c.copy(a).lerp(b, r());
      for (let k = 0; k < 3; k++) cols.push(c.r, c.g, c.b);
    }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
    geo.computeVertexNormals();
    let ground;
    if (th.water) {
      // sandy island in a lagoon
      const island = this.own(new THREE.CircleGeometry(330, 40).rotateX(-Math.PI / 2));
      ground = new THREE.Mesh(island, this.own(new THREE.MeshLambertMaterial({ color: th.ground })));
      ground.position.y = y;
      const water = new THREE.Mesh(this.own(new THREE.PlaneGeometry(2400, 2400).rotateX(-Math.PI / 2)),
        this.own(new THREE.MeshLambertMaterial({ color: th.water, emissive: 0x0a4a55 })));
      water.position.y = y - 0.4;
      this.water = water;
      this.group.add(water);
      const surf = new THREE.Mesh(this.own(new THREE.RingGeometry(328, 342, 40).rotateX(-Math.PI / 2)),
        this.own(new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 })));
      surf.position.y = y - 0.3;
      this.group.add(surf);
    } else {
      ground = new THREE.Mesh(geo, this.own(new THREE.MeshLambertMaterial({ vertexColors: true })));
      ground.position.y = y;
    }
    this.group.add(ground);
  }

  buildRoad() {
    const t = this.track, th = this.theme, N = t.N, W = t.W, E = t.edge;
    const b = new GeoBuilder();
    const curbW = 0.9;
    const bands = [
      [-E, -W, () => th.shoulder],
      [-W, -W + curbW, (i) => ((i >> 1) & 1 ? th.curbA : th.curbB)],
      [-W + curbW, W - curbW, (i) => ((i >> 2) & 1 ? th.road : th.roadAlt)],
      [W - curbW, W, (i) => ((i >> 1) & 1 ? th.curbA : th.curbB)],
      [W, E, () => th.shoulder],
    ];
    for (let i = 0; i < N; i++) {
      const j = i + 1;
      for (const [d0, d1, colFn] of bands) {
        let col = colFn(i);
        if (d0 === -W + curbW && i < 2) {
          // checkered start/finish line: split into squares
          const cells = 10;
          for (let c = 0; c < cells; c++) {
            const a0 = d0 + ((d1 - d0) * c) / cells, a1 = d0 + ((d1 - d0) * (c + 1)) / cells;
            col = (c + i) % 2 ? 0x111111 : 0xffffff;
            b.quad(this.sp(i, a0), this.sp(j, a0), this.sp(j, a1), this.sp(i, a1), col);
          }
          continue;
        }
        // shoulder gets a little tint noise
        if (col === th.shoulder) col = shade(col, ((i * 7) % 5) * 0.02 - 0.04);
        b.quad(this.sp(i, d0), this.sp(j, d0), this.sp(j, d1), this.sp(i, d1), col);
      }
      // centre dashes
      if (i % 6 < 3 && i > 3) {
        b.quad(this.sp(i, -0.18, 0.02), this.sp(j, -0.18, 0.02), this.sp(j, 0.18, 0.02), this.sp(i, 0.18, 0.02), th.line);
      }
      // skirt down to the ground on both sides
      for (const sd of [-E, E]) {
        const top0 = this.sp(i, sd), top1 = this.sp(j, sd);
        const bot0 = V(top0.x, this.minY, top0.z), bot1 = V(top1.x, this.minY, top1.z);
        if (sd < 0) b.quad(top0, bot0, bot1, top1, th.skirt);
        else b.quad(top1, bot1, bot0, top0, th.skirt);
      }
    }
    const mesh = new THREE.Mesh(this.own(b.build()), this.own(new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide })));
    this.group.add(mesh);
  }

  buildWalls() {
    const t = this.track, th = this.theme, N = t.N, E = t.edge;
    const b = new GeoBuilder();
    const H = 1.25, T = 0.5;
    for (let i = 0; i < N; i++) {
      const j = i + 1, jj = j % N;
      for (const side of [-1, 1]) {
        const has = side < 0 ? t.wallL[i] && t.wallL[jj] : t.wallR[i] && t.wallR[jj];
        if (!has) continue;
        const col = Math.floor(i / 3) % 2 ? th.wallA : th.wallB;
        const d = side * E, dOut = side * (E + T);
        const a0 = this.sp(i, d), a1 = this.sp(j, d);
        const h0 = this.sp(i, d, H), h1 = this.sp(j, d, H);
        const o0 = this.sp(i, dOut, H), o1 = this.sp(j, dOut, H);
        const g0 = this.sp(i, dOut, -0.6), g1 = this.sp(j, dOut, -0.6);
        b.quad(a0, a1, h1, h0, col);              // inner face
        b.quad(h0, h1, o1, o0, shade(col, 0.15)); // top cap
        b.quad(o0, o1, g1, g0, shade(col, -0.3)); // outer face
      }
    }
    const mesh = new THREE.Mesh(this.own(b.build()), this.own(new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide })));
    this.group.add(mesh);
  }

  buildPads() {
    const t = this.track;
    const cv = document.createElement('canvas');
    cv.width = 64; cv.height = 128;
    const g = cv.getContext('2d');
    g.fillStyle = '#ff7a1a'; g.fillRect(0, 0, 64, 128);
    g.fillStyle = '#ffe14d';
    for (let k = 0; k < 2; k++) {
      const y = k * 64;
      g.beginPath(); g.moveTo(4, y + 52); g.lineTo(32, y + 14); g.lineTo(60, y + 52); g.lineTo(46, y + 52); g.lineTo(32, y + 32); g.lineTo(18, y + 52); g.closePath(); g.fill();
    }
    const tex = this.own(new THREE.CanvasTexture(cv));
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1, 1.5);
    this.padTex = tex;
    const m = this.own(new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.95 }));
    for (const pad of t.boostPads) {
      const geo = new THREE.BufferGeometry();
      const s0 = pad.s - pad.len / 2, s1 = pad.s + pad.len / 2, d0 = pad.d - pad.halfW, d1 = pad.d + pad.halfW;
      const p00 = t.pointAt(s0, d0), p01 = t.pointAt(s0, d1), p10 = t.pointAt(s1, d0), p11 = t.pointAt(s1, d1);
      const lift = 0.05;
      const pos = [p00, p01, p11, p00, p11, p10].flatMap((p) => [p.x, p.y + lift, p.z]);
      const uv = [0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1];
      geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
      const mesh = new THREE.Mesh(this.own(geo), m);
      mesh.material.side = THREE.DoubleSide;
      this.group.add(mesh);
    }
  }

  buildMud() {
    const t = this.track, th = this.theme;
    if (!t.mud.length) return;
    const b = new GeoBuilder();
    const r = this.rand;
    for (const m of t.mud) {
      const steps = Math.max(2, Math.round((m.s1 - m.s0) / 1.5));
      const cells = Math.max(2, Math.round((m.d1 - m.d0) / 1.5));
      for (let a = 0; a < steps; a++) {
        for (let c = 0; c < cells; c++) {
          const s0 = m.s0 + ((m.s1 - m.s0) * a) / steps, s1 = m.s0 + ((m.s1 - m.s0) * (a + 1)) / steps;
          const d0 = m.d0 + ((m.d1 - m.d0) * c) / cells, d1 = m.d0 + ((m.d1 - m.d0) * (c + 1)) / cells;
          const lift = 0.04;
          const P = (s, d) => { const p = t.pointAt(s, d); p.y += lift; return p; };
          b.quad(P(s0, d0), P(s1, d0), P(s1, d1), P(s0, d1), shade(th.mud, (r() - 0.5) * 0.35));
        }
      }
    }
    this.group.add(new THREE.Mesh(this.own(b.build()), this.own(new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }))));
  }

  buildGantry() {
    const t = this.track, th = this.theme, E = t.edge;
    const b = new GeoBuilder();
    const L = this.sp(0, -E - 1), R = this.sp(0, E + 1);
    const hdg = t.headingAt(0);
    const top = Math.max(L.y, R.y) + 7;
    for (const p of [L, R]) {
      const h = top - p.y + 1;
      b.add(new THREE.BoxGeometry(0.8, h, 0.8), 0x2b2b35, { x: p.x, y: p.y + h / 2 - 0.5, z: p.z });
    }
    const mid = L.clone().add(R).multiplyScalar(0.5);
    const span = L.distanceTo(R);
    b.add(new THREE.BoxGeometry(span, 1.6, 0.6), 0x2b2b35, { x: mid.x, y: top, z: mid.z, ry: hdg });
    this.group.add(new THREE.Mesh(this.own(b.build()), this.own(new THREE.MeshLambertMaterial({ vertexColors: true }))));
    // banner with the game name
    const cv = document.createElement('canvas');
    cv.width = 512; cv.height = 64;
    const g = cv.getContext('2d');
    g.fillStyle = '#' + new THREE.Color(th.curbA).getHexString();
    g.fillRect(0, 0, 512, 64);
    g.fillStyle = '#fff';
    const label = 'TIPSY KART  ★  ' + t.def.name.toUpperCase();
    let fs = 44;
    g.font = `bold ${fs}px sans-serif`;
    while (fs > 16 && g.measureText(label).width > 480) { fs -= 2; g.font = `bold ${fs}px sans-serif`; }
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(label, 256, 34);
    const tex = this.own(new THREE.CanvasTexture(cv));
    const banner = new THREE.Mesh(this.own(new THREE.PlaneGeometry(span * 0.92, 1.4)), this.own(new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide })));
    banner.position.set(mid.x, top, mid.z);
    // face oncoming karts: plane normal along -forward
    banner.rotation.y = hdg + Math.PI;
    banner.position.x -= Math.sin(hdg) * 0.32;
    banner.position.z -= Math.cos(hdg) * 0.32;
    this.group.add(banner);
  }

  /** true if (x,z) is at least `clear` units away from the road edge */
  clearOfTrack(x, z, clear) {
    const q = this._q || (this._q = {});
    this.track.query(x, this.minY + 2, z, -1, q);
    return Math.abs(q.d) > this.track.edge + clear;
  }

  scatter(count, minR, maxR, clear, fn) {
    const t = this.track, r = this.rand;
    let placed = 0, tries = 0;
    while (placed < count && tries < count * 20) {
      tries++;
      const i = Math.floor(r() * t.N);
      const side = r() < 0.5 ? -1 : 1;
      const dist = t.edge + minR + r() * (maxR - minR);
      const x = t.Px[i] + t.Rx[i] * dist * side + (r() - 0.5) * 6;
      const z = t.Pz[i] + t.Rz[i] * dist * side + (r() - 0.5) * 6;
      if (!this.clearOfTrack(x, z, clear)) continue;
      fn(x, z, r, placed);
      placed++;
    }
  }

  instanced(geo, transforms, colors) {
    const mesh = new THREE.InstancedMesh(this.own(geo), this.own(new THREE.MeshLambertMaterial({ vertexColors: true })), transforms.length);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new THREE.Vector3(), p = new THREE.Vector3();
    transforms.forEach((tf, i) => {
      m.compose(p.set(tf.x, tf.y, tf.z), q.setFromEuler(e.set(tf.rx || 0, tf.ry || 0, tf.rz || 0)), s.set(tf.sx ?? tf.s ?? 1, tf.sy ?? tf.s ?? 1, tf.sz ?? tf.s ?? 1));
      mesh.setMatrixAt(i, m);
      if (colors) mesh.setColorAt(i, new THREE.Color(colors[i]));
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
    this.group.add(mesh);
    return mesh;
  }

  buildScenery() {
    const kind = this.theme.scenery;
    if (kind === 'farm') this.sceneryFarm();
    else if (kind === 'city') this.sceneryCity();
    else if (kind === 'snow') this.scenerySnow();
    else if (kind === 'beach') this.sceneryBeach();
    this.sceneryFar(kind);
  }

  sceneryFar(kind) {
    // ring of big low-poly hills/mountains/towers on the horizon
    const r = this.rand, tf = [], cols = [];
    const n = 26;
    const pal = { farm: [0x5f9e3c, 0x4f8a32], city: [0x1d1838, 0x2a2350], snow: [0xc9d8ea, 0xb4c6dc], beach: [0x3e9e5a, 0x55b36a] }[kind];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + r() * 0.2;
      const R = 480 + r() * 120;
      const h = kind === 'city' ? 60 + r() * 120 : 40 + r() * 90;
      tf.push({ x: Math.cos(a) * R, y: this.minY, z: Math.sin(a) * R, sx: 50 + r() * 60, sy: h, sz: 50 + r() * 60, ry: r() * 6 });
      cols.push(pal[i % 2]);
    }
    let geo;
    if (kind === 'city') geo = new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0);
    else {
      const b = new GeoBuilder();
      b.add(new THREE.ConeGeometry(1, 1, 7).translate(0, 0.5, 0), (vi, x, y) => (kind === 'snow' || kind === 'farm') && y > 0.62 ? (kind === 'snow' ? 0xffffff : 0x6aab45) : 0xffffff);
      geo = b.build();
    }
    if (!geo.attributes.color) {
      const cnt = geo.attributes.position.count;
      geo.setAttribute('color', new THREE.Float32BufferAttribute(new Array(cnt * 3).fill(1), 3));
    }
    const mesh = this.instanced(geo, tf, cols);
    mesh.material.fog = true;
  }

  sceneryFarm() {
    const r0 = this.rand;
    // trees
    const tree = new GeoBuilder()
      .add(new THREE.CylinderGeometry(0.35, 0.5, 2.4, 5), 0x7a5232, { y: 1.2 })
      .add(new THREE.IcosahedronGeometry(2.0, 0), 0xffffff, { y: 3.8 })
      .build();
    const tf = [], cols = [];
    this.scatter(170, 4, 110, 3, (x, z, r) => {
      tf.push({ x, y: this.minY, z, s: 0.8 + r() * 0.9, ry: r() * 6 });
      cols.push([0x4f9a35, 0x3f8a2a, 0x6db63f, 0x88c24a][Math.floor(r() * 4)]);
    });
    this.instanced(tree, tf, cols);
    // hay bales
    const bale = new GeoBuilder().add(new THREE.CylinderGeometry(1, 1, 1.6, 8), 0xe8c55a, { y: 1, rz: Math.PI / 2 }).build();
    const bt = [];
    this.scatter(40, 1.5, 25, 1.5, (x, z, r) => bt.push({ x, y: this.minY, z, ry: r() * 6, s: 0.9 + r() * 0.3 }));
    this.instanced(bale, bt);
    // barns
    const barn = new GeoBuilder()
      .add(new THREE.BoxGeometry(10, 6, 14), 0xc8392b, { y: 3 })
      .add(new THREE.CylinderGeometry(0.01, 6.6, 3.6, 4, 1), 0x5b3a26, { y: 7.8, ry: Math.PI / 4, sx: 1.07, sz: 1.5 })
      .add(new THREE.BoxGeometry(4, 4.4, 0.2), 0xffffff, { y: 2.2, z: 7.05 })
      .build();
    const brn = [];
    this.scatter(6, 25, 70, 12, (x, z, r) => brn.push({ x, y: this.minY, z, ry: r() * 6 }));
    this.instanced(barn, brn);
    // clouds
    const cloud = new GeoBuilder().add(new THREE.IcosahedronGeometry(1, 0), 0xffffff).add(new THREE.IcosahedronGeometry(0.7, 0), 0xffffff, { x: 0.9, y: -0.1 }).build();
    const ct = [];
    for (let i = 0; i < 18; i++) ct.push({ x: (r0() - 0.5) * 700, y: 70 + r0() * 50, z: (r0() - 0.5) * 700, sx: 14 + r0() * 10, sy: 5, sz: 9 });
    const cm = this.instanced(cloud, ct);
    cm.material.emissive = new THREE.Color(0x888888);
  }

  sceneryCity() {
    const r0 = this.rand;
    // buildings with lit window bands
    const bgeo = new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0);
    const tf = [], cols = [];
    this.scatter(150, 6, 120, 6, (x, z, r) => {
      const h = 12 + r() * 45;
      tf.push({ x, y: this.minY, z, sx: 8 + r() * 10, sy: h, sz: 8 + r() * 10, ry: Math.round(r() * 4) * (Math.PI / 2) + (r() - 0.5) * 0.3 });
      cols.push([0x2a2550, 0x352d66, 0x1f2a4a, 0x3a2140][Math.floor(r() * 4)]);
    });
    const cnt = bgeo.attributes.position.count;
    bgeo.setAttribute('color', new THREE.Float32BufferAttribute(new Array(cnt * 3).fill(1), 3));
    const bm = this.instanced(bgeo, tf, cols);
    bm.material.emissive = new THREE.Color(0x0c0820);
    // window strips: emissive thin boxes stuck to the buildings
    const win = new THREE.BoxGeometry(1.02, 0.08, 1.02);
    const wt = [], wc = [];
    tf.forEach((b) => {
      const floors = Math.floor(b.sy / 4);
      const col = [0xffd36b, 0x7ff3ff, 0xff7ad9, 0xfff2b0][Math.floor(r0() * 4)];
      for (let f = 1; f < floors; f++) {
        if (r0() < 0.35) continue;
        wt.push({ x: b.x, y: b.y + f * 4, z: b.z, sx: b.sx, sy: 6, sz: b.sz, ry: b.ry });
        wc.push(col);
      }
    });
    const wm = new THREE.InstancedMesh(this.own(win), this.own(new THREE.MeshBasicMaterial({ color: 0xffffff })), wt.length);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new THREE.Vector3(), p = new THREE.Vector3();
    wt.forEach((t, i) => {
      wm.setMatrixAt(i, m.compose(p.set(t.x, t.y, t.z), q.setFromEuler(e.set(0, t.ry, 0)), s.set(t.sx, 0.8, t.sz)));
      wm.setColorAt(i, new THREE.Color(wc[i]));
    });
    wm.computeBoundingSphere();
    this.group.add(wm);
    // street lamps with glowing heads
    const lamp = new GeoBuilder().add(new THREE.CylinderGeometry(0.15, 0.2, 6, 5), 0x555566, { y: 3 }).add(new THREE.BoxGeometry(1.6, 0.2, 0.3), 0x555566, { y: 6, x: 0.7 }).build();
    const lt = [], heads = [];
    const t = this.track;
    for (let i = 0; i < t.N; i += 14) {
      for (const side of [-1, 1]) {
        const d = side * (t.edge + 1.6);
        const pnt = this.sp(i, d);
        const ry = t.headingAt(i * t.ds) + (side > 0 ? Math.PI / 2 : -Math.PI / 2) + Math.PI;
        lt.push({ x: pnt.x, y: pnt.y - 0.5, z: pnt.z, ry });
        const hp = this.sp(i, side * (t.edge + 0.3), 5.4);
        heads.push({ x: hp.x, y: hp.y, z: hp.z });
      }
    }
    this.instanced(lamp, lt);
    const hm = new THREE.InstancedMesh(this.own(new THREE.SphereGeometry(0.35, 6, 4)), this.own(new THREE.MeshBasicMaterial({ color: 0xfff1b0 })), heads.length);
    heads.forEach((h, i) => hm.setMatrixAt(i, m.compose(p.set(h.x, h.y, h.z), q.identity(), s.set(1, 1, 1))));
    hm.computeBoundingSphere();
    this.group.add(hm);
    // neon signs
    const words = ['LAST CALL', 'OPEN 24/7', 'HICCUP CLUB', 'FIZZ', 'NIGHTCAP', 'TAXI?'];
    const colors = ['#ff3cc8', '#3cf0ff', '#ffe14d', '#7dff6a'];
    let n = 0;
    this.scatter(12, 3, 10, 2.5, (x, z, r) => {
      const cv = document.createElement('canvas');
      cv.width = 256; cv.height = 96;
      const g = cv.getContext('2d');
      g.fillStyle = '#120a22'; g.fillRect(0, 0, 256, 96);
      const col = colors[n % colors.length];
      g.strokeStyle = col; g.lineWidth = 6; g.strokeRect(6, 6, 244, 84);
      g.fillStyle = col; g.font = 'bold 40px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(words[n % words.length], 128, 50);
      const tex = this.own(new THREE.CanvasTexture(cv));
      const sign = new THREE.Group();
      sign.add(new THREE.Mesh(this.own(new THREE.PlaneGeometry(10, 3.75)), this.own(new THREE.MeshBasicMaterial({ map: tex }))));
      const back = new THREE.Mesh(this.own(new THREE.PlaneGeometry(10, 3.75)), this.own(new THREE.MeshBasicMaterial({ color: 0x120a22 })));
      back.rotation.y = Math.PI;
      sign.add(back);
      const q2 = {};
      this.track.query(x, 0, z, -1, q2);
      // face the road, angled toward oncoming traffic
      const sg = q2.d >= 0 ? -1 : 1;
      sign.position.set(x, this.minY + 6 + r() * 4, z);
      sign.rotation.y = Math.atan2(q2.rx * sg - q2.tx * 0.8, q2.rz * sg - q2.tz * 0.8); // toward the road and oncoming karts
      this.group.add(sign);
      n++;
    });
  }

  scenerySnow() {
    const pine = new GeoBuilder()
      .add(new THREE.CylinderGeometry(0.3, 0.4, 1.6, 5), 0x6b4a32, { y: 0.8 })
      .add(new THREE.ConeGeometry(2.2, 3.2, 7), (vi, x, y) => (y > 3.6 ? 0xffffff : 0x2f6b4a), { y: 2.9 })
      .add(new THREE.ConeGeometry(1.6, 2.6, 7), (vi, x, y) => (y > 5.4 ? 0xffffff : 0x357a54), { y: 4.6 })
      .add(new THREE.ConeGeometry(1.0, 2.0, 7), (vi, x, y) => (y > 6.6 ? 0xffffff : 0x3c8a5e), { y: 6.1 })
      .build();
    const tf = [];
    this.scatter(200, 3, 110, 2.5, (x, z, r) => tf.push({ x, y: this.minY + this.groundAt(x, z), z, s: 0.8 + r() * 0.9, ry: r() * 6 }));
    this.instanced(pine, tf);
    const rock = new GeoBuilder().add(new THREE.DodecahedronGeometry(1.5, 0), 0x8a94a6).build();
    const rt = [];
    this.scatter(50, 2, 60, 2, (x, z, r) => rt.push({ x, y: this.minY + 0.4, z, sx: 1 + r() * 1.5, sy: 0.6 + r(), sz: 1 + r(), ry: r() * 6 }));
    this.instanced(rock, rt);
    // snow drifts the cars pass under: snowmen
    const snowman = new GeoBuilder()
      .add(new THREE.IcosahedronGeometry(1.2, 1), 0xffffff, { y: 1.1 })
      .add(new THREE.IcosahedronGeometry(0.85, 1), 0xffffff, { y: 2.8 })
      .add(new THREE.IcosahedronGeometry(0.6, 1), 0xffffff, { y: 4.0 })
      .add(new THREE.ConeGeometry(0.12, 0.6, 5), 0xff8a2a, { y: 4.0, z: 0.75, rx: Math.PI / 2 })
      .add(new THREE.CylinderGeometry(0.5, 0.5, 0.6, 8), 0x22252e, { y: 4.7 })
      .build();
    const sm = [];
    this.scatter(10, 2, 12, 2, (x, z, r) => sm.push({ x, y: this.minY, z, ry: r() * 6 }));
    this.instanced(snowman, sm);
    // falling snow particles
    const pts = [];
    const r0 = this.rand;
    for (let i = 0; i < 1200; i++) pts.push((r0() - 0.5) * 500, r0() * 80, (r0() - 0.5) * 500);
    const g = this.own(new THREE.BufferGeometry());
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    const snow = new THREE.Points(g, this.own(new THREE.PointsMaterial({ color: 0xffffff, size: 0.6 })));
    snow.frustumCulled = false;
    this.snow = snow;
    this.group.add(snow);
  }

  groundAt() { return 0; }

  sceneryBeach() {
    const palm = new GeoBuilder();
    for (let k = 0; k < 5; k++) {
      palm.add(new THREE.CylinderGeometry(0.28 - k * 0.03, 0.34 - k * 0.03, 1.6, 6), k % 2 ? 0x9c7448 : 0x87613a, { x: k * k * 0.06, y: 0.8 + k * 1.5, rz: -k * 0.06 });
    }
    for (let l = 0; l < 6; l++) {
      const a = (l / 6) * Math.PI * 2;
      palm.add(new THREE.ConeGeometry(0.55, 4, 4), 0x2fa84f, { x: 1.5 + Math.cos(a) * 1.7, y: 7.6, z: Math.sin(a) * 1.7, rz: Math.PI / 2 + Math.cos(a) * 1.2, rx: Math.sin(a) * 1.2, sz: 0.25 });
    }
    palm.add(new THREE.IcosahedronGeometry(0.45, 0), 0x6b4a22, { x: 1.5, y: 7.2 });
    const pg = palm.build();
    const tf = [];
    this.scatter(120, 3, 90, 2.5, (x, z, r) => tf.push({ x, y: this.minY, z, s: 0.8 + r() * 0.6, ry: r() * 6 }));
    this.instanced(pg, tf);
    const umb = new GeoBuilder()
      .add(new THREE.CylinderGeometry(0.08, 0.08, 3, 5), 0xeeeeee, { y: 1.5 })
      .add(new THREE.ConeGeometry(2.2, 0.9, 8), (vi) => (Math.floor(vi / 3) % 2 ? 0xff5a5a : 0xffffff), { y: 3.1 })
      .build();
    const ut = [];
    this.scatter(30, 2, 25, 2, (x, z, r) => ut.push({ x, y: this.minY, z, ry: r() * 6 }));
    this.instanced(umb, ut);
    const rock = new GeoBuilder().add(new THREE.DodecahedronGeometry(1.5, 0), 0xa58f6a).build();
    const rt = [];
    this.scatter(40, 2, 60, 2, (x, z, r) => rt.push({ x, y: this.minY + 0.3, z, sx: 1 + r() * 1.5, sy: 0.6 + r(), sz: 1 + r(), ry: r() * 6 }));
    this.instanced(rock, rt);
  }

  update(dt, time) {
    if (this.padTex) this.padTex.offset.y = (this.padTex.offset.y - dt * 2.2) % 1;
    if (this.snow) {
      const p = this.snow.geometry.attributes.position;
      for (let i = 0; i < p.count; i++) {
        let y = p.getY(i) - dt * 6;
        if (y < this.minY) y += 80;
        p.setY(i, y);
      }
      p.needsUpdate = true;
    }
    if (this.water) this.water.position.y = this.minY - 0.4 + Math.sin(time * 0.8) * 0.12;
  }

  /** keep sky + stars centred on the active camera */
  follow(camera) {
    this.sky.position.copy(camera.position);
    if (this.stars) this.stars.position.copy(camera.position);
  }

  dispose() {
    for (const d of this.disposables) d.dispose?.();
    this.group.traverse((o) => {
      if (o.isInstancedMesh) o.dispose();
    });
  }
}
