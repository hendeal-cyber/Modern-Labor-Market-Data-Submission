// Renders item boxes, sticky-spill puddles and cork-bomb projectiles.
import * as THREE from 'three';
import { GeoBuilder } from './geom.js';

const MAX_HAZ = 16, MAX_PROJ = 16;

export class ItemsView {
  constructor(race) {
    this.race = race;
    this.group = new THREE.Group();
    this.disposables = [];
    const n = race.boxes.length;
    // party crate: translucent cube shell + spinning rainbow gem inside
    this.shell = new THREE.InstancedMesh(
      this.own(new THREE.BoxGeometry(1.7, 1.7, 1.7)),
      this.own(new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.38, emissive: 0x332244, depthWrite: false })),
      n,
    );
    const gemB = new GeoBuilder().add(new THREE.OctahedronGeometry(0.62, 0), (vi) => [0xff4f7a, 0xffc93c, 0x4fe0a0, 0x4fb8ff, 0xb46bff, 0xff8a3c][Math.floor(vi / 3) % 6]);
    this.gem = new THREE.InstancedMesh(this.own(gemB.build()), this.own(new THREE.MeshBasicMaterial({ vertexColors: true })), n);
    this.shell.frustumCulled = false;
    this.gem.frustumCulled = false;
    this.group.add(this.shell, this.gem);

    const puddle = new GeoBuilder()
      .add(new THREE.CircleGeometry(1.9, 9).rotateX(-Math.PI / 2), 0x9be15d)
      .add(new THREE.CircleGeometry(1.1, 7).rotateX(-Math.PI / 2), 0xd8f56a, { y: 0.02, x: 0.3 })
      .add(new THREE.CircleGeometry(0.6, 6).rotateX(-Math.PI / 2), 0x9be15d, { y: 0.01, x: 1.8, z: 0.8 })
      .build();
    this.puddles = new THREE.InstancedMesh(this.own(puddle), this.own(new THREE.MeshLambertMaterial({ vertexColors: true, emissive: 0x1a3a00 })), MAX_HAZ);
    this.puddles.frustumCulled = false;
    this.puddles.count = 0;
    this.group.add(this.puddles);

    const cork = new GeoBuilder()
      .add(new THREE.CylinderGeometry(0.45, 0.55, 0.9, 8), 0xd9a066)
      .add(new THREE.CylinderGeometry(0.57, 0.57, 0.22, 8), 0xe8463a, { y: -0.1 })
      .build();
    this.corks = new THREE.InstancedMesh(this.own(cork), this.own(new THREE.MeshLambertMaterial({ vertexColors: true })), MAX_PROJ);
    this.corks.frustumCulled = false;
    this.corks.count = 0;
    this.group.add(this.corks);

    this._m = new THREE.Matrix4();
    this._q = new THREE.Quaternion();
    this._e = new THREE.Euler();
    this._s = new THREE.Vector3();
    this._p = new THREE.Vector3();
  }

  own(x) { this.disposables.push(x); return x; }

  update(dt, time) {
    const { _m: m, _q: q, _e: e, _s: s, _p: p } = this;
    this.race.boxes.forEach((b, i) => {
      let sc = 1;
      if (b.respawn > 0) sc = b.respawn < 0.4 ? 1 - b.respawn / 0.4 : 0;
      const y = b.y + Math.sin(time * 2.5 + i) * 0.18;
      m.compose(p.set(b.x, y, b.z), q.setFromEuler(e.set(time * 0.7 + i, time * 1.1 + i, 0.3)), s.setScalar(sc));
      this.shell.setMatrixAt(i, m);
      m.compose(p.set(b.x, y, b.z), q.setFromEuler(e.set(0, -time * 2.4, 0)), s.setScalar(sc));
      this.gem.setMatrixAt(i, m);
    });
    this.shell.instanceMatrix.needsUpdate = true;
    this.gem.instanceMatrix.needsUpdate = true;

    const hz = this.race.hazards;
    const nh = Math.min(hz.length, MAX_HAZ);
    for (let i = 0; i < nh; i++) {
      const h = hz[i];
      const grow = Math.min(1, h.age * 4) * (h.life < 1 ? h.life : 1);
      m.compose(p.set(h.x, h.y + 0.06, h.z), q.setFromEuler(e.set(0, i * 1.7, 0)), s.set(grow, 1, grow));
      this.puddles.setMatrixAt(i, m);
    }
    this.puddles.count = nh;
    this.puddles.instanceMatrix.needsUpdate = true;

    const pr = this.race.projectiles;
    const np = Math.min(pr.length, MAX_PROJ);
    for (let i = 0; i < np; i++) {
      const c = pr[i];
      m.compose(p.set(c.x, c.y, c.z), q.setFromEuler(e.set(c.age * 9, Math.atan2(c.vx, c.vz), 0)), s.setScalar(1.2));
      this.corks.setMatrixAt(i, m);
    }
    this.corks.count = np;
    this.corks.instanceMatrix.needsUpdate = true;
  }

  dispose() {
    for (const d of this.disposables) d.dispose?.();
    this.shell.dispose(); this.gem.dispose(); this.puddles.dispose(); this.corks.dispose();
  }
}
