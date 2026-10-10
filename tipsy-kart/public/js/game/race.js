// One race: countdown, kart simulation, laps/positions, items, hazards,
// projectiles, kart-to-kart bumping and rubber-banding. No rendering here.
import { STATS } from './kart.js';

export const ITEM_TYPES = ['fizz', 'slick', 'bouncer', 'bubble'];
export const ITEM_INFO = {
  fizz: { name: 'Fizz Boost', desc: 'Shake it up for a burst of speed' },
  slick: { name: 'Sticky Spill', desc: 'Drop a puddle behind you' },
  bouncer: { name: 'Cork Bomb', desc: 'Lob a bouncing cork forward' },
  bubble: { name: 'Bubble Shield', desc: 'Blocks one hit' },
};

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const COUNTDOWN = 3.6;

export class Race {
  constructor({ track, karts, laps = 3, rng = Math.random }) {
    this.track = track;
    this.karts = karts;
    this.laps = laps;
    this.rng = rng;
    this.phase = 'countdown';      // countdown | racing | done
    this.countdown = COUNTDOWN;
    this.time = 0;                 // race clock (s) since GO
    this.finishOrder = [];
    this.firstFinishAt = -1;
    this.allHumansDoneAt = -1;
    this.events = [];              // {type, kart?, x?, z?}
    this.hazards = [];
    this.projectiles = [];
    this.ordered = karts.slice();
    this.boxes = [];
    const W = track.W;
    for (const s of track.itemRows) {
      for (let i = 0; i < 5; i++) {
        const d = (i - 2) * W * 0.32;
        const p = track.pointAt(s, d);
        this.boxes.push({ s, d, x: p.x, y: p.y + 1.3, z: p.z, respawn: 0 });
      }
    }
    karts.forEach((k, i) => {
      const g = track.gridSlot(i);
      k.reset();
      k.placeAt(track, g.s, g.d);
      k.progress = -(track.length - g.s); // negative: behind the line
      k.lastS = k.q.s;
      k.padCooldown = 0;
    });
    this.updatePositions();
  }

  get countdownValue() {
    // 3,2,1 then 0 (= GO) for the last 0.6 s
    if (this.phase !== 'countdown') return -1;
    return Math.max(0, Math.ceil(this.countdown - 0.6));
  }

  /**
   * Advance one fixed step. getInput(kart, dt) returns the input for that kart
   * (already filtered for humans / produced by AI for CPUs).
   */
  step(dt, getInput) {
    const track = this.track;
    if (this.phase === 'countdown') {
      const before = this.countdownValue;
      this.countdown -= dt;
      const after = this.countdownValue;
      if (after !== before) this.events.push({ type: after === 0 ? 'go' : 'count', value: after });
      if (this.countdown <= 0) this.phase = 'racing';
    } else if (this.phase === 'racing') {
      this.time += dt;
    }
    const racing = this.phase === 'racing';

    this.updateRubberBand();

    for (const k of this.karts) {
      const input = getInput(k, dt);
      k.step(dt, input, track, racing);
      k.updateProgress(track);
      if (k.padCooldown > 0) k.padCooldown -= dt;

      if (racing) {
        const pressed = !!(input && input.useItem);
        if (pressed && !k.lastItemPressed) this.useItem(k);
        k.lastItemPressed = pressed;

        const lapsNow = Math.floor(k.progress / track.length);
        if (lapsNow > k.lapsDone && !k.finished) {
          k.lapsDone = lapsNow;
          k.lapTimes.push(this.time - k.lapStart);
          k.lapStart = this.time;
          if (k.lapsDone >= this.laps) this.finishKart(k);
          else this.events.push({ type: k.lapsDone === this.laps - 1 ? 'finalLap' : 'lap', kart: k });
        }
      }

      // boost pads
      if (k.grounded && k.padCooldown <= 0) {
        for (const pad of track.boostPads) {
          let ds = k.q.s - pad.s;
          if (ds > track.length / 2) ds -= track.length;
          else if (ds < -track.length / 2) ds += track.length;
          if (Math.abs(ds) < pad.len / 2 && Math.abs(k.q.d - pad.d) < pad.halfW) {
            k.boost(1.1, 7);
            k.padCooldown = 0.5;
            this.events.push({ type: 'pad', kart: k });
          }
        }
      }

      // item roulette
      if (k.itemRoll > 0) {
        k.itemRoll -= dt;
        if (k.itemRoll <= 0) { k.item = k.pendingItem; k.pendingItem = null; this.events.push({ type: 'itemReady', kart: k }); }
      }
    }

    this.collideKarts();
    this.updateBoxes(dt);
    this.updateHazards(dt);
    this.updateProjectiles(dt);
    this.updatePositions();

    // end of race conditions
    if (this.phase === 'racing') {
      const humans = this.karts.filter((k) => k.isHuman);
      const humansDone = humans.length > 0 ? humans.every((k) => k.finished) : this.karts.every((k) => k.finished);
      if (humansDone && this.allHumansDoneAt < 0) this.allHumansDoneAt = this.time;
      if (this.allHumansDoneAt >= 0 && this.time - this.allHumansDoneAt > 2.5) this.endRace();
      else if (this.firstFinishAt >= 0 && this.time - this.firstFinishAt > 30) this.endRace();
    }
  }

  finishKart(k) {
    k.finished = true;
    k.finishTime = this.time;
    this.finishOrder.push(k);
    if (this.firstFinishAt < 0) this.firstFinishAt = this.time;
    this.events.push({ type: 'finish', kart: k, place: this.finishOrder.length });
  }

  endRace() {
    if (this.phase === 'done') return;
    this.phase = 'done';
    this.updatePositions();
    this.events.push({ type: 'raceDone' });
  }

  /** Debug: finish immediately in the current running order. */
  forceFinish() {
    if (this.phase === 'countdown') this.phase = 'racing';
    this.updatePositions();
    for (const k of this.ordered) {
      if (!k.finished) {
        k.finished = true;
        k.finishTime = this.time + 0.01 * this.finishOrder.length;
        k.lapsDone = this.laps;
        this.finishOrder.push(k);
      }
    }
    this.endRace();
  }

  updateRubberBand() {
    let best = -Infinity;
    for (const k of this.karts) if (k.isHuman && !k.finished) best = Math.max(best, k.progress);
    for (const k of this.karts) {
      if (k.isHuman && !k.autopilot) { k.speedMult = 1; continue; }
      if (k.isHuman) { k.speedMult = 0.92; continue; }
      if (best === -Infinity) { k.speedMult = k.skill; continue; }
      const diff = k.progress - best;
      const rb = clamp(1 - diff * 0.0011, 0.88, 1.07);
      k.speedMult = k.skill * rb;
    }
  }

  updatePositions() {
    const arr = this.ordered;
    arr.sort((a, b) => {
      if (a.finished && b.finished) return a.finishTime - b.finishTime;
      if (a.finished) return -1;
      if (b.finished) return 1;
      return b.progress - a.progress;
    });
    arr.forEach((k, i) => { k.place = i + 1; });
  }

  rollItem(k) {
    const n = this.karts.length;
    const f = n > 1 ? (k.place - 1) / (n - 1) : 0.5;
    const w = {
      fizz: 10 + 45 * f,
      slick: 40 - 35 * f,
      bouncer: 25 + 10 * f,
      bubble: 25 - 20 * f,
    };
    let total = 0;
    for (const t of ITEM_TYPES) total += w[t];
    let r = this.rng() * total;
    for (const t of ITEM_TYPES) { r -= w[t]; if (r <= 0) return t; }
    return 'fizz';
  }

  updateBoxes(dt) {
    const R = STATS.radius + 1.1;
    for (const b of this.boxes) {
      if (b.respawn > 0) { b.respawn -= dt; continue; }
      for (const k of this.karts) {
        const dx = k.x - b.x, dz = k.z - b.z, dy = k.y + 0.6 - b.y;
        if (dx * dx + dz * dz < R * R && Math.abs(dy) < 2.5) {
          b.respawn = 2.5;
          this.events.push({ type: 'box', kart: k, x: b.x, y: b.y, z: b.z });
          if (!k.item && k.itemRoll <= 0 && this.phase === 'racing') {
            k.pendingItem = this.rollItem(k);
            k.itemRoll = 1.0;
          }
          break;
        }
      }
    }
  }

  useItem(k) {
    if (!k.item || k.itemRoll > 0 || k.spinTime > 0) return;
    const type = k.item;
    k.item = null;
    const fx = Math.sin(k.h), fz = Math.cos(k.h);
    const track = this.track;
    if (type === 'fizz') {
      k.boost(1.5, 8);
    } else if (type === 'bubble') {
      k.shieldTime = 7;
    } else if (type === 'slick') {
      const x = k.x - fx * 3, z = k.z - fz * 3;
      const q = track.query(x, k.y, z, k.q.idx, {});
      this.hazards.push({ type: 'slick', x, y: q.groundY, z, s: q.s, d: q.d, life: 30, owner: k, immune: 0.8, age: 0 });
      if (this.hazards.length > 14) this.hazards.shift();
    } else if (type === 'bouncer') {
      const sp = Math.max(0, k.vF || 0) + 30;
      this.projectiles.push({
        type: 'bouncer', x: k.x + fx * 2.4, y: k.y + 0.6, z: k.z + fz * 2.4, vx: fx * sp, vz: fz * sp, vy: 4,
        life: 6, owner: k, immune: 0.4, bounces: 0, q: { idx: k.q.idx }, age: 0,
      });
    }
    this.events.push({ type: 'useItem', item: type, kart: k });
  }

  collideKarts() {
    const ks = this.karts, R2 = STATS.radius * 2;
    for (let i = 0; i < ks.length; i++) {
      const a = ks[i];
      for (let j = i + 1; j < ks.length; j++) {
        const b = ks[j];
        const dx = b.x - a.x, dz = b.z - a.z;
        const d2 = dx * dx + dz * dz;
        if (d2 >= R2 * R2 || Math.abs(a.y - b.y) > 2 || d2 < 1e-6) continue;
        const d = Math.sqrt(d2);
        const nx = dx / d, nz = dz / d;
        const pen = R2 - d;
        // boosting/shielded karts shove harder
        const heavyA = a.boosting || a.shieldTime > 0, heavyB = b.boosting || b.shieldTime > 0;
        const fa = heavyA && !heavyB ? 0.25 : heavyB && !heavyA ? 0.75 : 0.5, fb = 1 - fa;
        a.x -= nx * pen * fa; a.z -= nz * pen * fa;
        b.x += nx * pen * fb; b.z += nz * pen * fb;
        const rel = (b.vx - a.vx) * nx + (b.vz - a.vz) * nz;
        if (rel < 0) {
          const imp = -1.5 * rel;
          a.vx -= imp * nx * fa; a.vz -= imp * nz * fa;
          b.vx += imp * nx * fb; b.vz += imp * nz * fb;
          if (rel < -5) {
            this.events.push({ type: 'bump', kart: a, other: b });
            a.wallHit = Math.max(a.wallHit, 0.4); b.wallHit = Math.max(b.wallHit, 0.4);
          }
        }
      }
    }
  }

  updateHazards(dt) {
    const R = STATS.radius + 0.9;
    for (let i = this.hazards.length - 1; i >= 0; i--) {
      const h = this.hazards[i];
      h.life -= dt; h.age += dt;
      if (h.immune > 0) h.immune -= dt;
      let gone = h.life <= 0;
      if (!gone) {
        for (const k of this.karts) {
          if (k === h.owner && h.immune > 0) continue;
          const dx = k.x - h.x, dz = k.z - h.z;
          if (dx * dx + dz * dz < R * R && Math.abs(k.y - h.y) < 1.5) {
            const hit = k.spinOut(1.0);
            this.events.push({ type: hit ? 'hit' : 'blocked', kart: k, by: 'slick' });
            gone = true;
            break;
          }
        }
      }
      if (gone) this.hazards.splice(i, 1);
    }
  }

  updateProjectiles(dt) {
    const track = this.track;
    const lim = track.edge - 0.7;
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.life -= dt; p.age += dt;
      if (p.immune > 0) p.immune -= dt;
      p.x += p.vx * dt; p.z += p.vz * dt;
      const q = track.query(p.x, p.y, p.z, p.q.idx ?? -1, p.q);
      // bounce along the road surface
      p.vy -= 30 * dt;
      p.y += p.vy * dt;
      let dead = p.life <= 0;
      if (q.hasGround && p.y < q.groundY + 0.6) { p.y = q.groundY + 0.6; p.vy = 7; }
      if (!q.hasGround && p.y < q.cy - 8) dead = true;
      if (q.wall && Math.abs(q.d) > lim) {
        const sg = Math.sign(q.d);
        p.x -= q.rx * sg * (Math.abs(q.d) - lim);
        p.z -= q.rz * sg * (Math.abs(q.d) - lim);
        const vn = (p.vx * q.rx + p.vz * q.rz) * sg;
        if (vn > 0) { p.vx -= 2 * vn * q.rx * sg; p.vz -= 2 * vn * q.rz * sg; p.bounces++; this.events.push({ type: 'wallBounce', x: p.x, z: p.z }); }
        if (p.bounces > 5) dead = true;
      }
      if (!dead) {
        for (const k of this.karts) {
          if (k === p.owner && p.immune > 0) continue;
          const dx = k.x - p.x, dz = k.z - p.z;
          if (dx * dx + dz * dz < 2.0 * 2.0 && Math.abs(k.y + 0.6 - p.y) < 2) {
            const hit = k.spinOut(1.3);
            this.events.push({ type: hit ? 'hit' : 'blocked', kart: k, by: 'bouncer' });
            dead = true;
            break;
          }
        }
      }
      if (!dead) {
        // corks also pop slick puddles
        for (let h = this.hazards.length - 1; h >= 0; h--) {
          const hz = this.hazards[h];
          const dx = hz.x - p.x, dz = hz.z - p.z;
          if (dx * dx + dz * dz < 2.2 * 2.2) { this.hazards.splice(h, 1); dead = true; break; }
        }
      }
      if (dead) this.projectiles.splice(i, 1);
    }
  }

  /** Final classification (finished first, then by progress). */
  results(points) {
    this.updatePositions();
    return this.ordered.map((k, i) => ({
      place: i + 1,
      id: k.id,
      name: k.name,
      color: k.color,
      isHuman: k.isHuman,
      slot: k.slot,
      finished: k.finished,
      time: k.finished ? +k.finishTime.toFixed(3) : null,
      bestLap: k.lapTimes.length ? +Math.min(...k.lapTimes).toFixed(3) : null,
      points: points[i] || 0,
    }));
  }
}
