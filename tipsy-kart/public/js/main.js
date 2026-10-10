// Host entry point: builds window.game, then loads optional host-side plugins
// from other lanes (js/net/index.js, js/impairment/index.js) when present.
import { Game } from './game/game.js';

const game = new Game(document.getElementById('app'));
window.game = game;
game.ready = true;
window.dispatchEvent(new CustomEvent('game-ready', { detail: game }));

async function loadPlugins() {
  let plugins = [];
  try {
    const res = await fetch('/api/info', { cache: 'no-store' });
    plugins = (await res.json()).plugins || [];
  } catch (e) {
    return;
  }
  for (const p of plugins) {
    try {
      const mod = await import('./' + p.replace(/^js\//, ''));
      if (mod && typeof mod.default === 'function') await mod.default(game);
      else if (mod && typeof mod.install === 'function') await mod.install(game);
    } catch (e) {
      console.error('[tipsy-kart] plugin failed to load:', p, e);
    }
  }
  game.emit('pluginsLoaded', plugins);
}
loadPlugins();
