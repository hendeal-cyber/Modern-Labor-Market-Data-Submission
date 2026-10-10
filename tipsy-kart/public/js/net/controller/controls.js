// Touch controls (phone-controls spec 3.4, 3.5). Pointer Events only (no mixed touch/mouse handlers).
//
//  - Right cluster: ONE pointer zone with sub-regions DRIFT (top 35%), GAS (bottom 65%) and, in touch
//    mode, BRAKE (inner strip). The zone captures the pointer and hit-tests on every move, so a thumb
//    can roll between regions without lifting. A finger dragged outside keeps its last region.
//  - Floating horizontal stick (touch mode): origin at the touch point, only horizontal travel counts.
//  - ITEM and (tilt mode) BRAKE are separate buttons, each captured to its own pointer.
//  - Everything is released on pointerup/cancel/lostpointercapture, and on blur/hidden/pagehide/orientationchange.

import { stickCurve } from './tilt.js';

export class Controls {
  /**
   * @param {object} els  DOM elements: rightCol, driftBand, gasArea, brakeStrip, stickZone, stickBase,
   *                      stickKnob, itemBtn, brakeBtn
   * @param {()=>void} onEdge  called after every control state change (the caller sends input at once)
   */
  constructor(els, onEdge) {
    this.els = els;
    this.onEdge = onEdge;
    this.active = false;
    this.itemCount = 0;
    this.region = null;      // 'gas' | 'drift' | 'brake' | null  (right cluster)
    this.brakeBtn = false;   // tilt-mode brake button
    this.stick = 0;          // -1..1
    this.rightPid = null;
    this.stickPid = null;
    this.stickOrigin = null;
    this.itemPid = null;
    this.brakePid = null;
    this.bind();
  }

  setActive(on) {
    this.active = on;
    if (!on) this.releaseAll(true);
  }

  /** Raw control values (before auto-gas). */
  read() {
    const r = this.region;
    const brake = r === 'brake' || this.brakeBtn ? 1 : 0;
    return { throttle: r === 'gas' || r === 'drift' ? 1 : 0, brake, drift: r === 'drift', stick: this.stick };
  }

  hit(x, y) {
    for (const [name, el] of [['drift', this.els.driftBand], ['gas', this.els.gasArea], ['brake', this.els.brakeStrip]]) {
      const b = el.getBoundingClientRect();
      if (b.width > 0 && x >= b.left && x <= b.right && y >= b.top && y <= b.bottom) return name;
    }
    return null;
  }

  setRegion(r) {
    if (r === this.region) return;
    this.region = r;
    this.els.driftBand.classList.toggle('on', r === 'drift');
    this.els.gasArea.classList.toggle('on', r === 'gas' || r === 'drift');
    this.els.brakeStrip.classList.toggle('on', r === 'brake');
    this.onEdge();
  }

  bind() {
    const e = this.els;
    const capture = (el, ev) => { try { el.setPointerCapture(ev.pointerId); } catch (x) { /* synthetic or already gone */ } };
    const rel = (el, id) => { try { if (el.hasPointerCapture(id)) el.releasePointerCapture(id); } catch (x) { /* ignore */ } };

    // ---- right cluster
    const rc = e.rightCol;
    rc.addEventListener('pointerdown', (ev) => {
      if (!this.active || this.rightPid != null) return;
      ev.preventDefault();
      this.rightPid = ev.pointerId;
      capture(rc, ev);
      let r = this.hit(ev.clientX, ev.clientY);
      if (!r) { const b = rc.getBoundingClientRect(); r = ev.clientY - b.top < b.height * 0.35 ? 'drift' : 'gas'; }
      this.setRegion(r);
    });
    rc.addEventListener('pointermove', (ev) => {
      if (ev.pointerId !== this.rightPid) return;
      const r = this.hit(ev.clientX, ev.clientY);
      if (r) this.setRegion(r); // outside any region: keep the last one until the finger lifts
    });
    const rcUp = (ev) => {
      if (ev.pointerId !== this.rightPid) return;
      this.rightPid = null; rel(rc, ev.pointerId); this.setRegion(null);
    };
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach((t) => rc.addEventListener(t, rcUp));

    // ---- ITEM
    const ib = e.itemBtn;
    ib.addEventListener('pointerdown', (ev) => {
      if (!this.active || this.itemPid != null) return;
      ev.preventDefault();
      this.itemPid = ev.pointerId; capture(ib, ev);
      ib.classList.add('down');
      this.itemCount++;
      this.onEdge();
    });
    const ibUp = (ev) => { if (ev.pointerId !== this.itemPid) return; this.itemPid = null; rel(ib, ev.pointerId); ib.classList.remove('down'); };
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach((t) => ib.addEventListener(t, ibUp));

    // ---- BRAKE button (tilt mode)
    const bb = e.brakeBtn;
    bb.addEventListener('pointerdown', (ev) => {
      if (!this.active || this.brakePid != null) return;
      ev.preventDefault();
      this.brakePid = ev.pointerId; capture(bb, ev);
      bb.classList.add('down'); this.brakeBtn = true; this.onEdge();
    });
    const bbUp = (ev) => { if (ev.pointerId !== this.brakePid) return; this.brakePid = null; rel(bb, ev.pointerId); bb.classList.remove('down'); this.brakeBtn = false; this.onEdge(); };
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach((t) => bb.addEventListener(t, bbUp));

    // ---- floating stick
    const sz = e.stickZone;
    sz.addEventListener('pointerdown', (ev) => {
      if (!this.active || this.stickPid != null) return; // a second finger in the zone is ignored
      ev.preventDefault();
      this.stickPid = ev.pointerId; capture(sz, ev);
      this.stickOrigin = { x: ev.clientX, y: ev.clientY };
      const b = sz.getBoundingClientRect();
      for (const el of [e.stickBase, e.stickKnob]) { el.style.display = 'block'; el.style.left = `${ev.clientX - b.left}px`; el.style.top = `${ev.clientY - b.top}px`; }
      this.setStick(0);
    });
    sz.addEventListener('pointermove', (ev) => {
      if (ev.pointerId !== this.stickPid || !this.stickOrigin) return;
      const R = 0.11 * Math.min(window.innerWidth, 900);
      const dx = ev.clientX - this.stickOrigin.x;
      const b = sz.getBoundingClientRect();
      e.stickKnob.style.left = `${this.stickOrigin.x - b.left + Math.max(-R, Math.min(R, dx))}px`;
      this.setStick(stickCurve(dx, R));
    });
    const szUp = (ev) => {
      if (ev.pointerId !== this.stickPid) return;
      this.stickPid = null; this.stickOrigin = null; rel(sz, ev.pointerId);
      e.stickBase.style.display = 'none'; e.stickKnob.style.display = 'none';
      this.setStick(0);
    };
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach((t) => sz.addEventListener(t, szUp));

    // ---- stuck-input protection
    const all = () => this.releaseAll();
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') all(); });
    window.addEventListener('blur', all);
    window.addEventListener('pagehide', all);
    window.addEventListener('orientationchange', all);
  }

  setStick(v) {
    if (v === this.stick) return;
    this.stick = v;
    this.onEdge();
  }

  releaseAll(silent) {
    const had = this.region || this.brakeBtn || this.stick || this.rightPid != null || this.stickPid != null;
    this.rightPid = this.stickPid = this.itemPid = this.brakePid = null;
    this.stickOrigin = null;
    this.region = null; this.brakeBtn = false; this.stick = 0;
    const e = this.els;
    e.driftBand.classList.remove('on'); e.gasArea.classList.remove('on'); e.brakeStrip.classList.remove('on');
    e.itemBtn.classList.remove('down'); e.brakeBtn.classList.remove('down');
    e.stickBase.style.display = 'none'; e.stickKnob.style.display = 'none';
    if (had && !silent) this.onEdge();
  }
}
