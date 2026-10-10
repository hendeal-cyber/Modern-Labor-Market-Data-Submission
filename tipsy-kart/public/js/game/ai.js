// CPU driver: follows the racing line with a personal offset, drifts through
// long corners, uses items with simple heuristics. Produces the same input
// shape as a human controller. Also used as an autopilot for finished humans.

import * as THREE from 'three';

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

export class AIDriver {
  constructor(kart, seed = Math.random() * 1000) {
    this.kart = kart;
    this.seed = seed;
    this.input = { steer: 0, throttle: 0, brake: 0, drift: false, useItem: false };
    this.driftHold = 0;
    this.itemDelay = 1 + (seed % 3);
    this.laneBias = ((seed * 7.31) % 1) * 2 - 1;   // -1..1 personal line offset
    this.wobble = 0;
  }

  /** race: { track, karts, hazards, time } */
  update(dt, race) {
    const k = this.kart, track = race.track, q = k.q, inp = this.input;
    const spd = k.speed;
    const W = track.W;

    const look = 7 + spd * 0.42;
    const sT = q.s + look;
    this.wobble += dt * (0.25 + (this.seed % 0.2));
    let lat = track.lineAt(sT) * (0.75 + 0.25 * k.skill) + this.laneBias * 2.2 + Math.sin(this.wobble + this.seed) * 1.2;

    // dodge hazards near the target
    for (const hz of race.hazards) {
      if (hz.type !== 'slick') continue;
      const dsz = track.wrapS(hz.s - q.s);
      if (dsz > 2 && dsz < look + 10 && Math.abs(hz.d - lat) < 3.2) lat += hz.d > lat ? -4 : 4;
    }
    lat = clamp(lat, -W + 2, W - 2);

    const tgt = track.pointAt(sT, lat, this._tmp || (this._tmp = new THREE.Vector3()));
    const dx = tgt.x - k.x, dz = tgt.z - k.z;
    const fx = Math.sin(k.h), fz = Math.cos(k.h);
    const rx = -fz, rz = fx;
    const ang = Math.atan2(dx * rx + dz * rz, dx * fx + dz * fz);   // >0 = target is to the right
    let steer = clamp(ang * 2.6, -1, 1);

    // upcoming corner strength
    let kMax = 0;
    for (let a = 8; a <= 40; a += 8) {
      const c = track.curvAt(q.s + a);
      if (Math.abs(c) > Math.abs(kMax)) kMax = c;
    }

    let throttle = 1, brake = 0;
    if (Math.abs(ang) > 0.75 && spd > 16) { throttle = 0.2; brake = 0.4; }
    else if (Math.abs(ang) > 0.45 && spd > 24) throttle = 0.55;

    // drifting
    let drift = false;
    if (k.drifting) {
      const sameWay = Math.sign(kMax) === k.driftDir && Math.abs(kMax) > 0.012;
      const wantTier = k.skill > 0.95 ? 2 : 1;
      this.driftHold += dt;
      drift = this.driftHold < 4 && (sameWay || k.driftTier < wantTier) && ang * k.driftDir > -0.35;
      if (!sameWay && k.driftTier >= 1) drift = false;
    } else {
      if (this.driftHold > 0) this.driftCooldown = 1.2;
      this.driftHold = 0;
      this.driftCooldown = Math.max(0, (this.driftCooldown || 0) - dt);
      if (this.driftCooldown <= 0 && Math.abs(kMax) > 0.022 && spd > 20 && Math.sign(steer) === Math.sign(kMax) && Math.abs(steer) > 0.35) {
        drift = true;
      }
    }

    // reversing out of a wall
    if (k.stuckTime > 0.8) { throttle = 0; brake = 1; steer = -steer; drift = false; }

    // items
    let useItem = false;
    if (k.item && k.itemRoll <= 0) {
      this.itemDelay -= dt;
      if (this.itemDelay <= 0) useItem = this.shouldUseItem(race, ang);
    } else {
      this.itemDelay = 0.8 + ((this.seed * 13.7 + race.time) % 2.5);
    }

    inp.steer = steer;
    inp.throttle = throttle;
    inp.brake = brake;
    inp.drift = drift;
    inp.useItem = useItem;
    return inp;
  }

  shouldUseItem(race, ang) {
    const k = this.kart;
    switch (k.item) {
      case 'fizz':
        return Math.abs(ang) < 0.25;
      case 'bubble':
        return true;
      case 'slick': {
        // drop it when someone is close behind
        for (const o of race.karts) {
          if (o === k) continue;
          const gap = k.progress - o.progress;
          if (gap > 2 && gap < 25) return true;
        }
        return this.itemDelay < -6;
      }
      case 'bouncer': {
        for (const o of race.karts) {
          if (o === k) continue;
          const gap = o.progress - k.progress;
          if (gap > 4 && gap < 45 && Math.abs(o.q.d - k.q.d) < 6) return true;
        }
        return this.itemDelay < -8 || (k.place === 1 && this.itemDelay < -2);
      }
      default:
        return true;
    }
  }
}
