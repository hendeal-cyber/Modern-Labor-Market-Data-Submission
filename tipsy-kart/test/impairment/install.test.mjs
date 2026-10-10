// install.js wiring (engine before/after), host settings panel (stub DOM), persistence.
import test from 'node:test';
import assert from 'node:assert/strict';
import { installImpairment, autoInstall, isEngineReady } from '../../public/js/impairment/install.js';
import { mountHostSettings, loadSavedSettings, saveSettings } from '../../public/js/impairment/host-settings.js';
import { makeFakeGame } from './lib/fakegame.mjs';

// ---- minimal DOM stub ----
class El {
  constructor(tag) { this.tag = tag; this.children = []; this.style = {}; this.handlers = {}; this.parentNode = null; this.textContent = ''; this.className = ''; }
  appendChild(c) { c.parentNode = this; this.children.push(c); return c; }
  removeChild(c) { this.children = this.children.filter((x) => x !== c); c.parentNode = null; return c; }
  get firstChild() { return this.children[0] || null; }
  addEventListener(n, f) { (this.handlers[n] ||= []).push(f); }
  fire(n, ev = {}) { for (const f of this.handlers[n] || []) f({ target: this, ...ev }); }
  // for inputs with onchange given as property
  find(pred, out = []) { if (pred(this)) out.push(this); for (const c of this.children) c.find(pred, out); return out; }
}
function makeDoc() {
  const body = new El('body');
  const listeners = {};
  return {
    body,
    createElement: (t) => new El(t),
    addEventListener: (n, f) => { (listeners[n] ||= []).push(f); },
    removeEventListener: (n, f) => { listeners[n] = (listeners[n] || []).filter((x) => x !== f); },
    dispatch: (n) => (listeners[n] || []).slice().forEach((f) => f()),
    listeners,
  };
}
function makeStorage() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), m };
}
const texts = (el) => el.find((e) => e.textContent).map((e) => e.textContent);
const buttons = (el, label) => el.find((e) => e.tag === 'button' && e.textContent === label);

test('installImpairment wires filters, visuals and the API onto the game (idempotent)', () => {
  const game = makeFakeGame({ drinks: [0, 2, 0, 5] });
  assert.equal(isEngineReady(game), true);
  const api = installImpairment(game, { ui: false, quiet: true, skipSaved: true });
  assert.equal(game.impairment, api);
  assert.equal(installImpairment(game, { ui: false, quiet: true }), api, 'second call is a no-op');
  assert.equal(typeof api.getImpairmentStatus, 'function');
  assert.equal(typeof api.adjustDrinks, 'function');
  assert.equal(typeof api.setWaterMode, 'function');
  // slot 0 sober => identity, slot 3 drunk => changed output
  const raw = { steer: 0.5, throttle: 1, brake: 0, drift: false, useItem: false };
  const kart = { raceTime: 30, speedNorm: 1 };
  assert.equal(game.inputFilters[0](raw, 1 / 60, { raceIndex: 1, drinks: 0, kartState: kart }), raw);
  game.inputFilters[3](raw, 1 / 60, { raceIndex: 1, drinks: 5, kartState: kart });
  const out = game.inputFilters[3](raw, 1 / 60, { raceIndex: 1, drinks: 5, kartState: kart });
  assert.notEqual(out, raw);
  assert.equal(game.visualFx[0]().blurPx, 0);
  assert.ok(game.visualFx[3](1.0).blurPx > 0);
  // API reflects live session data
  assert.equal(api.getImpairmentStatus(3).drinks, 5);
  api.adjustDrinks(0, 1);
  assert.equal(game.session.players[0].drinks, 1);
  api.setWaterMode(3, true);
  assert.equal(api.getImpairmentStatus(3).level, 0);
});

test('phone events are forwarded on the impairment bus', () => {
  const game = makeFakeGame({ drinks: [5, 0, 0, 0] });
  const emitted = [];
  game.emit = (e, p) => emitted.push([e, p]);
  const api = installImpairment(game, { ui: false, quiet: true, skipSaved: true });
  const evs = [];
  api.on('event', (e) => evs.push(e));
  const dt = 1 / 60;
  for (let i = 0; i < 60 * 600; i++) {
    game.inputFilters[0]({ steer: 0, throttle: 1, brake: 0, drift: false, useItem: false }, dt, { raceIndex: 1, kartState: { raceTime: i * dt, speedNorm: 1 } });
  }
  assert.ok(evs.length > 3);
  assert.ok(evs.every((e) => e.slot === 0 && ['lapse', 'invert', 'hiccup', 'fumble'].includes(e.type)));
  const viaGame = emitted.filter(([name]) => name === 'impairmentEvent').map(([, p]) => p);
  assert.equal(viaGame.length, evs.length, 'every impairment event also goes through game.emit');
  for (const p of viaGame) {
    assert.deepEqual(Object.keys(p).sort(), ['slot', 'type']);
    assert.equal(p.slot, 0);
    assert.ok(['lapse', 'invert', 'hiccup', 'fumble'].includes(p.type));
  }
  assert.ok(viaGame.some((p) => p.type !== 'fumble'), 'lapse/invert/hiccup are emitted, not only fumbles');
});

test('autoInstall: engine already there', () => {
  const doc = makeDoc();
  const win = { game: makeFakeGame(), document: doc, addEventListener() {}, removeEventListener() {} };
  const stop = autoInstall(win, { ui: false, quiet: true, skipSaved: true });
  assert.ok(win.game.impairment);
  stop();
});

test('autoInstall: engine arrives later, announced by a game-ready event', () => {
  const doc = makeDoc();
  const winL = {};
  const win = {
    document: doc,
    addEventListener: (n, f) => { (winL[n] ||= []).push(f); },
    removeEventListener: (n, f) => { winL[n] = (winL[n] || []).filter((x) => x !== f); },
  };
  const stop = autoInstall(win, { ui: false, quiet: true, skipSaved: true, pollMs: 100000 });
  assert.equal(win.game, undefined);
  // half-built engine objects are not enough
  win.game = { on() {}, session: makeFakeGame().session };
  winL['game-ready'].forEach((f) => f());
  assert.equal(win.game.impairment, undefined, 'not ready yet (no inputFilters/visualFx)');
  win.game = makeFakeGame();
  winL['game-ready'].forEach((f) => f());
  assert.ok(win.game.impairment);
  assert.equal((winL['game-ready'] || []).length, 0, 'listener removed after install');
  stop();
});

test('autoInstall: engine arrives later, found by polling', async () => {
  const doc = makeDoc();
  const win = { document: doc };
  const stop = autoInstall(win, { ui: false, quiet: true, skipSaved: true, pollMs: 10 });
  win.game = makeFakeGame();
  await new Promise((r) => setTimeout(r, 80));
  assert.ok(win.game.impairment);
  stop();
});

test('host settings panel: renders, drives the API, persists settings', () => {
  const doc = makeDoc();
  const storage = makeStorage();
  const game = makeFakeGame({ drinks: [1, 0, 0, 0] });
  installImpairment(game, { ui: false, quiet: true, skipSaved: true });
  const ui = mountHostSettings(game, { document: doc, storage, setTimeout: () => {} });
  assert.ok(ui);
  assert.equal(doc.body.children.length, 3, 'button, panel and toast layer are injected');
  ui.setOpen(true);
  assert.equal(ui.panel.style.display, 'block');
  const t = texts(ui.panel);
  assert.ok(t.includes('Lightweight') && t.includes('Standard') && t.includes('Hardcore'));
  assert.ok(t.includes('0.05 %') && t.includes('0.08 %'));
  assert.ok(t.some((s) => /Comfort visuals/.test(s)));
  assert.ok(t.some((s) => /New night/.test(s)));
  assert.ok(t.includes('P1') && t.includes('P4'));

  buttons(ui.panel, 'Hardcore')[0].fire('click');
  assert.equal(game.session.settings.intensity, 1.25);
  buttons(ui.panel, '0.08 %')[0].fire('click');
  assert.equal(game.session.settings.limitLine, 0.08);
  assert.equal(JSON.parse(storage.m.get('tipsy.impairment.settings.v1')).intensity, 1.25);

  buttons(ui.panel, '+')[0].fire('click');
  assert.equal(game.session.players[0].drinks, 2);
  buttons(ui.panel, '-')[1].fire('click'); // P2 is at 0, stays 0
  assert.equal(game.session.players[1].drinks, 0);

  const boxes = ui.panel.find((e) => e.tag === 'input' && e.type === 'checkbox');
  assert.equal(boxes.length, 2 + 4, 'comfort, phone swim, then one water box per player');
  boxes[0].checked = true; boxes[0].fire('change');
  assert.equal(game.session.settings.comfortVisuals, true);
  boxes[2].checked = true; boxes[2].fire('change');
  assert.equal(game.session.players[0].water, true);
  assert.equal(game.impairment.getImpairmentStatus(0).level, 0);

  buttons(ui.panel, 'New night (reset drinks)')[0].fire('click');
  assert.equal(game.session.players[0].drinks, 0);

  ui.destroy();
  assert.equal(doc.body.children.length, 0);
});

test('host settings panel: round banner and toast render and expire', () => {
  const doc = makeDoc();
  const game = makeFakeGame({ drinks: 0 });
  installImpairment(game, { ui: false, quiet: true, skipSaved: true });
  const timers = [];
  const ui = mountHostSettings(game, { document: doc, storage: makeStorage(), setTimeout: (f) => timers.push(f) });
  game.fire('raceFinished', { raceIndex: 1, results: [{ slot: 0, isCpu: false }] });
  const shown = texts(ui.toasts);
  assert.ok(shown.includes('Round!'));
  assert.ok(shown.some((s) => /P1 \+1 -> 1 drink/.test(s)));
  timers.forEach((f) => f());
  assert.equal(ui.toasts.children.length, 0);
  game.session.players[1].drinks = 2;
  game.fire('raceStart', {});
  assert.ok(texts(ui.toasts).some((s) => /over the limit/i.test(s)));
});

test('mountHostSettings is a no-op without a DOM; saved settings round-trip and bad storage is ignored', () => {
  const game = makeFakeGame();
  installImpairment(game, { ui: false, quiet: true, skipSaved: true });
  assert.equal(mountHostSettings(game, {}), null, 'no document in Node');
  const st = makeStorage();
  saveSettings({ intensity: 0.6, limitLine: 0.08 }, st);
  assert.deepEqual(loadSavedSettings(st), { intensity: 0.6, limitLine: 0.08 });
  assert.equal(loadSavedSettings({ getItem() { throw new Error('blocked'); } }), null);
  saveSettings({ a: 1 }, { setItem() { throw new Error('blocked'); } }); // must not throw

  const g2 = makeFakeGame();
  installImpairment(g2, { ui: false, quiet: true, storage: st });
  assert.equal(g2.session.settings.intensity, 0.6, 'saved host settings are applied on install');
  assert.equal(g2.session.settings.limitLine, 0.08);
});
