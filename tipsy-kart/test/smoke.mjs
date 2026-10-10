// Tipsy Kart smoke test (Playwright, headless Chromium).
// Usage: npm test   (or: node test/smoke.mjs)
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const require = createRequire(import.meta.url);
const here = path.dirname(fileURLToPath(import.meta.url));
const shots = path.join(here, 'screenshots');
fs.mkdirSync(shots, { recursive: true });

function findChromium() {
  const cands = [process.env.CHROMIUM_PATH, '/opt/pw-browsers/chromium'];
  try {
    for (const d of fs.readdirSync('/opt/pw-browsers')) {
      if (d.startsWith('chromium-')) cands.push(path.join('/opt/pw-browsers', d, 'chrome-linux', 'chrome'));
    }
  } catch (e) { /* no /opt/pw-browsers */ }
  return cands.find((p) => p && fs.existsSync(p));
}

let failures = 0;
const check = (ok, msg) => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${msg}`);
  if (!ok) failures++;
};

const { start } = require('../server.js');
const srv = await start({ port: 0, host: '127.0.0.1', quiet: true });
const base = `http://127.0.0.1:${srv.port}`;
console.log('server on', base);

const launchOpts = {
  headless: true,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'],
};
let browser;
try {
  browser = await chromium.launch(launchOpts);
} catch (e) {
  const exe = findChromium();
  if (!exe) throw new Error('No Chromium found (set CHROMIUM_PATH)');
  browser = await chromium.launch({ ...launchOpts, executablePath: exe });
}

const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('requestfailed', (r) => errors.push('requestfailed: ' + r.url()));

const state = () => page.evaluate(() => window.game.getState());
// Wait for simulated (not wall-clock) time so slow software-GL machines still pass.
const waitSim = async (seconds, ms = 120000) => {
  const t0 = await page.evaluate(() => window.game.simTime);
  await page.waitForFunction((t) => window.game.simTime >= t, t0 + seconds, { timeout: ms, polling: 100 });
};
const waitPhase = async (phase, ms = 60000) => {
  await page.waitForFunction((p) => window.game.getState().phase === p, phase, { timeout: ms, polling: 100 });
};

try {
  // 1. host page + API
  const res = await page.goto(base + '/');
  check(res.ok(), 'GET / responds 200');
  await page.waitForFunction(() => window.game && window.game.ready === true, null, { timeout: 15000 });
  check(true, 'window.game is ready');
  const ctl = await page.request.get(base + '/controller');
  check(ctl.ok() && (await ctl.text()).includes('<html'), 'GET /controller serves the controller page');
  const api = await page.evaluate(() => ['setPlayerInput', 'addPlayer', 'removePlayer', 'startCup', 'nextRace', 'getState', 'on', 'emit', 'debugFinishRace']
    .filter((f) => typeof window.game[f] !== 'function'));
  check(api.length === 0, 'contract functions exist' + (api.length ? ' (missing ' + api.join(',') + ')' : ''));
  check(await page.evaluate(() => window.game.inputFilters.length === 4 && window.game.visualFx.length === 4), 'inputFilters / visualFx have 4 entries');
  check(await page.locator('#join-qr').count() === 1, '#join-qr placeholder exists');
  check((await page.locator('.disclaimer').textContent()).includes('Never drink and drive'), 'title screen shows the disclaimer');

  // event recorder
  await page.evaluate(() => {
    window.__ev = { playerJoined: [], playerLeft: [], raceStart: [], raceFinished: [], cupFinished: [], stateChanged: 0 };
    for (const k of ['playerJoined', 'playerLeft', 'raceStart', 'raceFinished', 'cupFinished']) window.game.on(k, (p) => window.__ev[k].push(p));
    window.game.on('stateChanged', () => { window.__ev.stateChanged++; });
    window.__hap = [];
    for (const k of ['hit', 'boost', 'itemUsed', 'itemGot', 'lap', 'finish']) window.game.on(k, (p) => window.__hap.push({ evt: k, ...p }));
  });

  // 2. add players (2 through the lobby button, 1 through the hub API)
  await page.click('#btn-add-test');
  await page.click('#btn-add-test');
  await page.evaluate(() => window.game.addPlayer({ slot: 2, name: 'Phone Pal', color: '#ff4fd8' }));
  let st = await state();
  check(st.players.length === 3, `3 players joined (got ${st.players.length})`);
  check((await page.evaluate(() => window.__ev.playerJoined.length)) === 3, 'playerJoined fired 3 times');
  await page.screenshot({ path: path.join(shots, '01-lobby.png') });

  // impairment seams: record filter calls, set a visual effect on slot 1
  await page.evaluate(() => {
    window.__filter = { calls: 0, slots: new Set(), ctxKeys: null };
    for (let s = 0; s < 4; s++) {
      window.game.inputFilters[s] = (input, dt, ctx) => {
        window.__filter.calls++;
        window.__filter.slots.add(ctx.slot);
        window.__filter.ctxKeys = Object.keys(ctx).sort().join(',');
        return input;
      };
    }
    window.game.visualFx[1] = () => ({ blurPx: 1.5, swayDeg: 3, doubleVision: 0.6, tunnel: 0.5, hueShift: 20, saturate: 1.4, blink: 0.1 });
  });

  // 3. start the cup from the lobby button
  await page.click('#btn-start');
  await page.waitForFunction(() => window.__ev.raceStart.length === 1, null, { timeout: 10000 });
  check(true, 'raceStart fired');
  st = await state();
  check(st.positions.length === 8, `grid filled to 8 karts (got ${st.positions.length})`);
  check(await page.locator('.vp-canvas').count() === 3, '3 player viewports rendered');
  await waitPhase('racing');
  check(true, 'countdown finished, phase is racing');

  const startPos = Object.fromEntries((await state()).positions.map((p) => [p.id, p]));
  // 4. drive slot 0 with setPlayerInput
  await page.evaluate(() => window.game.setPlayerInput(0, { steer: 0, throttle: 1, brake: 0, drift: false, useItem: false }));
  await waitSim(2.5);
  st = await state();
  const p0 = st.positions.find((p) => p.slot === 0);
  const p0s = startPos[p0.id];
  const moved = Math.hypot(p0.x - p0s.x, p0.z - p0s.z);
  check(moved > 5, `slot 0 kart moved under throttle (${moved.toFixed(1)} units)`);
  check(p0.progress > p0s.progress + 5, `slot 0 lap progress increased (${p0s.progress} -> ${p0.progress})`);

  // autopilot for longer driving (input still flows through the filter)
  await page.evaluate(() => window.game.debug.autopilot(0, true));
  const before = p0.progress;
  await waitSim(4);
  st = await state();
  const p0b = st.positions.find((p) => p.slot === 0);
  check(p0b.progress > before + 20, `slot 0 keeps progressing around the track (${before} -> ${p0b.progress})`);

  // 5. CPU karts move
  const cpus = st.positions.filter((p) => !p.isHuman);
  const cpuMoved = cpus.filter((c) => Math.hypot(c.x - startPos[c.id].x, c.z - startPos[c.id].z) > 10).length;
  check(cpuMoved === cpus.length, `all CPU karts moved (${cpuMoved}/${cpus.length})`);

  // seams
  const f = await page.evaluate(() => ({ calls: window.__filter.calls, slots: [...window.__filter.slots], keys: window.__filter.ctxKeys }));
  check(f.calls > 100, `input filters called every physics step (${f.calls} calls)`);
  check(f.slots.every((s) => s >= 0 && s <= 2), `filters only ran for human slots (${f.slots.join(',')})`);
  check(['drinks', 'kartState', 'raceIndex', 'slot', 'speed', 'time'].every((k) => f.keys.split(',').includes(k)), `filter ctx has ${f.keys}`);
  const css = await page.evaluate(() => document.querySelector('.vp[data-slot="1"] canvas').style.filter);
  check(css.includes('blur') && css.includes('hue-rotate'), `visualFx applied to slot 1 canvas only (${css})`);
  const css0 = await page.evaluate(() => document.querySelector('.vp[data-slot="0"] canvas').style.filter);
  check(!css0 || css0 === 'none', 'slot 0 canvas unaffected');
  check(st.hud.length === 3 && st.hud.every((h) => 'place' in h && 'lap' in h && 'totalLaps' in h && 'item' in h && 'finished' in h && 'speed' in h), 'getState().hud has per-slot HUD data');

  // useItem edge trigger
  const itemRes = await page.evaluate(async () => {
    const g = window.game;
    g.debug.autopilot(1, false);
    const k = g.race.karts.find((kk) => kk.slot === 1);
    k.item = 'fizz';
    g.setPlayerInput(1, { throttle: 1, useItem: true });
    await new Promise((r) => setTimeout(r, 300));
    const used = k.item === null;
    k.item = 'bubble';
    g.setPlayerInput(1, { throttle: 1, useItem: true }); // still held: no new edge
    await new Promise((r) => setTimeout(r, 300));
    const heldIgnored = k.item === 'bubble';
    g.setPlayerInput(1, { throttle: 1, useItem: false });
    g.setPlayerInput(1, { throttle: 1, useItem: true });
    await new Promise((r) => setTimeout(r, 300));
    return { used, heldIgnored, usedAgain: k.item === null && k.shieldTime > 0 };
  });
  check(itemRes.used && itemRes.heldIgnored && itemRes.usedAgain, `useItem is edge-triggered ${JSON.stringify(itemRes)}`);
  const hap = await page.evaluate(() => window.__hap);
  check(hap.some((h) => h.evt === 'itemUsed' && h.slot === 1 && h.item === 'fizz'), 'itemUsed {slot, item} emitted');
  check(hap.some((h) => h.evt === 'boost' && h.slot === 1 && h.tier === 0), 'boost {slot, tier} emitted');
  check(hap.every((h) => Number.isInteger(h.slot) && h.slot >= 0 && h.slot <= 2), `haptic events only for human slots (${hap.length} events: ${[...new Set(hap.map((h) => h.evt))].join(',')})`);

  const fps = await page.evaluate(() => new Promise((r) => { let n = 0; const t0 = performance.now(); const f = () => { n++; if (performance.now() - t0 < 2000) requestAnimationFrame(f); else r(n / ((performance.now() - t0) / 1000)); }; requestAnimationFrame(f); }));
  console.log(`info  headless software-GL frame rate with 3 viewports: ${fps.toFixed(1)} fps`);
  await page.screenshot({ path: path.join(shots, '02-race-3p.png') });

  // 7. fast-forward the finish
  const rc0 = (await state()).players.map((p) => p.racesCompleted);
  const results = await page.evaluate(() => window.game.debugFinishRace());
  check(Array.isArray(results) && results.length === 8, 'debugFinishRace returned 8 results');
  check((await page.evaluate(() => window.__ev.raceFinished.length)) === 1, 'raceFinished fired');
  st = await state();
  check(st.phase === 'raceResults', 'phase is raceResults');
  check(st.players.every((p, i) => p.racesCompleted === rc0[i] + 1), 'racesCompleted incremented for every human');
  check(results[0].points === 15 && results[7].points === 1, 'points 15..1 awarded');
  await page.screenshot({ path: path.join(shots, '03-results.png') });

  // remaining races: look at each track, then finish
  for (let r = 1; r < st.totalRaces; r++) {
    await page.click('#btn-next');
    await waitPhase('racing');
    await page.evaluate(() => { for (let s = 0; s < 3; s++) window.game.debug.autopilot(s, true); });
    await waitSim(2);
    await page.screenshot({ path: path.join(shots, `04-race${r + 1}.png`) });
    await page.evaluate(() => window.game.debugFinishRace());
  }
  await page.click('#btn-next');
  await waitPhase('cupResults', 10000);
  const cup = await page.evaluate(() => window.__ev.cupFinished[0]);
  check(Array.isArray(cup) && cup.length === 8 && cup[0].rank === 1, 'cupFinished fired with standings');
  await page.screenshot({ path: path.join(shots, '05-standings.png') });

  // 4-player split + single player
  await page.click('#btn-lobby');
  await waitPhase('lobby', 5000);
  await page.click('#btn-add-test');
  check((await state()).players.length === 4, '4th player added');
  await page.evaluate(() => window.game.startCup({ races: 1, laps: 1 }));
  await waitPhase('racing');
  await page.evaluate(() => { for (let s = 0; s < 4; s++) window.game.debug.autopilot(s, true); });
  await waitSim(2);
  check(await page.locator('.vp-canvas').count() === 4, '4 player viewports rendered');
  await page.screenshot({ path: path.join(shots, '06-race-4p.png') });
  await page.evaluate(() => window.game.debugFinishRace());
  await page.evaluate(() => { window.game.nextRace(); window.game.nextRace(); });
  await waitPhase('lobby', 5000);
  await page.evaluate(() => { [1, 2, 3].forEach((s) => window.game.removePlayer(s)); });
  check((await page.evaluate(() => window.__ev.playerLeft.length)) === 3, 'playerLeft fired');
  await page.evaluate(() => window.game.startCup({ races: 1, laps: 3 }));
  await waitPhase('racing');
  await page.evaluate(() => window.game.debug.autopilot(0, true));
  await waitSim(3);
  await page.screenshot({ path: path.join(shots, '07-race-1p.png') });
  await page.evaluate(() => window.game.debugFinishRace());

  // 6. console must be clean
  check(errors.length === 0, `zero console errors${errors.length ? ':\n  ' + errors.join('\n  ') : ''}`);
} catch (e) {
  failures++;
  console.log('FAIL  exception: ' + (e && e.stack ? e.stack : e));
  if (errors.length) console.log('console errors:\n  ' + errors.join('\n  '));
  try { await page.screenshot({ path: path.join(shots, 'zz-failure.png') }); } catch (err) { /* ignore */ }
} finally {
  await browser.close();
  await srv.close();
}

console.log(failures ? `\n${failures} check(s) failed` : '\nAll smoke checks passed');
process.exit(failures ? 1 : 0);
