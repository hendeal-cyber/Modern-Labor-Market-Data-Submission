// Keyboard fallback for testing without phones.
//   slot 0: WASD + Space (drift) + E (item)
//   slot 1: arrows + Shift (drift) + Enter (item)
const MAPS = [
  { left: ['KeyA'], right: ['KeyD'], up: ['KeyW'], down: ['KeyS'], drift: ['Space'], item: ['KeyE'] },
  { left: ['ArrowLeft'], right: ['ArrowRight'], up: ['ArrowUp'], down: ['ArrowDown'], drift: ['ShiftRight', 'ShiftLeft'], item: ['Enter', 'NumpadEnter'] },
];
const ALL = new Set(MAPS.flatMap((m) => Object.values(m).flat()));

export class Keyboard {
  constructor() {
    this.down = new Set();
    this.lastActive = [-Infinity, -Infinity];
    window.addEventListener('keydown', (e) => {
      if (e.target && /input|select|textarea/i.test(e.target.tagName)) return;
      if (ALL.has(e.code)) {
        this.down.add(e.code);
        this.touch(e.code);
        if (e.code.startsWith('Arrow') || e.code === 'Space') e.preventDefault();
      }
    });
    window.addEventListener('keyup', (e) => { this.down.delete(e.code); });
    window.addEventListener('blur', () => this.down.clear());
  }

  touch(code) {
    MAPS.forEach((m, i) => { if (Object.values(m).flat().includes(code)) this.lastActive[i] = performance.now(); });
  }

  any(codes) { return codes.some((c) => this.down.has(c)); }

  /** Returns input for slot 0/1 if any of its keys is held, else null. */
  inputFor(slot) {
    const m = MAPS[slot];
    if (!m) return null;
    const active = Object.values(m).flat().some((c) => this.down.has(c));
    if (!active) return null;
    return {
      steer: (this.any(m.right) ? 1 : 0) - (this.any(m.left) ? 1 : 0),
      throttle: this.any(m.up) ? 1 : 0,
      brake: this.any(m.down) ? 1 : 0,
      drift: this.any(m.drift),
      useItem: this.any(m.item),
    };
  }
}
