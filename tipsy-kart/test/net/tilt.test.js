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

test('portrait mid-roll (iPhone, no orientation lock) keeps the steer sign; 90<->270 flip mirrors the neutral', async () => {
  const { Tilt, landscapeAngle } = await mod('controller/tilt.js');
  assert.equal(landscapeAngle(0, 90), 90);
  assert.equal(landscapeAngle(180, 270), 270);
  assert.equal(landscapeAngle(-90, 90), 270);
  assert.equal(landscapeAngle(90, 270), 90);

  let angle = 90;
  const t = new Tilt({ maxDeg: 28, invert: false }, { angle: () => angle });
  const ev = (deg) => Object.assign({}, betaGammaFor(deg));
  t.onEvent(ev(0)); t.neutral = 0;
  t.onEvent(ev(35)); t.filtered = t.raw;          // hard right roll
  const before = t.steer();
  assert.equal(before, 1);
  angle = 0;                                       // the OS rotates the page to portrait mid-corner
  t.onEvent(ev(35)); t.filtered = t.raw;
  assert.equal(t.steer(), before, 'still full right in portrait');
  t.onEvent(ev(-35)); t.filtered = t.raw;
  assert.equal(t.steer(), -1, 'and steering the other way still works');
  assert.equal(t.landscape, 90);

  // a genuine flip to 270 (phone turned over): neutral is mirrored, not recalibrated
  angle = 90; t.onEvent(ev(5)); t.neutral = 5; t.filtered = t.raw;
  angle = 270; t.onEvent(ev(0));
  assert.equal(t.landscape, 270);
  assert.equal(t.neutral, -5);
});

test('gamma = +/-90 boundary: the two Euler representations of one pose steer the same', async () => {
  const { steerDegFromOrientation, curve } = await mod('controller/tilt.js');
  for (const b of [10, 30, 60, -20]) {
    for (const g of [89.9, 89.5]) {
      const a = steerDegFromOrientation(b, g, 90);
      const c = steerDegFromOrientation(180 - b, -g, 90); // the same pose after gamma wraps past 90
      assert.ok(Math.abs(a - c) < 0.5, `b=${b} g=${g}: ${a} vs ${c}`);
      assert.equal(curve(a), curve(c));
    }
  }
  // standing upright in the wheel grip (gamma ~ +/-90) is finite and continuous
  assert.ok(Number.isFinite(steerDegFromOrientation(0, 90, 90)));
  assert.ok(Math.abs(steerDegFromOrientation(0, 90, 90) - steerDegFromOrientation(0, -90, 90)) < 1e-6);
});

test('cert cache: SAN IPs are compared exactly', () => {
  const { cachedIsUsable } = require('../../net/cert');
  const { execFileSync } = require('child_process');
  const fs = require('fs'); const os = require('os');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tk-san-'));
  try {
    execFileSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-sha256', '-days', '30', '-subj', '/CN=t',
      '-keyout', path.join(dir, 'k.pem'), '-out', path.join(dir, 'c.pem'), '-addext', 'subjectAltName=IP:10.0.0.12,IP:127.0.0.1'], { stdio: 'ignore' });
    const pem = fs.readFileSync(path.join(dir, 'c.pem'), 'utf8');
    assert.equal(cachedIsUsable(pem, ['10.0.0.12']), true);
    assert.equal(cachedIsUsable(pem, ['10.0.0.1']), false, '10.0.0.1 is not 10.0.0.12');
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
