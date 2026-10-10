// Impairment end-to-end check against the REAL game in headless Chromium.
//   node tipsy-kart/test/impairment/e2e-browser.mjs        (needs `npm install` for playwright-core)
//   E2E=1 node --test tipsy-kart/test/impairment/          (same, as an opt-in test via e2e.test.mjs)
//
// 4 test players + CPUs. Races at drinks 0, 2 and 5 (set before each race).
// Checks: the plugin auto-installs; human filters change the input at 2 and 5
// drinks and are identity at 0; filters are only ever called for human slots;
// CPU karts drive with exactly their AI output; visual effects appear in the
// DOM; raceFinished awards a drink. Screenshots go to test/screenshots/impairment-*.png.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..', '..');
const shots = path.join(root, 'test', 'screenshots');

function findChromium() {
  const cands = [process.env.CHROMIUM_PATH, '/opt/pw-browsers/chromium'];
  try {
    for (const d of fs.readdirSync('/opt/pw-browsers')) {
      if (d.startsWith('chromium-')) cands.push(path.join('/opt/pw-browsers', d, 'chrome-linux', 'chrome'));
    }
  } catch (e) { /* none */ }
  return cands.find((p) => p && fs.existsSync(p));
}

export async function runE2E({ log = console.log } = {}) {
  const { chromium } = await import('playwright-core');
  fs.mkdirSync(shots, { recursive: true });
  const results = [];
  const check = (ok, msg) => { results.push({ ok: !!ok, msg }); log(`${ok ? 'PASS' : 'FAIL'}  ${msg}`); };
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const { start } = require(path.join(root, 'server.js'));
  const srv = await start({ port: 0, host: '127.0.0.1', quiet: true });
  const base = `http://127.0.0.1:${srv.port}`;
  const launchOpts = {
    headless: true,
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'],
  };
  let browser;
  try { browser = await chromium.launch(launchOpts); } catch (e) {
    const exe = findChromium();
    if (!exe) throw new Error('No Chromium found (set CHROMIUM_PATH)');
    browser = await chromium.launch({ ...launchOpts, executablePath: exe });
  }
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));

  try {
    await page.goto(base + '/');
    await page.waitForFunction(() => window.game && window.game.ready === true, null, { timeout: 20000 });
    await page.waitForFunction(() => !!(window.game.impairment && window.game.__impairmentInstalled), null, { timeout: 20000 });
    check(true, 'impairment plugin auto-installed on window.game');
    const info = await page.evaluate(() => fetch('/api/info').then((r) => r.json()));
    check(info.plugins.includes('js/impairment/index.js'), 'server lists js/impairment/index.js as a plugin');
    check(await page.evaluate(() => [0, 1, 2, 3].every((s) => window.game.inputFilters[s] === window.game.impairment.filters[s].filter)),
      'inputFilters[0..3] are the impairment filters');
    check(await page.evaluate(() => !!document.querySelector('button[title="Impairment settings"]')), 'host settings button injected');

    // 4 players; spies on filters (slots called, raw vs out) installed once.
    await page.evaluate(() => {
      const g = window.game;
      for (let i = 0; i < 4; i++) g.addTestPlayer();
      window.__spy = { calls: [0, 0, 0, 0], other: 0, changed: [0, 0, 0, 0], same: [0, 0, 0, 0], events: [] };
      g.impairment.on('event', (e) => window.__spy.events.push(e));
      const orig = g.inputFilters.slice();
      for (let s = 0; s < 4; s++) {
        g.inputFilters[s] = (raw, dt, ctx) => {
          const snapshot = { ...raw };
          const out = orig[s](raw, dt, ctx);
          if (ctx.slot !== s) window.__spy.other++;
          window.__spy.calls[s]++;
          const diff = ['steer', 'throttle', 'brake', 'drift', 'useItem'].some((k) => out[k] !== snapshot[k]);
          if (diff) window.__spy.changed[s]++; else window.__spy.same[s]++;
          return out;
        };
      }
    });
    check(await page.evaluate(() => window.game.session.players.length === 4), '4 test players joined');

    const levels = [0, 2, 5];
    const levelStats = [];
    for (let r = 0; r < levels.length; r++) {
      const target = levels[r];
      // set every human to the target drink count before the race starts
      await page.evaluate((t) => {
        const g = window.game;
        for (const p of g.session.players) g.impairment.adjustDrinks(p.slot, t - p.drinks);
      }, target);
      if (r === 0) await page.evaluate(() => window.game.startCup({ races: 3, laps: 3 }));
      else await page.evaluate(() => window.game.nextRace());
      await page.waitForFunction(() => window.game.race && window.game.phase !== 'raceResults', null, { timeout: 20000 });
      await page.evaluate(() => {
        const g = window.game;
        for (let s = 0; s < 4; s++) g.debug.autopilot(s, true);
        const sp = window.__spy;
        sp.calls = [0, 0, 0, 0]; sp.changed = [0, 0, 0, 0]; sp.same = [0, 0, 0, 0]; sp.other = 0;
        // CPU check: wrap each CPU kart's step and its AI's update; the input
        // the kart receives must be exactly what its AI produced.
        sp.cpu = { frames: 0, mismatches: 0, karts: 0 };
        for (const k of g.race.karts) {
          if (k.isHuman) continue;
          sp.cpu.karts++;
          const ai = g.ais.get(k);
          const upd = ai.update.bind(ai);
          let last = null;
          ai.update = (...a) => { last = upd(...a); return last; };
          const step = k.step.bind(k);
          k.step = (dt, input, ...rest) => {
            sp.cpu.frames++;
            if (input !== last) sp.cpu.mismatches++;
            return step(dt, input, ...rest);
          };
        }
      });
      // countdown + some real racing (software rendering is slow, so wait on sim progress, not wall time)
      await page.waitForFunction(() => {
        const g = window.game;
        return g.race && g.race.phase === 'racing' && g.race.karts.filter((k) => k.isHuman).every((k) => k.progress > 40);
      }, null, { timeout: 120000, polling: 250 });
      const st = await page.evaluate(() => {
        const g = window.game;
        const fx = [0, 1, 2, 3].map((s) => g.visualFx[s]({ time: g.simTime, slot: s }));
        const dom = [0, 1, 2, 3].map((s) => {
          const vp = document.querySelector(`.vp[data-slot="${s}"]`);
          if (!vp) return null;
          const c = vp.querySelector('canvas');
          return { filter: c.style.filter, transform: c.style.transform, tunnel: +getComputedStyle(vp.querySelector('.vp-tunnel')).opacity };
        });
        return {
          spy: JSON.parse(JSON.stringify(window.__spy)),
          fx, dom,
          status: [0, 1, 2, 3].map((s) => g.impairment.getImpairmentStatus(s)),
          phase: g.phase,
          btnHidden: document.querySelector('button[title="Impairment settings"]').style.display === 'none',
          raceTime: g.race ? g.race.time : 0,
          humansMoving: g.race.karts.filter((k) => k.isHuman).every((k) => k.progress > 20),
        };
      });
      levelStats.push({ target, ...st });
      await page.screenshot({ path: path.join(shots, `impairment-drinks${target}.png`) });

      const tag = `drinks=${target}`;
      check(st.spy.calls.every((n) => n > 100), `${tag}: filter called for every human slot (${st.spy.calls.join(',')})`);
      check(st.spy.other === 0, `${tag}: filters only ever see their own human slot`);
      check(st.spy.cpu.karts > 0 && st.spy.cpu.frames > 100 && st.spy.cpu.mismatches === 0,
        `${tag}: ${st.spy.cpu.karts} CPU karts drive with exactly their AI output (${st.spy.cpu.frames} frames, ${st.spy.cpu.mismatches} mismatches)`);
      check(st.humansMoving, `${tag}: all 4 human karts are making progress`);
      check(st.btnHidden, `${tag}: host settings button hidden while racing`);
      if (target === 0) {
        check(st.spy.changed.every((n) => n === 0), `${tag}: sober filter is identity (changed frames ${st.spy.changed.join(',')})`);
        check(st.fx.every((f) => f.blurPx === 0 && f.doubleVision === 0 && f.tunnel === 0), `${tag}: no visual effects`);
        check(st.dom.every((d) => d && (!d.filter || d.filter === 'none')), `${tag}: viewport canvases unfiltered`);
      } else {
        const frac = st.spy.changed.map((c, i) => c / Math.max(1, st.spy.calls[i]));
        check(frac.every((f) => f > 0.8), `${tag}: impaired inputs differ from raw on most frames (${frac.map((f) => f.toFixed(2)).join(',')})`);
        check(st.fx.every((f) => f.blurPx > 0.5 && f.doubleVision > 0.2 && f.tunnel > 0.15), `${tag}: visualFx non-zero for every human`);
        check(st.dom.every((d) => d && /blur\(/.test(d.filter)), `${tag}: blur applied to every human viewport canvas`);
        check(st.dom.every((d) => d && d.tunnel > 0.1), `${tag}: tunnel vignette visible on every viewport`);
        check(st.status.every((s) => s.drinks === target && s.overLimit), `${tag}: status shows ${target} drinks and over the limit`);
      }
      // finish the race; drinks must go up by one for every human
      // (the banner is checked in the same tick: it expires after 6 s, and a
      // loaded machine can take longer than that to reach the next step)
      const fin = await page.evaluate(() => {
        window.game.debugFinishRace();
        return {
          drinks: window.game.session.players.map((p) => p.drinks),
          banner: [...document.querySelectorAll('div')].some((d) => d.textContent === 'Round!'),
        };
      });
      const after = fin.drinks;
      check(after.every((d) => d === Math.min(15, target + 1)), `${tag}: raceFinished gave every human +1 (now ${after.join(',')})`);
      check(fin.banner, `${tag}: "Round!" banner shown on the host page`);
      await page.screenshot({ path: path.join(shots, `impairment-results${r + 1}.png`) });
    }
    // open the settings panel and screenshot it
    await page.click('button[title="Impairment settings"]');
    await sleep(200);
    await page.screenshot({ path: path.join(shots, 'impairment-settings.png') });
    check(errors.length === 0, `no console errors${errors.length ? ': ' + errors.slice(0, 3).join(' | ') : ''}`);
    return { results, levelStats };
  } finally {
    await browser.close();
    await srv.close();
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { results, levelStats } = await runE2E();
  for (const s of levelStats) {
    console.log(`drinks=${s.target}: changed ${s.spy.changed.join(',')} of ${s.spy.calls.join(',')} frames; fx slot0 ${JSON.stringify(s.fx[0], (k, v) => (typeof v === 'number' ? +v.toFixed(3) : v))}; impairment events ${s.spy.events.length}`);
  }
  const failed = results.filter((r) => !r.ok).length;
  console.log(failed ? `${failed} FAILED` : 'ALL PASS');
  process.exit(failed ? 1 : 0);
}
