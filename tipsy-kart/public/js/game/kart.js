// Arcade kart physics. Pure simulation (no rendering) so it can run in Node.
//
// Heading convention: forward = (sin h, 0, cos h), right = (-cos h, 0, sin h).
// Increasing h turns left, so steering right decreases h.
import { makeQuery } from './track.js';

export const STATS = {
  maxSpeed: 33,       // units/s on tarmac
  accel: 21,
  brake: 40,
  reverseMax: 9,
  coastDecel: 5,
  turnRate: 2.25,     // rad/s at mid speed
  driftTurn: 1.9,
  grip: 10,
  driftGrip: 4.2,
  offroadGrip: 6,
  radius: 1.25,
  gravity: 32,
  boostMult: 1.33,
  boostPush: 48,
  offroadMult: 0.52,
};

export const DRIFT_TIERS = [0.95, 2.0, 3.2];       // charge needed for tier 1..3
export const DRIFT_BOOST = [0.65, 1.1, 1.65];      // boost seconds on release
export const SPARK_COLORS = [0x5ce1ff, 0xffa526, 0xff4fd8];

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const NEUTRAL = Object.freeze({ steer: 0, throttle: 0, brake: 0, drift: false, useItem: false });

export class Kart {
  constructor({ id, name, color, isHuman = false, slot = null, skill = 1 }) {
    this.id = id;
    this.name = name;
    this.color = color;
    this.isHuman = isHuman;
    this.slot = slot;
    this.skill = skill;
    this.q = makeQuery();
    this.q.idx = -1;
    this.x = 0; this.y = 0; this.z = 0;
    this.vx = 0; this.vy = 0; this.vz = 0;
    this.h = 0;
    this.speedMult = 1;
    this.reset();
  }

  reset() {
    this.vx = this.vy = this.vz = 0;
    this.vF = 0; this.vR = 0;
    this.grounded = true;
    this.steerSm = 0;
    this.yawRate = 0;
    this.drifting = false;
    this.driftDir = 0;
    this.driftCharge = 0;
    this.driftTier = 0;
    this.boostTime = 0;
    this.kick = 0;
    this.spinTime = 0;
    this.spinAngle = 0;
    this.shieldTime = 0;
    this.invuln = 0;
    this.frozen = 0;
    this.stuckTime = 0;
    this.wrongTime = 0;
    this.wrongWay = false;
    this.wallHit = 0;
    this.landed = 0;
    this.item = null;
    this.itemRoll = 0;
    this.lastItemPressed = false;
    this.lastSafeS = 0;
    this.lastSafeD = 0;
    this.progress = 0;
    this.lastS = 0;
    this.lapsDone = 0;
    this.lapTimes = [];
    this.lapStart = 0;
    this.finished = false;
    this.finishTime = 0;
    this.place = 1;
    this.events = [];   // transient events for audio/fx: 'boost','bump','spin','pad','item','lap'
  }

  get speed() { return Math.hypot(this.vx, this.vz); }
  get boosting() { return this.boostTime > 0; }

  placeAt(track, s, d) {
    const p = track.pointAt(s, d);
    this.x = p.x; this.y = p.y; this.z = p.z;
    this.h = track.headingAt(s);
    this.vx = this.vy = this.vz = 0;
    this.q.idx = -1;
    track.query(this.x, this.y, this.z, -1, this.q);
    this.lastS = this.q.s;
    this.lastSafeS = this.q.s;
    this.lastSafeD = d;
  }

  boost(seconds, kick = 6) {
    this.boostTime = Math.max(this.boostTime, seconds);
    this.kick = Math.max(this.kick, kick);
    this.events.push('boost');
  }

  /** Returns true if the hit landed (false if a shield or invulnerability blocked it). */
  spinOut(seconds) {
    if (this.invuln > 0 || this.spinTime > 0) return false;
    if (this.shieldTime > 0) {
      this.shieldTime = 0;
      this.invuln = 0.6;
      this.events.push('shieldPop');
      return false;
    }
    this.spinTime = seconds;
    this.drifting = false;
    this.driftCharge = 0;
    this.driftTier = 0;
    this.boostTime = 0;
    this.vx *= 0.35; this.vz *= 0.35;
    this.events.push('spin');
    return true;
  }

  respawn(track) {
    const s = this.lastSafeS - 4;
    const d = clamp(this.lastSafeD, -track.W * 0.5, track.W * 0.5);
    const p = track.pointAt(s, d);
    this.x = p.x; this.y = p.y + 2.5; this.z = p.z;
    this.h = track.headingAt(s);
    this.vx = this.vy = this.vz = 0;
    this.vF = this.vR = 0;
    this.grounded = false;
    this.drifting = false;
    this.driftCharge = 0;
    this.driftTier = 0;
    this.spinTime = 0;
    this.frozen = 0.5;
    this.invuln = 2.0;
    this.stuckTime = 0;
    this.q.idx = track.idxAt(s);
    track.query(this.x, this.y, this.z, this.q.idx, this.q);
    this.events.push('respawn');
  }

  /** Advance the simulation by dt seconds with the given (already filtered) input. */
  step(dt, input, track, controlsEnabled = true) {
    const st = STATS;
    const inp = controlsEnabled ? input || NEUTRAL : NEUTRAL;
    let steer = clamp(+inp.steer || 0, -1, 1);
    let thr = clamp(+inp.throttle || 0, 0, 1);
    let brk = clamp(+inp.brake || 0, 0, 1);
    let drift = !!inp.drift;

    if (this.invuln > 0) this.invuln -= dt;
    if (this.shieldTime > 0) this.shieldTime -= dt;
    if (this.kick > 0 && this.boostTime <= 0) this.kick = 0;
    if (this.boostTime > 0) this.boostTime -= dt;
    if (this.wallHit > 0) this.wallHit = Math.max(0, this.wallHit - dt * 3);
    if (this.landed > 0) this.landed = Math.max(0, this.landed - dt * 4);
    if (this.frozen > 0) {
      this.frozen -= dt;
      steer = 0; thr = 0; brk = 0; drift = false;
    }
    if (this.spinTime > 0) {
      this.spinTime -= dt;
      this.spinAngle += dt * 13;
      steer = 0; thr = 0; brk = 0; drift = false;
    } else {
      // settle the visual spin back to a whole turn
      const target = Math.round(this.spinAngle / (Math.PI * 2)) * Math.PI * 2;
      this.spinAngle += (target - this.spinAngle) * Math.min(1, dt * 10);
    }

    const q = this.q;
    track.query(this.x, this.y, this.z, q.idx, q);

    this.steerSm += (steer - this.steerSm) * Math.min(1, dt * 12);
    steer = this.steerSm;

    let fx = Math.sin(this.h), fz = Math.cos(this.h);
    let rx = -fz, rz = fx;
    let vF = this.vx * fx + this.vz * fz;
    let vR = this.vx * rx + this.vz * rz;
    const spd = Math.abs(vF);

    const boosting = this.boostTime > 0;
    let maxS = st.maxSpeed * this.speedMult;
    if (q.offroad && !boosting) maxS *= st.offroadMult;
    if (boosting) maxS *= st.boostMult;

    // --- longitudinal ---
    if (brk > 0.05 && thr < 0.5 && vF > 0.5) {
      vF = Math.max(0, vF - st.brake * brk * dt);
    } else if (brk > 0.05 && thr < 0.5) {
      vF = Math.max(-st.reverseMax, vF - 14 * brk * dt);
    } else if (thr > 0.01) {
      if (vF < maxS) {
        const a = st.accel * thr * (vF < 0 ? 2.5 : 1) * (1 - 0.5 * Math.max(0, vF) / maxS);
        vF = Math.min(maxS, vF + a * dt);
      }
    } else {
      const c = st.coastDecel * dt;
      vF = Math.abs(vF) <= c ? 0 : vF - Math.sign(vF) * c;
    }
    if (boosting && vF < maxS) vF = Math.min(maxS, vF + st.boostPush * dt);
    if (this.kick > 0) { vF += this.kick; this.kick = 0; }
    if (vF > maxS) vF = maxS + (vF - maxS) * Math.exp(-(q.offroad ? 3.5 : 1.4) * dt);
    // slopes: uphill slows a little, downhill speeds up a little
    const along = fx * q.tx + fz * q.tz;
    vF -= q.ty * Math.sign(along) * 9 * dt;

    // --- drifting ---
    if (this.drifting) {
      if (!drift || spd < 8 || this.spinTime > 0) {
        if (this.driftTier > 0 && this.spinTime <= 0) this.boost(DRIFT_BOOST[this.driftTier - 1], 3 + this.driftTier * 2);
        this.drifting = false;
        this.driftCharge = 0;
        this.driftTier = 0;
      } else if (this.grounded) {
        const tight = (clamp(steer * this.driftDir, -1, 1) + 1) / 2;
        this.driftCharge += dt * (0.65 + 0.7 * tight);
        let tier = 0;
        for (let i = 0; i < DRIFT_TIERS.length; i++) if (this.driftCharge >= DRIFT_TIERS[i]) tier = i + 1;
        if (tier > this.driftTier) this.events.push('tier' + tier);
        this.driftTier = tier;
      }
    } else if (drift && this.grounded && spd > 12 && Math.abs(steer) > 0.3 && this.spinTime <= 0) {
      this.drifting = true;
      this.driftDir = Math.sign(steer);
      this.driftCharge = 0;
      this.driftTier = 0;
      this.vy = 4.5;
      this.grounded = false;
      this.events.push('hop');
    }

    // --- steering ---
    const low = clamp(spd / 6, 0, 1);
    const hi = 1 - 0.38 * clamp(spd / st.maxSpeed, 0, 1.3);
    let yaw;
    if (this.drifting) {
      const t = (clamp(steer * this.driftDir, -1, 1) + 1) / 2;
      yaw = this.driftDir * st.driftTurn * (0.45 + 0.8 * t) * low;
    } else {
      yaw = steer * st.turnRate * low * hi * (vF < -0.5 ? -1 : 1);
    }
    if (this.spinTime > 0) yaw = 0;
    this.yawRate = yaw;
    this.h -= yaw * dt;

    // --- lateral grip ---
    const grip = this.drifting ? st.driftGrip : q.offroad ? st.offroadGrip : st.grip;
    vR *= Math.exp(-grip * dt);

    // rebuild velocity in the new heading frame (keeps slide)
    const vxw = fx * vF + rx * vR, vzw = fz * vF + rz * vR;
    fx = Math.sin(this.h); fz = Math.cos(this.h);
    rx = -fz; rz = fx;
    // the old world velocity, re-expressed: rotate partially toward the new heading (grip does the rest)
    this.vx = vxw; this.vz = vzw;
    this.vF = this.vx * fx + this.vz * fz;
    this.vR = this.vx * rx + this.vz * rz;

    // --- integrate ---
    this.x += this.vx * dt;
    this.z += this.vz * dt;
    track.query(this.x, this.y, this.z, q.idx, q);

    // walls
    const lim = track.edge - st.radius;
    if (q.wall && Math.abs(q.d) > lim) {
      const sg = Math.sign(q.d);
      const pen = Math.abs(q.d) - lim;
      this.x -= q.rx * sg * pen;
      this.z -= q.rz * sg * pen;
      const vn = (this.vx * q.rx + this.vz * q.rz) * sg;
      if (vn > 0) {
        this.vx -= 1.3 * vn * q.rx * sg;
        this.vz -= 1.3 * vn * q.rz * sg;
        const loss = clamp(vn / 28, 0, 0.55);
        this.vx *= 1 - loss * 0.7;
        this.vz *= 1 - loss * 0.7;
        if (vn > 6) { this.wallHit = Math.min(1, vn / 20); this.events.push('bump'); }
      }
      track.query(this.x, this.y, this.z, q.idx, q);
    }

    // vertical
    if (q.hasGround) {
      const gy = q.groundY;
      if (this.grounded) {
        if (this.y - gy < 0.7 && this.vy <= 0.01) { this.y = gy; this.vy = 0; }
        else this.grounded = false;
      }
      if (!this.grounded) {
        this.vy -= st.gravity * dt;
        this.y += this.vy * dt;
        if (this.y <= gy) {
          if (this.vy < -6) this.landed = 1;
          this.y = gy; this.vy = 0; this.grounded = true;
        }
      }
    } else {
      this.grounded = false;
      this.vy -= st.gravity * dt;
      this.y += this.vy * dt;
      if (this.y < q.cy - 9) this.respawn(track);
    }

    if (this.grounded && q.onRoad) { this.lastSafeS = q.s; this.lastSafeD = q.d; }

    // stuck / wrong way detection
    const sp = this.speed;
    if (controlsEnabled && thr > 0.5 && sp < 2 && this.frozen <= 0 && this.spinTime <= 0) this.stuckTime += dt;
    else this.stuckTime = Math.max(0, this.stuckTime - dt);
    if (this.stuckTime > 2.5) this.respawn(track);

    const facing = fx * q.tx + fz * q.tz;
    if (facing < -0.3 && sp > 3) this.wrongTime += dt;
    else this.wrongTime = Math.max(0, this.wrongTime - dt * 2);
    this.wrongWay = this.wrongTime > 0.8;
  }

  /** Update unwrapped lap progress from the latest track position. */
  updateProgress(track) {
    let ds = this.q.s - this.lastS;
    const L = track.length;
    if (ds > L / 2) ds -= L;
    else if (ds < -L / 2) ds += L;
    this.progress += ds;
    this.lastS = this.q.s;
  }
}
