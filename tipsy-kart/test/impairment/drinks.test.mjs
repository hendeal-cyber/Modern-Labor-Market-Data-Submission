// Drink counting (T12), status / HUD data, manual adjust, water mode, settings.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  installDrinkTracking, getImpairmentStatus, adjustDrinks, setWaterMode, setBody, setSettings, newNight, hudModel,
  ensureSession, DISCLAIMER, TOAST_TEXT,
} from '../../public/js/impairment/drinks.js';
import { makeFakeGame } from './lib/fakegame.mjs';

function game4(extra = {}) {
  const g = makeFakeGame(extra);
  installDrinkTracking(g);
  return g;
}
const res = (slot, o = {}) => ({ slot, isCpu: false, dnf: false, ...o });

test('T12 raceFinished gives every human +1 drink (DNF included); CPUs and absent players get none', () => {
  const g = game4();
  g.fire('raceStart', { raceIndex: 1 });
  g.fire('raceFinished', { raceIndex: 1, results: [res(0), res(1, { dnf: true }), { slot: -1, isCpu: true }, { slot: 5, isCpu: true }, res(3)] });
  assert.deepEqual(g.session.players.map((p) => p.drinks), [1, 1, 0, 1]);
  assert.equal(g.session.players.every((p) => p.drinkLog.length === p.drinks), true);
});

test('T12 raceFinished accepts a bare results array too, and falls back to connected players', () => {
  const g = game4();
  g.session.raceIndex = 1;
  g.fire('raceFinished', [res(0), res(2)]);
  assert.deepEqual(g.session.players.map((p) => p.drinks), [1, 0, 1, 0]);

  const h = game4();
  h.session.players[2].connected = false;
  h.fire('raceFinished', { raceIndex: 1 });
  assert.deepEqual(h.session.players.map((p) => p.drinks), [1, 1, 0, 1]);
});

test('T12 idempotent per race; next race (after raceStart) awards again', () => {
  const g = game4();
  g.fire('raceFinished', { raceIndex: 1, results: [res(0)] });
  g.fire('raceFinished', { raceIndex: 1, results: [res(0)] });
  assert.equal(g.session.players[0].drinks, 1);
  g.fire('raceStart', {});
  g.fire('raceFinished', { raceIndex: 2, results: [res(0)] });
  assert.equal(g.session.players[0].drinks, 2);
  // even if the engine reuses the same raceIndex, a raceStart re-arms the award
  g.fire('raceStart', {});
  g.fire('raceFinished', { raceIndex: 2, results: [res(0)] });
  assert.equal(g.session.players[0].drinks, 3);
});

test('T12 water players get +1 waters, not a drink; cupFinished does not reset; racesCompleted untouched', () => {
  const g = game4();
  g.session.players[1].water = true;
  g.fire('raceFinished', { raceIndex: 1, results: [res(0), res(1)] });
  assert.equal(g.session.players[1].drinks, 0);
  assert.equal(g.session.players[1].waters, 1);
  assert.equal(g.session.players[0].drinks, 1);
  g.fire('cupFinished', { standings: [] });
  assert.equal(g.session.players[0].drinks, 1, 'cupFinished must not reset drinks');
  assert.equal(g.session.players[0].racesCompleted, 0, 'racesCompleted is owned by the engine');
});

test('T12 drinks are capped at 15 and a mid-cup joiner starts at 0', () => {
  const g = game4({ drinks: 15 });
  g.fire('raceFinished', { raceIndex: 1, results: [res(0)] });
  assert.equal(g.session.players[0].drinks, 15);
  g.session.players.splice(3, 1);
  g.session.players.push({ slot: 3, name: 'New', connected: true, racesCompleted: 0 });
  g.fire('playerJoined', { slot: 3 });
  assert.equal(g.session.players[3].drinks, 0);
  assert.equal(g.session.players[3].water, false);
});

test('raceFinished emits drinksChanged and a Round banner payload', () => {
  const g = game4();
  const seen = [];
  g.impairment.on('round', (r) => seen.push(r));
  const changed = [];
  g.impairment.on('drinksChanged', (c) => changed.push(c));
  g.fire('raceFinished', { raceIndex: 1, results: [res(0)] });
  g.session.players[0].drinks = 1; // second race => 2 drinks
  g.fire('raceStart', {});
  g.fire('raceFinished', { raceIndex: 2, results: [res(0), res(1)] });
  assert.equal(seen.length, 2);
  const line = seen[1].lines.find((l) => l.slot === 0);
  assert.match(line.text, /P1 \+1 -> 2 drinks/);
  assert.match(line.text, /OVER THE LIMIT/);
  assert.ok(changed.length >= 2);
});

test('race-3 toast fires once per night, the first time any human reaches L >= 2', () => {
  const g = game4();
  const toasts = [];
  g.impairment.on('toast', (t) => toasts.push(t.text));
  g.session.players[0].drinks = 1;
  g.fire('raceStart', {});
  assert.equal(toasts.length, 0);
  g.session.players[0].drinks = 2;
  g.fire('raceStart', {});
  g.fire('raceStart', {});
  assert.deepEqual(toasts, [TOAST_TEXT]);
  newNight(g);
  g.session.players[0].drinks = 2;
  g.fire('raceStart', {});
  assert.equal(toasts.length, 2, 'a new night re-arms the toast');
});

test('getImpairmentStatus: shape and values', () => {
  const g = game4();
  const now = Date.now();
  let st = getImpairmentStatus(0, g, now);
  assert.deepEqual(Object.keys(st).slice(0, 6), ['drinks', 'bac', 'level', 'tierLabel', 'limit', 'overLimit']);
  assert.equal(st.drinks, 0); assert.equal(st.bac, 0); assert.equal(st.level, 0);
  assert.equal(st.tierLabel, 'Sober'); assert.equal(st.limit, 0.05); assert.equal(st.overLimit, false);

  g.session.players[0].drinks = 2; g.session.players[0].drinkLog = [now];
  st = getImpairmentStatus(0, g, now);
  assert.equal(st.drinks, 2);
  assert.ok(Math.abs(st.bac - 0.0602) < 0.0005);
  assert.equal(st.level, 2);
  assert.equal(st.tierLabel, 'Over the limit');
  assert.equal(st.overLimit, true);

  g.session.players[0].drinks = 1; g.session.players[0].drinkLog = [now];
  st = getImpairmentStatus(0, g, now);
  assert.equal(st.tierLabel, 'Buzzed');
  assert.equal(st.overLimit, false);

  // limit line 0.08: 2 drinks is 0.060 (under) but level 2 still reads over the limit
  setSettings({ limitLine: 0.08 }, g);
  g.session.players[0].drinks = 3; g.session.players[0].drinkLog = [now];
  st = getImpairmentStatus(0, g, now);
  assert.equal(st.limit, 0.08);
  assert.equal(st.overLimit, true);

  // unknown slot is harmless
  const none = getImpairmentStatus(9, g, now);
  assert.equal(none.drinks, 0); assert.equal(none.present, false);
});

test('getImpairmentStatus in water mode: bac 0, level 0, drinks kept', () => {
  const g = game4({ drinks: 4 });
  setWaterMode(0, true, g);
  const st = getImpairmentStatus(0, g);
  assert.equal(st.drinks, 4); assert.equal(st.bac, 0); assert.equal(st.level, 0);
  assert.equal(st.water, true); assert.equal(st.overLimit, false);
  setWaterMode(0, false, g);
  assert.equal(getImpairmentStatus(0, g).level, 4);
});

test('adjustDrinks: +1/-1 with clamping and drink log bookkeeping', () => {
  const g = game4();
  assert.equal(adjustDrinks(0, 1, g, 1000), 1);
  assert.equal(adjustDrinks(0, 1, g, 2000), 2);
  assert.deepEqual(g.session.players[0].drinkLog, [1000, 2000]);
  assert.equal(adjustDrinks(0, -1, g), 1);
  assert.deepEqual(g.session.players[0].drinkLog, [1000], '-1 pops the latest entry');
  assert.equal(adjustDrinks(0, -5, g), 0);
  assert.equal(adjustDrinks(0, 99, g), 15);
  assert.equal(g.session.players[0].drinkLog.length, 15);
  assert.equal(adjustDrinks(9, 1, g), null, 'unknown slot');
});

test('setBody validates weight and sex; setSettings clamps; newNight is the only reset', () => {
  const g = game4({ drinks: 3 });
  assert.deepEqual(setBody(0, { bodyKg: 250, sex: 'm' }, g), { bodyKg: 200, sex: 'm' });
  assert.deepEqual(setBody(0, { bodyKg: 10, sex: 'x' }, g), { bodyKg: 40, sex: null });
  assert.deepEqual(setBody(0, { bodyKg: '' }, g), { bodyKg: null, sex: null });
  assert.deepEqual(setBody(0, { bodyKg: 'abc' }, g), { bodyKg: null, sex: null });
  setSettings({ intensity: 9, limitLine: 0.5, comfortVisuals: 1 }, g);
  assert.equal(g.session.settings.intensity, 2);
  assert.equal(g.session.settings.limitLine, 0.15);
  assert.equal(g.session.settings.comfortVisuals, true);
  setSettings({ intensity: 'junk' }, g);
  assert.equal(g.session.settings.intensity, 2, 'junk ignored');
  const oldSeed = g.session.seed;
  newNight(g);
  assert.ok(g.session.players.every((p) => p.drinks === 0 && p.drinkLog.length === 0));
  assert.notEqual(g.session.seed, oldSeed);
});

test('ensureSession fills defaults without overwriting existing values', () => {
  const g = makeFakeGame({ seed: undefined, settings: { intensity: 1.25 } });
  delete g.session.seed;
  ensureSession(g);
  assert.ok(Number.isFinite(g.session.seed));
  assert.equal(g.session.settings.intensity, 1.25);
  assert.equal(g.session.settings.limitLine, 0.05);
  assert.equal(g.session.settings.phoneSwim, true);
  const seed = g.session.seed;
  ensureSession(g);
  assert.equal(g.session.seed, seed);
});

test('hudModel: icon, bar fill, limit tick, colour', () => {
  const g = game4();
  const now = Date.now();
  let h = hudModel(0, g, now);
  assert.equal(h.icon, 'mug'); assert.equal(h.color, 'green'); assert.equal(h.barFill, 0);
  assert.ok(Math.abs(h.limitTick - 0.25) < 1e-9);
  g.session.players[0].drinks = 1; g.session.players[0].drinkLog = [now];
  h = hudModel(0, g, now);
  assert.equal(h.color, 'amber'); assert.match(h.bacText, /^est\. BAC 0\.03\d%$/);
  g.session.players[0].drinks = 3; g.session.players[0].drinkLog = [now];
  h = hudModel(0, g, now);
  assert.equal(h.color, 'red'); assert.ok(h.barFill > 0.4 && h.barFill < 0.5);
  g.session.players[0].water = true;
  h = hudModel(0, g, now);
  assert.equal(h.icon, 'water'); assert.equal(h.count, 0);
});

test('disclaimer line text', () => {
  assert.equal(DISCLAIMER, 'Tipsy Kart is just a game. Never drink and drive in real life.');
});
