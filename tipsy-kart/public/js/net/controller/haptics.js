// Haptics (phone-controls spec 3.7).
// Android: navigator.vibrate(pattern). iOS has no Vibration API, so every cue also becomes a
// full-screen colour flash, and direct taps on ITEM/DRIFT get Safari's native switch haptic
// through a transparent <input type=checkbox switch> laid over the control (best effort only).

export const PATTERNS = {
  tick: 30, go: [60, 40, 60], bump: 40, boost: [20, 30, 20], item: 15, lap: [40, 60, 40],
  finish: [80, 50, 80, 50, 200], drink: [200, 100, 200], warn: [30, 30, 30, 30, 30],
};

export function isIos() {
  const ua = navigator.userAgent || '';
  return /iP(hone|ad|od)/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

export class Haptics {
  constructor(flashEl, getEnabled) {
    this.flashEl = flashEl;
    this.getEnabled = getEnabled;
    this.timers = [];
  }

  get canVibrate() { return typeof navigator.vibrate === 'function'; }

  /** Call inside the Join tap: gives sticky activation so later vibrations are allowed. */
  prime() { if (this.canVibrate) { try { navigator.vibrate(1); } catch (e) { /* ignore */ } } }

  cue(name) {
    if (!this.getEnabled()) return;
    const p = PATTERNS[name];
    if (p == null) return;
    if (this.canVibrate) { try { navigator.vibrate(p); } catch (e) { /* ignore */ } return; }
    this.flash(Array.isArray(p) ? Math.ceil(p.length / 2) : 1);
  }

  flash(pulses) {
    this.timers.forEach(clearTimeout); this.timers = [];
    const el = this.flashEl;
    for (let i = 0; i < Math.min(3, pulses); i++) {
      this.timers.push(setTimeout(() => {
        el.classList.remove('on'); void el.offsetWidth; el.classList.add('on');
      }, i * 220));
    }
  }

  /** Lay a transparent iOS switch over a control. Taps on the label bubble to the control's own handlers. */
  static attachSwitch(el) {
    const label = document.createElement('label');
    label.className = 'hsw';
    label.setAttribute('aria-hidden', 'true');
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.setAttribute('switch', '');
    input.tabIndex = -1;
    label.appendChild(input);
    el.appendChild(label);
  }
}
