// Wires the impairment model into `window.game` (engine contract).
//
//   <script type="module" src="/js/impairment/install.js"></script>
//
// The engine's main.js also imports js/impairment/index.js automatically and
// calls its default export (install). Both paths are idempotent.
//
// Works whether the engine creates `window.game` before or after this module
// loads: it installs immediately if the engine is ready, otherwise it listens
// for a `game-ready` event on window/document and polls as a fallback.
//
// Engine contract used (all optional pieces are guarded):
//   game.inputFilters[slot](raw, dt, ctx)   we REPLACE entries for slots 0-3
//   game.visualFx[slot]()                   we REPLACE entries for slots 0-3
//   game.session = {raceIndex, totalRaces, players:[{slot,name,color,connected,racesCompleted,drinks}]}
//   game.on(evt, cb)  raceStart, raceFinished, cupFinished, playerJoined, playerLeft
//
// Exposes `game.impairment` = { getImpairmentStatus, adjustDrinks, setWaterMode,
// setBody, setSettings, newNight, hudModel, on(evt, cb), bus, filters, DISCLAIMER }.
// Bus events: 'event' {type:'lapse'|'invert'|'hiccup'|'fumble', slot} (for phone
// haptics), 'drinksChanged', 'settingsChanged', 'toast', 'round'.

import { createImpairment } from './filter.js';
import { installDrinkTracking, ensureSession, setSettings, syncPlayerStatus } from './drinks.js';
import { mountHostSettings, loadSavedSettings } from './host-settings.js';

export { createImpairment } from './filter.js';
export { getImpairmentStatus, adjustDrinks, setWaterMode, setBody, newNight, hudModel, DISCLAIMER } from './drinks.js';

const HUMAN_SLOTS = [0, 1, 2, 3];

export function isEngineReady(game) {
  return !!game
    && typeof game.on === 'function'
    && !!game.session
    && !!game.inputFilters
    && !!game.visualFx;
}

/** Install on a ready game object. Idempotent. Returns game.impairment. */
export function installImpairment(game, opts = {}) {
  if (game.__impairmentInstalled) return game.impairment;
  ensureSession(game);
  const api = installDrinkTracking(game);
  api.filters = [];
  for (const slot of HUMAN_SLOTS) {
    const imp = createImpairment(slot, game, {
      onEvent: (ev) => {
        api.bus.emit('event', ev);
        if (typeof game.emit === 'function') { try { game.emit('impairmentEvent', ev); } catch (e) { /* ignore */ } }
      },
    });
    api.filters[slot] = imp;
    game.inputFilters[slot] = imp.filter;
    game.visualFx[slot] = imp.visual;
  }
  game.__impairmentInstalled = true;

  const saved = opts.skipSaved ? null : loadSavedSettings(opts.storage);
  if (saved) setSettings(saved, game);

  // keep p.bac etc. fresh for the HUD/phones (BAC falls slowly with time)
  if (opts.syncMs !== 0 && typeof setInterval === 'function') {
    const timer = setInterval(() => syncPlayerStatus(game), opts.syncMs || 1000);
    if (timer && timer.unref) timer.unref();
    api.stopSync = () => clearInterval(timer);
  }

  if (opts.ui !== false) {
    try { api.ui = mountHostSettings(game, { document: opts.document, storage: opts.storage }); } catch (e) {
      if (typeof console !== 'undefined') console.warn('[impairment] host settings panel failed', e);
    }
  }
  if (typeof console !== 'undefined' && opts.quiet !== true) console.info('[impairment] installed on window.game');
  return api;
}

/** Plugin hook used by the engine's main.js: `mod.default(game)` / `mod.install(game)`. */
export function install(game, opts) {
  if (!game) return null;
  const doc = typeof document !== 'undefined' ? document : undefined;
  return installImpairment(game, Object.assign({ document: doc }, opts));
}

export default install;

/**
 * Install as soon as `win.game` is ready: now, on `game-ready`, or by polling.
 * Returns a stop() function.
 */
export function autoInstall(win, opts = {}) {
  let done = false;
  let timer = null;
  const doc = win.document;
  const cleanup = () => {
    if (timer) { clearInterval(timer); timer = null; }
    if (win.removeEventListener) win.removeEventListener('game-ready', attempt);
    if (doc && doc.removeEventListener) doc.removeEventListener('game-ready', attempt);
  };
  function attempt() {
    if (done) return true;
    const g = win.game;
    if (!isEngineReady(g)) return false;
    done = true;
    cleanup();
    installImpairment(g, Object.assign({ document: doc }, opts));
    return true;
  }
  if (attempt()) return cleanup;
  if (win.addEventListener) win.addEventListener('game-ready', attempt);
  if (doc && doc.addEventListener) doc.addEventListener('game-ready', attempt);
  const started = Date.now();
  timer = setInterval(() => {
    if (attempt()) return;
    if (Date.now() - started > (opts.pollTimeoutMs ?? 120000)) {
      clearInterval(timer); timer = null;
      if (typeof console !== 'undefined') console.warn('[impairment] window.game not ready after polling; still waiting for a game-ready event');
    }
  }, opts.pollMs ?? 100);
  if (timer && timer.unref) timer.unref();
  return () => { done = true; cleanup(); };
}

// Auto-run in a browser page. (Importing this file under Node does nothing.)
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  autoInstall(window);
}
