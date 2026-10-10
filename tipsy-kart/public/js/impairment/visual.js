// Visual effects function (spec section 5.4). Pure, no DOM.
// Returns the contract fields {blurPx, swayDeg, doubleVision, tunnel, hueShift}
// plus the proposed extras {camLagS, fovWobbleDeg, saturate, ghostDx, ghostDy,
// zoom, blink, joltPx}. Pixel values are for a 1080 px tall viewport unless a
// real viewport `vp = {w, h}` is passed (then they are already scaled).

import { paramsAt } from './params.js';

const TAU = 2 * Math.PI;

export const REFERENCE_VIEWPORT = Object.freeze({ w: 1920, h: 1080 });

export function neutralFx() {
  return {
    blurPx: 0, swayDeg: 0, doubleVision: 0, tunnel: 0, hueShift: 0,
    camLagS: 0, fovWobbleDeg: 0, saturate: 1, ghostDx: 0, ghostDy: 0,
    zoom: 1, blink: 0, joltPx: 0,
  };
}

/** 0..1 eyelid envelope with 80 ms ramps at both edges of the lapse window. */
export function lapseEnvelope(st) {
  if (!(st.lapseUntil > st.lapseStart) || st.t >= st.lapseUntil || st.t < st.lapseStart) return 0;
  const a = (st.t - st.lapseStart) / 0.08;
  const b = (st.lapseUntil - st.t) / 0.08;
  return Math.max(0, Math.min(1, a, b));
}

/** 1 -> 0 over 250 ms after a hiccup. */
export function hiccupEnvelope(st) {
  if (st.hicStart < 0) return 0;
  const u = (st.t - st.hicStart) / 0.25;
  return u < 0 || u > 1 ? 0 : 1 - u;
}

/**
 * st needs: Ls, phases[8], t, lapseStart, lapseUntil, hicStart.
 * t is wall-clock seconds (used only for the slow oscillators).
 */
export function computeVisualFx(st, t, vp = REFERENCE_VIEWPORT, settings = {}) {
  const L = st.Ls;
  if (!(L > 1e-3)) return neutralFx();
  const P = paramsAt(L);
  const ph = st.phases || [0, 0, 0, 0, 0, 0, 0, 0];
  const sc = vp.h / 1080;
  const comfort = settings.comfortVisuals ? 0.5 : 1;
  const sway = comfort * P.swayDeg * (0.65 * Math.sin(TAU * t / 5.3 + ph[0]) + 0.35 * Math.sin(TAU * t / 2.3 + ph[1]));
  const blink = lapseEnvelope(st);
  const dv = P.doubleVision;
  const gs = comfort; // ghost oscillation slowed in comfort mode
  const th = Math.abs(sway) * Math.PI / 180;
  const aspect = Math.max(vp.w / vp.h, vp.h / vp.w);
  return {
    blurPx: P.blurPx * sc * (0.8 + 0.2 * Math.sin(TAU * t / 3.7 + ph[2])),
    swayDeg: sway,
    doubleVision: dv,
    tunnel: Math.max(P.tunnel, 0.92 * blink),
    hueShift: P.hueShift * Math.sin(TAU * t / 11 + ph[3]),
    camLagS: comfort * P.camLagS,
    fovWobbleDeg: comfort * P.fovWobbleDeg * Math.sin(TAU * t / 6.3 + ph[4]),
    saturate: P.saturate,
    ghostDx: dv * 0.018 * vp.w * (0.6 + 0.4 * Math.sin(gs * TAU * t / 5.9 + ph[5])),
    ghostDy: dv * 0.005 * vp.h * Math.sin(gs * TAU * t / 7.7 + ph[6]),
    zoom: Math.cos(th) + aspect * Math.sin(th),
    blink,
    joltPx: 6 * sc * hiccupEnvelope(st),
  };
}
