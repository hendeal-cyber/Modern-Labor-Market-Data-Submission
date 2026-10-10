'use strict';
// Unit tests for the pure steering math in public/js/net/controller/tilt.js and the host
// phase mapping / QR URL helpers (ES modules, loaded with dynamic import).

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const { pathToFileURL } = require('url');

const mod = (p) => import(pathToFileURL(path.join(__dirname, '..', '..', 'public', 'js', 'net', p)).href);

// Inverse of the controller math (spec 6.2): (beta, gamma) for a wheel-grip roll delta, landscape-90.
function betaGammaFor(deltaDeg, tiltBackDeg = 30) {
  const d = deltaDeg * Math.PI / 180; const t = tiltBackDeg * Math.PI / 180;
  const sr = [0, -1, 0]; const su = [1, 0, 0]; const z = [0, 0, 1];
  const up = [0, 1, 2].map((i) => Math.cos(t) * (-Math.sin(d) * sr[i] + Math.cos(d) * su[i]) + Math.sin(t) * z[i]);
  return { beta: Math.asin(up[1]) * 180 / Math.PI, gamma: Math.atan2(-up[0], up[2]) * 180 / Math.PI };
}

test('roll angle from orientation matches the spec worked example', async () => {
  const { steerDegFromOrientation } = await mod('controller/tilt.js');
  const { beta, gamma } = betaGammaFor(20);
  assert.ok(Math.abs(beta - 17.2) < 0.1, `beta ${beta}`);
  assert.ok(Math.abs(gamma + 58.4) < 0.2, `gamma ${gamma}`);
  const raw = steerDegFromOrientation(beta, gamma, 90);
  assert.ok(Math.abs(raw - 17.23) < 0.05, `raw ${raw}`);
  // expected raw = asin(cos(t) * sin(d))
  for (const d of [-40, -10, 0, 5, 25]) {
    const g = betaGammaFor(d);
    const want = Math.asin(Math.cos(Math.PI / 6) * Math.sin(d * Math.PI / 180)) * 180 / Math.PI;
    assert.ok(Math.abs(steerDegFromOrientation(g.beta, g.gamma, 90) - want) < 0.01);
  }
});

test('screen angle 270 mirrors 90, and 0 / 180 use the device x axis', async () => {
  const { steerDegFromOrientation } = await mod('controller/tilt.js');
  const { beta, gamma } = betaGammaFor(20);
  assert.ok(Math.abs(steerDegFromOrientation(beta, gamma, 90) + steerDegFromOrientation(beta, gamma, 270)) < 1e-9);
  assert.ok(Math.abs(steerDegFromOrientation(0, 30, 0) + steerDegFromOrientation(0, 30, 180)) < 1e-9);
  assert.ok(Math.abs(steerDegFromOrientation(0, 30, -90) - steerDegFromOrientation(0, 30, 270)) < 1e-9, 'negative angles normalise');
});

test('curve: 3 deg deadzone, 28 deg full lock, 1.5 power, invert, rounding', async () => {
  const { curve } = await mod('controller/tilt.js');
  assert.equal(curve(17.23), 0.43);
  assert.equal(curve(-17.23), -0.43);
  assert.equal(curve(2), 0);
  assert.equal(curve(-3), 0);
  assert.equal(curve(28), 1);
  assert.equal(curve(60), 1);
  assert.equal(curve(-60), -1);
  assert.equal(curve(17.23, { invert: true }), -0.43);
  assert.ok(curve(17.23, { maxDeg: 45 }) < curve(17.23, { maxDeg: 15 }), 'sensitivity slider');
  assert.ok(Object.is(curve(0), 0), 'no negative zero');
});

test('touch stick curve: 8% deadzone, clamp, 1.3 power', async () => {
  const { stickCurve } = await mod('controller/tilt.js');
  assert.equal(stickCurve(0, 100), 0);
  assert.equal(stickCurve(7, 100), 0);
  assert.equal(stickCurve(100, 100), 1);
  assert.equal(stickCurve(-250, 100), -1);
  const half = stickCurve(54, 100); // (0.54-0.08)/0.92 = 0.5 -> 0.5^1.3 = 0.41
  assert.equal(half, 0.41);
});

test('host phase mapping covers the engine phases', async () => {
  const { mapPhase } = await mod('net-host.js');
  assert.equal(mapPhase('lobby'), 'lobby');
  assert.equal(mapPhase('countdown'), 'countdown');
  assert.equal(mapPhase('racing'), 'racing');
  assert.equal(mapPhase('raceResults'), 'results');
  assert.equal(mapPhase('cupResults'), 'cupResults');
  assert.equal(mapPhase('finished'), 'finished');
  assert.equal(mapPhase(undefined), null);
});

test('join URLs cycle through the ranked addresses', async () => {
  const { urlsFor } = await mod('join-qr.js');
  const info = { ips: ['192.168.1.23', '10.0.0.5'], httpPort: 3000, httpsPort: 3443, joinMode: 'https' };
  assert.equal(urlsFor(info, 0).join, 'https://192.168.1.23:3443/controller');
  assert.equal(urlsFor(info, 1).join, 'https://10.0.0.5:3443/controller');
  assert.equal(urlsFor(info, 2).ip, '192.168.1.23');
  assert.equal(urlsFor(Object.assign({}, info, { joinMode: 'http' }), 0).join, 'http://192.168.1.23:3000/controller');
  assert.equal(urlsFor(Object.assign({}, info, { httpsPort: null }), 0).join, 'http://192.168.1.23:3000/controller');
});
