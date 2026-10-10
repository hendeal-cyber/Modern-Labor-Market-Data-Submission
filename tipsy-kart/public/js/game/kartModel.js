// Original low-poly kart + geometric driver, one merged mesh per kart,
// plus drift sparks, boost flame, bubble shield and a player marker.
import * as THREE from 'three';
import { GeoBuilder, shade, blobTexture } from './geom.js';
import { SPARK_COLORS } from './kart.js';

const sharedMats = {};
function mat(key, make) { return sharedMats[key] || (sharedMats[key] = make()); }

function buildKartGeometry(color, accent) {
  const b = new GeoBuilder();
  const dark = 0x23232b, tyre = 0x1a1a1f, metal = 0xb8bcc8;
  const light = shade(color, 0.35), deep = shade(color, -0.35);
  // chassis tray
  b.add(new THREE.BoxGeometry(1.7, 0.22, 2.7), deep, { y: 0.38 });
  // body tub
  b.add(new THREE.BoxGeometry(1.35, 0.42, 1.7), color, { y: 0.66, z: -0.1 });
  // nose wedge
  b.add(new THREE.CylinderGeometry(0.2, 0.62, 1.1, 4, 1), color, { y: 0.6, z: 1.15, rx: Math.PI / 2, ry: Math.PI / 4, sy: 1, sx: 1.3 });
  // front bumper bar
  b.add(new THREE.BoxGeometry(1.9, 0.18, 0.22), accent, { y: 0.42, z: 1.55 });
  // side pods
  b.add(new THREE.BoxGeometry(0.3, 0.3, 1.2), light, { x: 0.9, y: 0.55, z: -0.05 });
  b.add(new THREE.BoxGeometry(0.3, 0.3, 1.2), light, { x: -0.9, y: 0.55, z: -0.05 });
  // engine block + exhausts
  b.add(new THREE.BoxGeometry(0.9, 0.45, 0.55), dark, { y: 0.72, z: -1.15 });
  b.add(new THREE.CylinderGeometry(0.09, 0.11, 0.5, 6), metal, { x: 0.25, y: 0.75, z: -1.5, rx: Math.PI / 2 });
  b.add(new THREE.CylinderGeometry(0.09, 0.11, 0.5, 6), metal, { x: -0.25, y: 0.75, z: -1.5, rx: Math.PI / 2 });
  // spoiler
  b.add(new THREE.BoxGeometry(0.08, 0.5, 0.12), dark, { x: 0.55, y: 1.05, z: -1.35 });
  b.add(new THREE.BoxGeometry(0.08, 0.5, 0.12), dark, { x: -0.55, y: 1.05, z: -1.35 });
  b.add(new THREE.BoxGeometry(1.8, 0.08, 0.45), accent, { y: 1.33, z: -1.4, rx: -0.12 });
  // seat
  b.add(new THREE.BoxGeometry(0.75, 0.55, 0.18), dark, { y: 1.0, z: -0.62, rx: -0.2 });
  // steering column + wheel
  b.add(new THREE.CylinderGeometry(0.04, 0.04, 0.6, 5), dark, { y: 0.98, z: 0.35, rx: 0.9 });
  b.add(new THREE.TorusGeometry(0.22, 0.05, 4, 8), dark, { y: 1.18, z: 0.15, rx: -0.6 });
  // wheels (fat, low-poly)
  const wheels = [[0.95, 0.42, 0.95, 0.42], [-0.95, 0.42, 0.95, 0.42], [0.98, 0.46, -0.95, 0.5], [-0.98, 0.46, -0.95, 0.5]];
  for (const [x, y, z, r] of wheels) {
    b.add(new THREE.CylinderGeometry(r, r, 0.42, 8), tyre, { x, y, z, rz: Math.PI / 2 });
    b.add(new THREE.CylinderGeometry(r * 0.5, r * 0.5, 0.44, 6), metal, { x, y, z, rz: Math.PI / 2 });
  }
  // driver: geometric torso, arms, faceted helmet with a visor band
  b.add(new THREE.CylinderGeometry(0.28, 0.38, 0.7, 6), 0xf4f1ea, { y: 1.25, z: -0.42 });
  b.add(new THREE.BoxGeometry(0.12, 0.12, 0.55), 0xf4f1ea, { x: 0.3, y: 1.32, z: -0.1, rx: 0.35 });
  b.add(new THREE.BoxGeometry(0.12, 0.12, 0.55), 0xf4f1ea, { x: -0.3, y: 1.32, z: -0.1, rx: 0.35 });
  b.add(new THREE.IcosahedronGeometry(0.36, 0), color, { y: 1.85, z: -0.4 });
  b.add(new THREE.BoxGeometry(0.62, 0.14, 0.3), 0x15151c, { y: 1.88, z: -0.22 });
  b.add(new THREE.ConeGeometry(0.12, 0.3, 4), accent, { y: 2.25, z: -0.45 });
  return b.build();
}

export class KartModel {
  constructor(kart, { isHuman }) {
    this.kart = kart;
    const color = kart.color;
    const accent = isHuman ? 0xffffff : shade(color, 0.6);
    this.root = new THREE.Group();
    this.body = new THREE.Group();
    this.root.add(this.body);
    const kartMat = mat('kart', () => new THREE.MeshLambertMaterial({ vertexColors: true }));
    this.mesh = new THREE.Mesh(buildKartGeometry(color, accent), kartMat);
    this.body.add(this.mesh);

    const shadowMat = mat('shadow', () => new THREE.MeshBasicMaterial({ map: blobTexture(), transparent: true, depthWrite: false, opacity: 1 }));
    this.shadow = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 4.0), shadowMat);
    this.shadow.rotation.x = -Math.PI / 2;
    this.shadow.position.y = 0.06;
    this.root.add(this.shadow);

    // drift sparks: a few additive shards per rear wheel
    this.sparkMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false });
    this.sparks = [];
    const shard = mat('shardGeo', () => new THREE.TetrahedronGeometry(0.22, 0));
    for (const side of [-1, 1]) {
      for (let i = 0; i < 4; i++) {
        const m = new THREE.Mesh(shard, this.sparkMat);
        m.userData = { side, i };
        m.visible = false;
        this.body.add(m);
        this.sparks.push(m);
      }
    }

    const flameMat = mat('flame', () => new THREE.MeshBasicMaterial({ color: 0xffa040, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false }));
    const flameGeo = mat('flameGeo', () => new THREE.ConeGeometry(0.22, 1.2, 6).rotateX(-Math.PI / 2).translate(0, 0, -0.6));
    this.flames = [0.25, -0.25].map((x) => {
      const f = new THREE.Mesh(flameGeo, flameMat);
      f.position.set(x, 0.75, -1.72);
      f.visible = false;
      this.body.add(f);
      return f;
    });

    const shieldMat = mat('shield', () => new THREE.MeshBasicMaterial({ color: 0x7fe9ff, transparent: true, opacity: 0.28, depthWrite: false }));
    this.shield = new THREE.Mesh(mat('shieldGeo', () => new THREE.IcosahedronGeometry(2.0, 1)), shieldMat);
    this.shield.position.y = 1.0;
    this.shield.visible = false;
    this.root.add(this.shield);

    if (isHuman) {
      this.marker = new THREE.Mesh(
        mat('markerGeo', () => new THREE.ConeGeometry(0.45, 0.8, 4).rotateX(Math.PI)),
        new THREE.MeshBasicMaterial({ color }),
      );
      this.marker.position.y = 3.3;
      this.root.add(this.marker);
    }

    this.up = new THREE.Vector3(0, 1, 0);
    this.visYaw = 0;
    this._fwd = new THREE.Vector3();
    this._x = new THREE.Vector3();
    this._m = new THREE.Matrix4();
    this._n = new THREE.Vector3();
  }

  update(dt, time) {
    const k = this.kart, q = k.q;
    // surface normal from track tangent and bank
    const rx = q.rx, rz = q.rz;
    const tx = q.tx, ty = q.ty, tz = q.tz;
    // up' = cross(r, t)
    let ux = 0 * tz - rz * ty, uy = rz * tx - rx * tz, uz = rx * ty - 0 * tx;
    const ul = Math.hypot(ux, uy, uz) || 1; ux /= ul; uy /= ul; uz /= ul;
    const cb = Math.cos(q.bank), sb = Math.sin(q.bank);
    const n = this._n.set(ux * cb - rx * sb, uy * cb, uz * cb - rz * sb);
    if (!this.smoothUp) this.smoothUp = n.clone();
    this.smoothUp.lerp(n, Math.min(1, dt * 10)).normalize();
    const up = this.smoothUp;
    const fwd = this._fwd.set(Math.sin(k.h), 0, Math.cos(k.h));
    fwd.addScaledVector(up, -fwd.dot(up)).normalize();
    const xAxis = this._x.crossVectors(up, fwd).normalize();
    this._m.makeBasis(xAxis, up, fwd);
    this.root.quaternion.setFromRotationMatrix(this._m);
    this.root.position.set(k.x, k.y, k.z);

    // body: drift yaw, spin, lean, bounce
    const targetYaw = k.drifting ? k.driftDir * -0.42 : -k.yawRate * 0.06;
    this.visYaw += (targetYaw - this.visYaw) * Math.min(1, dt * 9);
    this.body.rotation.set(0, this.visYaw + k.spinAngle, 0);
    this.body.rotation.z = (k.drifting ? k.driftDir * 0.06 : k.yawRate * 0.03);
    const bounce = k.landed * 0.12 + (k.speed > 2 ? Math.sin(time * 40 + k.id.length) * 0.015 : 0);
    this.body.position.y = -bounce;
    this.mesh.visible = !(k.invuln > 0 && k.spinTime <= 0 && Math.floor(time * 14) % 2 === 0);

    // sparks
    const tier = k.drifting ? k.driftTier : -1;
    const showSparks = tier >= 0 && k.grounded;
    if (showSparks) this.sparkMat.color.setHex(tier === 0 ? 0xdddddd : SPARK_COLORS[tier - 1]);
    for (const s of this.sparks) {
      s.visible = showSparks && (tier > 0 || s.userData.i < 2);
      if (!s.visible) continue;
      const { side, i } = s.userData;
      const r = Math.random();
      s.position.set(side * (0.95 + r * 0.3), 0.15 + Math.random() * 0.35, -1.25 - i * 0.22 - Math.random() * 0.3);
      const sc = (tier > 0 ? 0.6 + tier * 0.35 : 0.4) * (0.5 + Math.random());
      s.scale.setScalar(sc);
      s.rotation.set(r * 6, time * 20 + i, 0);
    }

    // boost flames
    const boosting = k.boostTime > 0;
    for (const f of this.flames) {
      f.visible = boosting;
      if (boosting) f.scale.set(1, 1, 0.7 + Math.random() * 0.8 + Math.min(1, k.boostTime));
    }

    this.shield.visible = k.shieldTime > 0;
    if (this.shield.visible) {
      this.shield.rotation.y = time * 1.5;
      this.shield.material.opacity = k.shieldTime < 1.5 && Math.floor(time * 10) % 2 ? 0.1 : 0.28;
    }
    if (this.marker) {
      this.marker.position.y = 3.3 + Math.sin(time * 3) * 0.2;
      this.marker.rotation.y = time * 2;
    }
  }

  dispose() {
    this.mesh.geometry.dispose();
    this.sparkMat.dispose();
    this.shadow.geometry.dispose();
    if (this.marker) this.marker.material.dispose();
  }
}
