// Impairment parameter table (spec section 3) and piecewise-linear lookup.
// Every parameter is a lookup on the impairment level L with knots at 0..5.
// L is clamped to [0, 5], so 5+ drinks equals the L=5 column (the cap).
// All L=0 values are neutral/identity values.
//
// Four rows (delayMs, deadzone, steerZeta, wanderFastSd) were retuned from the
// spec's values by the calibration harness; see docs/INTEGRATION-impairment.md.
//
// NOTE: TABLE is deliberately a plain mutable object so the calibration
// harness can experiment with it. Do not mutate it in game code.

export const KNOTS = [0, 1, 2, 3, 4, 5];

export const TABLE = {
  // --- control (input) parameters, section 3.2 ---
  delayMs:          [0, 30, 130, 155, 180, 195],     // spec L3..5: 180, 230, 280 (retuned)
  deadzone:         [0, 0.03, 0.10, 0.12, 0.14, 0.15],   // spec L3..5: 0.14, 0.18, 0.22 (retuned)
  steerGain:        [1.00, 1.03, 1.12, 1.18, 1.24, 1.30],
  steerTn:          [0, 0.033, 0.091, 0.111, 0.133, 0.154],
  steerZeta:        [1.00, 0.80, 0.50, 0.40, 0.33, 0.28],   // spec L3..5: 0.42, 0.36, 0.32 (retuned)
  wanderFastSd:     [0, 0.03, 0.14, 0.145, 0.15, 0.15],   // spec L2..5: 0.10, 0.14, 0.18, 0.22 (retuned)
  wanderSlowSd:     [0, 0.02, 0.06, 0.08, 0.10, 0.12],
  leanBias:         [0, 0.005, 0.012, 0.018, 0.024, 0.030],
  pedalTau:         [0, 0.03, 0.15, 0.22, 0.30, 0.38],
  throttleWobbleSd: [0, 0, 0.06, 0.09, 0.12, 0.15],
  missEdgeP:        [0, 0, 0.08, 0.12, 0.16, 0.20],
  itemExtraMs:      [0, 0, 60, 100, 140, 180],
  driftHoldMs:      [0, 0, 90, 140, 190, 240],
  hiccupPerMin:     [0, 0, 0.6, 0.9, 1.2, 1.5],
  lapsePerMin:      [0, 0, 0, 0.8, 1.5, 2.2],
  lapseDurS:        [0, 0, 0, 0.40, 0.50, 0.60],
  invertPerMin:     [0, 0, 0, 0, 0.5, 0.9],
  invertDurS:       [0, 0, 0, 0, 0.70, 0.85],
  // --- visual parameters, section 3.3 (pixel values are for 1080 px tall) ---
  blurPx:           [0, 0.4, 1.2, 1.8, 2.4, 3.0],
  doubleVision:     [0, 0, 0.30, 0.45, 0.60, 0.75],
  swayDeg:          [0, 0.6, 1.8, 2.6, 3.4, 4.2],
  tunnel:           [0, 0.05, 0.22, 0.32, 0.42, 0.52],
  hueShift:         [0, 0, 8, 12, 16, 20],
  camLagS:          [0, 0.03, 0.10, 0.14, 0.18, 0.22],
  fovWobbleDeg:     [0, 0, 1.5, 2.5, 3.5, 4.5],
  saturate:         [1, 1.02, 1.12, 1.18, 1.24, 1.30],
};

export const PARAM_KEYS = Object.keys(TABLE);

/** Parameters that must be non-increasing in L (everything else is non-decreasing). */
export const DECREASING = new Set(['steerZeta']);

/** Hard caps (spec section 3.4). Tuning may never exceed them. */
export const CAPS = {
  delayMs: 300,
  steerNoise: 0.26,       // sqrt(fast^2 + slow^2)
  deadzone: 0.25,
  missEdgeP: 0.20,
  lapsePerMin: 2.5,
  lapseMaxS: 0.7,         // lapseDurS + 0.1 jitter
  invertPerMin: 1.0,
  invertMaxS: 1.0,        // invertDurS + 0.15 jitter
  blurPx: 3.0,
  tunnel: 0.55,
  ghostAlpha: 0.40,       // 0.5 * doubleVision
  swayDeg: 4.5,
  camLagS: 0.25,
};

export const LAPSE_JITTER_S = 0.1;
export const INVERT_JITTER_S = 0.15;

/** Combined steady-state steer noise (fast and slow OU are independent). */
export function steerNoise(P) {
  return Math.sqrt(P.wanderFastSd * P.wanderFastSd + P.wanderSlowSd * P.wanderSlowSd);
}

/** Piecewise-linear lookup of every parameter at level L (clamped to [0, 5]). */
export function paramsAt(L) {
  let x = Number(L);
  if (!(x > 0)) x = 0;        // also catches NaN
  if (x > 5) x = 5;
  const i = Math.min(4, Math.floor(x));
  const f = x - i;
  const out = {};
  for (const k of PARAM_KEYS) {
    const row = TABLE[k];
    out[k] = row[i] + (row[i + 1] - row[i]) * f;
  }
  return out;
}
