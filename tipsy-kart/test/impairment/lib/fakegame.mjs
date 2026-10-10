// Minimal stand-in for the engine's `window.game`, per the architecture contract.

export function makeFakeGame({ players = 4, seed = 12345, drinks = 0, settings } = {}) {
  const handlers = new Map();
  const game = {
    inputFilters: [null, null, null, null],
    visualFx: [null, null, null, null],
    session: {
      raceIndex: 0,
      totalRaces: 4,
      seed,
      settings: Object.assign({ intensity: 1, comfortVisuals: false, limitLine: 0.05 }, settings),
      players: Array.from({ length: players }, (_, i) => ({
        slot: i, name: `P${i + 1}`, color: '#fff', connected: true, racesCompleted: 0,
        drinks: Array.isArray(drinks) ? drinks[i] : drinks,
      })),
    },
    on(evt, cb) {
      if (!handlers.has(evt)) handlers.set(evt, []);
      handlers.get(evt).push(cb);
    },
    fire(evt, payload) {
      for (const cb of handlers.get(evt) || []) cb(payload);
    },
  };
  return game;
}

/** Deterministic tiny PRNG for tests (independent of the module under test). */
export function lcg(seed = 1) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export function randomInput(r) {
  return {
    steer: r() * 2 - 1,
    throttle: r(),
    brake: r() < 0.2 ? r() : 0,
    drift: r() < 0.3,
    useItem: r() < 0.1,
  };
}

export const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;
export const sd = (a) => { const m = mean(a); return Math.sqrt(mean(a.map((x) => (x - m) ** 2))); };
