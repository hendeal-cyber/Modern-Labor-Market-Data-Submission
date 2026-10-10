// Host-side plugin entry for the phone controllers. server.js lists this file in /api/info
// `plugins`, and the host page imports it after window.game exists:
//
//   <script type="module" src="/js/net/index.js"></script>
//
// Importing is enough: it waits for window.game (up to 60 s) and then starts the bridge.
// It also exports `init(game)` / default for pages that prefer to call it themselves.

import { initNetHost } from './net-host.js';
import { mountJoinQr, mountCards } from './join-qr.js';

let started = null;

export function init(game = window.game) {
  if (started) return started;
  if (!game) throw new Error('tipsy net: window.game is not defined yet');
  const net = initNetHost(game);
  const target = document.getElementById('join-qr');
  let panel = null;
  if (target) {
    mountJoinQr(target);
  } else {
    // No lobby UI exists yet: float a small panel while the lobby is up (press J to toggle).
    panel = document.createElement('div');
    panel.className = 'tk-float';
    panel.id = 'tk-join-float';
    const close = document.createElement('button'); close.className = 'tk-close'; close.type = 'button'; close.textContent = '×'; close.title = 'Hide (J)';
    const qr = document.createElement('div'); const cards = document.createElement('div');
    panel.append(close, qr, cards);
    document.body.appendChild(panel);
    mountJoinQr(qr);
    mountCards(cards, net);
    let userHidden = false;
    const apply = () => { panel.style.display = !userHidden && net.phase() === 'lobby' ? '' : 'none'; };
    close.addEventListener('click', () => { userHidden = true; apply(); });
    window.addEventListener('keydown', (e) => {
      if (e.key === 'j' || e.key === 'J') { userHidden = !userHidden; apply(); if (!userHidden) panel.style.display = ''; }
    });
    setInterval(apply, 500);
    apply();
  }
  started = { net, panel };
  return started;
}

export default init;
export const install = init;

function waitForGame() {
  if (window.game) { try { init(window.game); } catch (e) { console.error('[tipsy net]', e); } return; }
  const t0 = Date.now();
  const iv = setInterval(() => {
    if (window.game) { clearInterval(iv); try { init(window.game); } catch (e) { console.error('[tipsy net]', e); } } else if (Date.now() - t0 > 60000) clearInterval(iv);
  }, 100);
  window.addEventListener('tipsy:gameReady', () => { if (window.game && !started) { clearInterval(iv); try { init(window.game); } catch (e) { console.error('[tipsy net]', e); } } }, { once: true });
}

if (!window.__tipsyNetNoAuto) waitForGame();
