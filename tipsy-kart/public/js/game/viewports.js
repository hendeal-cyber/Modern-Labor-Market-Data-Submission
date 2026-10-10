// Split-screen rendering. One shared WebGL renderer draws each player's
// chase camera, then the frame is copied into that player's own 2D canvas.
// Per-player visual effects (blur, hue shift, sway, tunnel, double vision)
// only touch that player's canvas/overlay.
import * as THREE from 'three';
import { DRIFT_TIERS, SPARK_COLORS } from './kart.js';

const ORD = ['th', 'st', 'nd', 'rd'];
export const ordinal = (n) => n + (n % 100 >= 11 && n % 100 <= 13 ? 'th' : ORD[n % 10] || 'th');
const lerpAngle = (a, b, t) => {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
};
const hex = (c) => '#' + new THREE.Color(c).getHexString();

export const ITEM_ICONS = {
  fizz: '<svg viewBox="0 0 40 40"><rect x="12" y="8" width="16" height="26" rx="3" fill="#ff5a3c"/><rect x="12" y="15" width="16" height="6" fill="#fff"/><rect x="14" y="5" width="12" height="4" rx="1" fill="#ccc"/><path d="M20 0 l3 4 h-6z" fill="#7ff3ff"/></svg>',
  slick: '<svg viewBox="0 0 40 40"><path d="M6 26c0-6 8-8 14-8s16 2 15 8-9 8-15 8S6 32 6 26z" fill="#9be15d"/><ellipse cx="17" cy="25" rx="5" ry="2.5" fill="#d8f56a"/><path d="M22 6c3 5 5 7 5 10a5 5 0 0 1-10 0c0-3 2-5 5-10z" fill="#9be15d"/></svg>',
  bouncer: '<svg viewBox="0 0 40 40"><path d="M11 12h18l-3 22H14z" fill="#d9a066"/><rect x="10" y="20" width="20" height="5" fill="#e8463a"/><path d="M8 6l4 4M32 6l-4 4M20 2v6" stroke="#ffe14d" stroke-width="2.5"/></svg>',
  bubble: '<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="15" fill="rgba(127,233,255,0.35)" stroke="#7fe9ff" stroke-width="3"/><circle cx="14" cy="14" r="4" fill="#fff" opacity="0.8"/></svg>',
};
const ITEM_KEYS = Object.keys(ITEM_ICONS);

const WATER_ICON = '<svg viewBox="0 0 24 24" class="mug"><path d="M6 4h12l-1.5 17h-9z" fill="rgba(127,233,255,0.35)" stroke="#7fe9ff" stroke-width="1.5"/><path d="M7.2 10h9.6l-1 10.5h-7.6z" fill="#7fe9ff"/></svg>';
const BAC_COLORS = { green: '#3cd46a', amber: '#ffc93c', red: '#ff4d4d' };
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const DRINK_ICON = '<svg viewBox="0 0 24 24" class="mug"><path d="M5 6h11v14H5z" fill="#ffc93c"/><path d="M5 4h11v4H5z" fill="#fff"/><path d="M16 9h3a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-3" stroke="#ffc93c" stroke-width="2" fill="none"/></svg>';

class PlayerView {
  constructor(parent, slot) {
    this.slot = slot;
    this.el = document.createElement('div');
    this.el.className = 'vp';
    this.el.dataset.slot = slot;
    this.el.innerHTML = `
      <canvas class="vp-canvas"></canvas>
      <div class="vp-tunnel"></div>
      <div class="vp-blink"></div>
      <div class="hud">
        <div class="hud-tl"><div class="hud-pos"></div><div class="hud-name"></div></div>
        <div class="hud-tr"><div class="hud-item"><div class="hud-item-icon"></div></div></div>
        <div class="hud-bl"><div class="hud-lap"></div><div class="hud-drinks"></div></div>
        <div class="hud-br"><div class="hud-speed"><b></b><span>km/h</span></div><div class="hud-drift"><i></i></div></div>
        <div class="hud-center"></div>
        <div class="hud-warn">WRONG WAY</div>
      </div>`;
    parent.appendChild(this.el);
    this.canvas = this.el.querySelector('canvas');
    this.ctx = this.canvas.getContext('2d', { alpha: false });
    this.tunnel = this.el.querySelector('.vp-tunnel');
    this.blink = this.el.querySelector('.vp-blink');
    const $ = (s) => this.el.querySelector(s);
    this.ui = {
      pos: $('.hud-pos'), name: $('.hud-name'), item: $('.hud-item'), itemIcon: $('.hud-item-icon'),
      lap: $('.hud-lap'), drinks: $('.hud-drinks'), speed: $('.hud-speed b'), drift: $('.hud-drift'),
      driftBar: $('.hud-drift i'), center: $('.hud-center'), warn: $('.hud-warn'),
    };
    this.cache = {};
    this.cssSize = { w: 0, h: 0 };
    this.camera = new THREE.PerspectiveCamera(62, 16 / 9, 0.3, 1600);
    this.camYaw = null;
    this.fov = 62;
    this.flashText = '';
    this.flashUntil = 0;
    this.flashClass = '';
    this.fxCss = '';
    this.kart = null;
  }

  set(key, el, value, prop = 'textContent') {
    if (this.cache[key] === value) return;
    this.cache[key] = value;
    el[prop] = value;
  }

  flash(text, seconds, cls = '', now = performance.now() / 1000) {
    this.flashText = text;
    this.flashUntil = now + seconds;
    this.flashClass = cls;
  }

  updateCamera(dt, k, sway, now, lag = 0, fovOffset = 0) {
    const cam = this.camera;
    const spd = k.speed;
    let target = k.h;
    if (spd > 3) {
      const velYaw = Math.atan2(k.vx, k.vz);
      target = k.spinTime > 0 ? velYaw : lerpAngle(k.h, velYaw, 0.45);
    }
    const snap = this.camYaw === null || cam.position.distanceToSquared(this._kp || cam.position) > 900;
    this.camYaw = snap ? target : lerpAngle(this.camYaw, target, 1 - Math.exp(-dt / (0.18 + lag)));
    const dist = 6.4 + spd * 0.035;
    const height = 2.7;
    const dx = k.x - Math.sin(this.camYaw) * dist, dz = k.z - Math.cos(this.camYaw) * dist;
    const dy = Math.max(k.y + height, (k.q.groundY ?? k.y) + 1.6);
    if (snap) cam.position.set(dx, dy, dz);
    else {
      const a = 1 - Math.exp(-dt / (0.07 + lag)), ay = 1 - Math.exp(-dt / (0.14 + lag));
      cam.position.x += (dx - cam.position.x) * a;
      cam.position.z += (dz - cam.position.z) * a;
      cam.position.y += (dy - cam.position.y) * ay;
    }
    this._kp = this._kp || new THREE.Vector3();
    this._kp.set(k.x, k.y, k.z);
    const shake = k.wallHit * 0.25;
    cam.lookAt(
      k.x + Math.sin(this.camYaw) * 4 + (Math.random() - 0.5) * shake,
      k.y + 1.25 + (Math.random() - 0.5) * shake,
      k.z + Math.cos(this.camYaw) * 4,
    );
    if (sway) cam.rotateZ((sway * Math.PI) / 180);
    const wantFov = this.baseFov + (k.boostTime > 0 ? 9 : 0) + Math.min(6, spd * 0.12);
    this.fov += (wantFov - this.fov) * Math.min(1, dt * 4);
    const f = Math.min(120, Math.max(20, this.fov + fovOffset));
    if (Math.abs(cam.fov - f) > 0.05) { cam.fov = f; cam.updateProjectionMatrix(); }
    void now;
  }
}

export class Viewports {
  constructor(container, minimap) {
    this.container = container;
    this.minimap = minimap;
    this.mmCtx = minimap.getContext('2d');
    this.views = [];
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: false });
    this.renderer.setPixelRatio(1);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.glCanvas = this.renderer.domElement;
    this.scene = new THREE.Scene();
    this.pxW = 0; this.pxH = 0;
    this.extra = null;
    this.mmPath = null;
    this.mmTimer = 0;
    window.addEventListener('resize', () => this.layout());
  }

  /** slots: array of human slots that get a viewport (may be empty -> spectator view) */
  setup(slots, players) {
    this.container.innerHTML = '';
    this.views = [];
    const list = slots.length ? slots : [-1];
    for (const s of list) {
      const v = new PlayerView(this.container, s);
      const p = players.find((pp) => pp.slot === s);
      v.el.style.setProperty('--pc', p ? hex(p.color) : '#ffffff');
      this.views.push(v);
    }
    this.extra = null;
    if (list.length === 3) {
      this.extra = document.createElement('div');
      this.extra.className = 'vp vp-extra';
      this.extra.innerHTML = '<div class="extra-title">Live standings</div><ol class="extra-list"></ol>';
      this.container.appendChild(this.extra);
    }
    this.container.dataset.count = String(list.length);
    this.layout();
  }

  layout() {
    if (!this.views.length) return;
    const n = this.views.length;
    const r = this.container.getBoundingClientRect();
    const cols = n >= 3 ? 2 : 1, rows = n >= 2 ? 2 : 1;
    const w = Math.max(64, Math.floor(r.width / cols)), h = Math.max(64, Math.floor(r.height / rows));
    const dpr = window.devicePixelRatio || 1;
    const scale = Math.min(dpr, n === 1 ? 1.5 : n === 2 ? 1.25 : 1);
    const pw = Math.max(64, Math.round(w * scale)), ph = Math.max(64, Math.round(h * scale));
    for (const v of this.views) {
      v.cssSize = { w, h };
      if (v.canvas.width !== pw || v.canvas.height !== ph) { v.canvas.width = pw; v.canvas.height = ph; }
      v.camera.aspect = w / h;
      v.baseFov = w / h > 2.2 ? 50 : w / h > 1.5 ? 60 : 66;
      v.fov = v.baseFov;
      v.camera.fov = v.baseFov;
      v.camera.updateProjectionMatrix();
    }
    if (pw !== this.pxW || ph !== this.pxH) {
      this.renderer.setSize(pw, ph, false);
      this.pxW = pw; this.pxH = ph;
    }
    // minimap placement
    const mm = this.minimap;
    mm.className = 'minimap mm-' + n;
    if (this.extra) this.extra.appendChild(mm);
    else this.container.parentElement.appendChild(mm);
    const size = n === 3 ? Math.min(w, h) * 0.7 : n === 4 ? Math.min(w, h) * 0.3 : Math.min(220, Math.min(r.width, r.height) * (n === 2 ? 0.24 : 0.28));
    mm.width = mm.height = Math.round(size * dpr);
    mm.style.width = mm.style.height = Math.round(size) + 'px';
    this.mmPath = null;
  }

  setWorld({ trackView, itemsView, kartModels, track }) {
    const s = this.scene;
    while (s.children.length) s.remove(s.children[0]);
    const th = track.def.theme;
    s.fog = new THREE.Fog(th.fog, th.fogNear, th.fogFar);
    s.background = new THREE.Color(th.fog);
    s.add(trackView.group, itemsView.group);
    for (const m of kartModels) s.add(m.root);
    this.trackView = trackView;
    this.kartModels = kartModels;
    this.track = track;
    this.mmPath = null;
    for (const v of this.views) v.camYaw = null;
  }

  /** Render every viewport. ctx: { race, kartBySlot, visualFx, session, now, dt } */
  render(ctx) {
    const { race, now, dt } = ctx;
    for (const v of this.views) {
      const k = v.slot >= 0 ? ctx.kartBySlot.get(v.slot) : race.ordered[0];
      if (!k) continue;
      v.kart = k;
      let fx = null;
      if (v.slot >= 0) {
        try { fx = ctx.visualFx[v.slot] ? ctx.visualFx[v.slot]({ time: now, slot: v.slot, speed: k.speed, kartState: k._filterCtx ? k._filterCtx.kartState : k, drinks: ctx.drinksOf(v.slot), raceIndex: ctx.raceIndex, viewport: v.cssSize }) : null; } catch (e) { fx = null; ctx.warnOnce('visualFx', e); }
      }
      const num = (key, def) => { const x = fx ? +fx[key] : NaN; return Number.isFinite(x) ? x : def; };
      const clamp01 = (x) => Math.min(1, Math.max(0, x));
      const blur = Math.max(0, num('blurPx', 0));
      const sway = num('swayDeg', 0);
      const dv = clamp01(num('doubleVision', 0));
      const tunnel = clamp01(num('tunnel', 0));
      const hue = num('hueShift', 0);
      // optional extras from the impairment lane (all default to no-ops)
      const camLag = Math.max(0, num('camLagS', 0));
      const fovWobble = num('fovWobbleDeg', 0);
      const saturate = Math.max(0, num('saturate', 1));
      const zoom = Math.max(0.5, num('zoom', 1));
      const blink = clamp01(num('blink', 0));
      const jolt = num('joltPx', 0); // vertical bump in CSS px (sign = direction)

      v.updateCamera(dt, k, sway, now, camLag, fovWobble);
      this.trackView.follow(v.camera);
      // hide other karts that are practically inside this camera
      const cp = v.camera.position;
      for (const m of this.kartModels) {
        const o = m.kart;
        m.root.visible = o === k || (o.x - cp.x) ** 2 + (o.y + 1 - cp.y) ** 2 + (o.z - cp.z) ** 2 > 12;
      }
      this.renderer.render(this.scene, v.camera);

      const c = v.ctx, W = v.canvas.width, H = v.canvas.height;
      c.globalAlpha = 1;
      c.drawImage(this.glCanvas, 0, 0, this.pxW, this.pxH, 0, 0, W, H);
      if (dv > 0.01) {
        // ghost offset: explicit CSS px from the effect, else a slow drift
        const cssToPx = W / Math.max(1, v.canvas.clientWidth || W);
        const off = dv * W * 0.035;
        const gx = fx && Number.isFinite(+fx.ghostDx) ? +fx.ghostDx * cssToPx : off * Math.sin(now * 1.3);
        const gy = fx && Number.isFinite(+fx.ghostDy) ? +fx.ghostDy * cssToPx : off * 0.35 * Math.cos(now * 0.9);
        c.globalAlpha = 0.42 * dv;
        c.drawImage(this.glCanvas, 0, 0, this.pxW, this.pxH, gx, gy, W, H);
        c.globalAlpha = 1;
      }
      const css = (blur > 0.05 ? `blur(${blur.toFixed(1)}px) ` : '') +
        (Math.abs(hue) > 0.5 ? `hue-rotate(${hue.toFixed(0)}deg) ` : '') +
        (Math.abs(saturate - 1) > 0.01 ? `saturate(${saturate.toFixed(2)})` : '');
      if (css !== v.fxCss) { v.fxCss = css; v.canvas.style.filter = css || 'none'; }
      const bump = Math.abs(jolt) > 0.05;
      const tf = (Math.abs(zoom - 1) > 0.001 || bump) ? `translateY(${(bump ? jolt : 0).toFixed(1)}px) scale(${zoom.toFixed(3)})` : '';
      if (v.cache.tf !== tf) { v.cache.tf = tf; v.canvas.style.transform = tf; }
      const top = (tunnel * 0.95).toFixed(2);
      if (v.cache.tunnel !== top) { v.cache.tunnel = top; v.tunnel.style.opacity = top; }
      const bo = blink.toFixed(2);
      if (v.cache.blink !== bo) { v.cache.blink = bo; v.blink.style.opacity = bo; }

      this.updateHud(v, k, ctx);
    }
    this.mmTimer -= dt;
    if (this.mmTimer <= 0) { this.mmTimer = 1 / 30; this.drawMinimap(ctx); }
    if (this.extra) this.updateExtra(ctx);
  }

  updateHud(v, k, ctx) {
    const { race, session, now } = ctx;
    const u = v.ui;
    const p = session.players.find((pp) => pp.slot === v.slot);
    v.set('pos', u.pos, `${k.place}<sup>${ordinal(k.place).slice(-2)}</sup>`, 'innerHTML');
    v.set('posCls', u.pos, 'hud-pos p' + Math.min(k.place, 4), 'className');
    v.set('name', u.name, p ? p.name : 'Spectating ' + k.name);
    const lap = Math.min(race.laps, Math.max(1, k.lapsDone + 1));
    v.set('lap', u.lap, k.finished ? 'FINISHED' : `LAP ${lap}/${race.laps}`);
    this.updateDrinkHud(v, p, ctx);
    v.set('speed', u.speed, String(Math.round(k.speed * 3.6)));
    // item slot with roulette
    let icon = '';
    if (k.itemRoll > 0) icon = ITEM_ICONS[ITEM_KEYS[Math.floor(now * 14) % ITEM_KEYS.length]];
    else if (k.item) icon = ITEM_ICONS[k.item];
    v.set('item', u.itemIcon, icon, 'innerHTML');
    v.set('itemCls', u.item, 'hud-item' + (k.item && k.itemRoll <= 0 ? ' ready' : '') + (k.itemRoll > 0 ? ' rolling' : ''), 'className');
    // drift meter
    const charge = k.drifting ? Math.min(1, k.driftCharge / DRIFT_TIERS[2]) : 0;
    const dw = (charge * 100).toFixed(0) + '%';
    if (v.cache.dw !== dw) { v.cache.dw = dw; u.driftBar.style.width = dw; }
    const dcol = k.driftTier > 0 ? hex(SPARK_COLORS[k.driftTier - 1]) : '#cccccc';
    if (v.cache.dcol !== dcol) { v.cache.dcol = dcol; u.driftBar.style.background = dcol; }
    // centre text: countdown > flash > nothing
    let center = '', cls = '';
    if (race.phase === 'countdown') {
      const cv = race.countdownValue;
      center = cv > 0 ? String(cv) : 'GO!';
      cls = cv > 0 ? 'count' : 'go';
    } else if (race.phase === 'racing' && race.time < 0.8) {
      center = 'GO!'; cls = 'go';
    } else if (k.finished) {
      center = `${ordinal(k.place)}!`; cls = 'finish';
    } else if (now < v.flashUntil) {
      center = v.flashText; cls = v.flashClass;
    }
    v.set('center', u.center, center);
    v.set('centerCls', u.center, 'hud-center ' + cls, 'className');
    const wd = k.wrongWay && !k.finished && race.phase === 'racing' ? 'block' : 'none';
    if (v.cache.warn !== wd) { v.cache.warn = wd; u.warn.style.display = wd; }
  }

  /** Drinks / BAC readout. Uses game.impairment.hudModel(slot) when the impairment lane provides it. */
  updateDrinkHud(v, p, ctx) {
    const u = v.ui;
    let model = null;
    if (ctx.hudModel && v.slot >= 0) {
      v.hudT = (v.hudT || 0) - ctx.dt;
      if (v.hudT <= 0 || !v.hudModel) {
        v.hudT = 0.25;
        try { v.hudModel = ctx.hudModel(v.slot); } catch (e) { v.hudModel = null; ctx.warnOnce('impairment.hudModel', e); }
      }
      model = v.hudModel;
    }
    let html;
    if (model && typeof model === 'object') {
      const col = BAC_COLORS[model.color] || model.color || '#3cd46a';
      const fill = Math.max(0, Math.min(1, +model.barFill || 0)) * 100;
      const tick = Math.max(0, Math.min(1, +model.limitTick || 0)) * 100;
      const icon = model.icon === 'water' || model.water ? WATER_ICON : DRINK_ICON;
      const count = model.count ?? model.drinks ?? (p ? p.drinks || 0 : 0);
      html = `${icon}<span>${esc(count)}</span><div class="bac">` +
        `<em>${esc(model.bacText || '')}</em>` +
        `<div class="bac-bar"><i style="width:${fill.toFixed(1)}%;background:${esc(col)}"></i><b style="left:${tick.toFixed(1)}%"><span>LIMIT</span></b></div>` +
        (model.tierLabel ? `<div class="bac-tier" style="color:${esc(col)}">${esc(model.tierLabel)}</div>` : '') +
        `</div>`;
    } else {
      const drinks = p ? p.drinks || 0 : 0;
      const bac = p && typeof p.bac === 'number' && Number.isFinite(p.bac) ? `est. BAC ${p.bac.toFixed(3)}%` : 'BAC --';
      html = `${DRINK_ICON}<span>${drinks}</span><em>${bac}</em>`;
    }
    v.set('drinks', u.drinks, html, 'innerHTML');
  }

  updateExtra(ctx) {
    const list = this.extra.querySelector('.extra-list');
    const html = ctx.race.ordered.map((k) => `<li style="--c:${hex(k.color)}"><span class="dot"></span>${k.name}${k.isHuman ? ' <b>(P' + (k.slot + 1) + ')</b>' : ''}</li>`).join('');
    if (this._extraHtml !== html) { this._extraHtml = html; list.innerHTML = html; }
  }

  drawMinimap(ctx) {
    const t = this.track;
    if (!t) return;
    const c = this.mmCtx, cv = this.minimap;
    const S = cv.width;
    if (!this.mmPath) {
      let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
      for (let i = 0; i < t.N; i++) {
        minX = Math.min(minX, t.Px[i]); maxX = Math.max(maxX, t.Px[i]);
        minZ = Math.min(minZ, t.Pz[i]); maxZ = Math.max(maxZ, t.Pz[i]);
      }
      const pad = 0.1 * S;
      const sc = (S - pad * 2) / Math.max(maxX - minX, maxZ - minZ);
      const ox = pad + ((S - pad * 2) - (maxX - minX) * sc) / 2, oz = pad + ((S - pad * 2) - (maxZ - minZ) * sc) / 2;
      // mirror x so the map matches the driver's left/right when viewed from above facing -z
      this.mmMap = (x, z) => [S - (ox + (x - minX) * sc), oz + (z - minZ) * sc];
      const path = new Path2D();
      for (let i = 0; i <= t.N; i++) {
        const [x, y] = this.mmMap(t.Px[i % t.N], t.Pz[i % t.N]);
        if (i === 0) path.moveTo(x, y); else path.lineTo(x, y);
      }
      this.mmPath = path;
      this.mmScale = sc;
    }
    c.clearRect(0, 0, S, S);
    c.lineJoin = 'round';
    c.strokeStyle = 'rgba(0,0,0,0.55)';
    c.lineWidth = Math.max(4, t.W * 2 * this.mmScale + 4);
    c.stroke(this.mmPath);
    c.strokeStyle = 'rgba(255,255,255,0.85)';
    c.lineWidth = Math.max(2, t.W * 2 * this.mmScale);
    c.stroke(this.mmPath);
    const [sx, sy] = this.mmMap(t.Px[0], t.Pz[0]);
    c.fillStyle = '#111';
    c.fillRect(sx - 3, sy - 3, 6, 6);
    const ks = ctx.race.ordered.slice().reverse();
    for (const k of ks) {
      const [x, y] = this.mmMap(k.x, k.z);
      const r = (k.isHuman ? 0.034 : 0.022) * S;
      c.beginPath();
      c.arc(x, y, r, 0, Math.PI * 2);
      c.fillStyle = hex(k.color);
      c.fill();
      c.lineWidth = k.isHuman ? 3 : 1.5;
      c.strokeStyle = k.isHuman ? '#fff' : 'rgba(0,0,0,0.6)';
      c.stroke();
    }
  }

  dispose() {
    this.container.innerHTML = '';
    this.views = [];
  }
}
