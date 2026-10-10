// Seeded randomness for the impairment model (spec section 5.1 / 5.2).
// Pure ES module, no DOM, no dependencies.

/** xmur3-style string hash -> uint32. */
export function hash32(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return ((h ^= h >>> 16) >>> 0);
}

/** mulberry32 PRNG: returns a function producing floats in [0, 1). */
export function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Standard normal sample (Box-Muller). */
export function gauss(rng) {
  let u = 0;
  while (u === 0) u = rng();
  const v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/**
 * Independent streams per (session seed, slot, race) so that changing one
 * feature never reshuffles another. `persona` is stable across races.
 */
export function slotStreams(sessionSeed, slot, raceIndex) {
  const race = hash32(`tipsy:${sessionSeed}:${slot}:${raceIndex}`);
  const who = hash32(`tipsy-persona:${sessionSeed}:${slot}`);
  return {
    wander: mulberry32(race ^ 0xA5A5A5A5),
    events: mulberry32(race ^ 0x5BD1E995),
    buttons: mulberry32(race ^ 0x27D4EB2F),
    persona: mulberry32(who),
  };
}

/** Ornstein-Uhlenbeck process with exact (frame-rate independent) discretisation. */
export class OU {
  constructor() { this.x = 0; }
  step(dt, sd, tau, rng, mean = 0) {
    if (!(sd > 0)) {
      this.x += (mean - this.x) * (1 - Math.exp(-dt / tau));
      return this.x;
    }
    const a = Math.exp(-dt / tau);
    this.x = mean + (this.x - mean) * a + sd * Math.sqrt(1 - a * a) * gauss(rng);
    return this.x;
  }
  reset() { this.x = 0; }
}
