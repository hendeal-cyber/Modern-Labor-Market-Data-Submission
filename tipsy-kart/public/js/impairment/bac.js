// Drinks -> estimated BAC (display only) and drinks -> gameplay level L
// (spec section 2). Pure functions, no DOM.

export const GRAMS_PER_DRINK = 14;       // US standard drink (NIAAA)
export const DEFAULT_BODY_KG = 75;
export const BETA_PER_HOUR = 0.015;      // %BAC eliminated per hour
export const MAX_DRINKS = 15;
export const MAX_LEVEL = 5;
export const DEFAULT_LIMIT = 0.05;
export const BAC_BAR_MAX = 0.20;
export const REF_RW = 0.62 * 75;         // r*W of the default adult = 46.5

export function clamp(x, lo, hi) { return x < lo ? lo : x > hi ? hi : x; }

export function widmarkR(sex) {
  return sex === 'm' ? 0.68 : sex === 'f' ? 0.55 : 0.62;
}

function bodyKgOf(p) {
  const kg = Number(p && p.bodyKg);
  return Number.isFinite(kg) && kg >= 40 && kg <= 200 ? kg : DEFAULT_BODY_KG;
}

/**
 * Simplified Widmark estimate in g/dL (%), e.g. 0.060.
 * p = {drinks, bodyKg?, sex?, drinkLog?}; now in ms (Date.now() by default).
 * Instant absorption is deliberate (the meter reacts the moment a drink is counted).
 */
export function estimateBAC(p, now = Date.now()) {
  const drinks = Math.max(0, Number(p && p.drinks) || 0);
  if (drinks <= 0) return 0;
  const A = GRAMS_PER_DRINK * drinks;
  const rW = widmarkR(p.sex) * bodyKgOf(p) * 1000;
  const first = p.drinkLog && p.drinkLog.length ? p.drinkLog[0] : now;
  const hours = Math.max(0, (now - first) / 3.6e6);
  return Math.max(0, (A / rW) * 100 - BETA_PER_HOUR * hours);
}

/** Body scale used for the gameplay level: 1.0 when nothing is set, clamped 0.80..1.25. */
export function bodyScale(p) {
  return clamp(REF_RW / (widmarkR(p && p.sex) * bodyKgOf(p)), 0.80, 1.25);
}

/**
 * Gameplay impairment level L in [0, 5]. Driven by drinks (not the noisy BAC)
 * so it stays deterministic. Race-3 floor: 2+ drinks is never below I = 2.
 */
export function levelFor(p, intensity = 1) {
  if (!p || p.water) return 0;
  const drinks = clamp(Math.floor(Number(p.drinks) || 0), 0, MAX_DRINKS);
  let I = drinks * bodyScale(p);
  if (drinks >= 2) I = Math.max(I, 2.0);
  const k = Number.isFinite(Number(intensity)) ? Number(intensity) : 1;
  return clamp(I * k, 0, MAX_LEVEL);
}

export const TIER_LABELS = ['Sober', 'Buzzed', 'Over the limit', 'Wobbly', 'Very wobbly', 'Legless'];

/** Tier index 0..5 from L: 0 Sober, (0,1.5) Buzzed, [1.5,2.5) Over, [2.5,3.5) Wobbly, [3.5,4.5) Very wobbly, 4.5+ Legless. */
export function tierIndex(L) {
  if (!(L > 0)) return 0;
  if (L < 1.5) return 1;
  if (L < 2.5) return 2;
  if (L < 3.5) return 3;
  if (L < 4.5) return 4;
  return 5;
}

export function tierLabel(L) { return TIER_LABELS[tierIndex(L)]; }
