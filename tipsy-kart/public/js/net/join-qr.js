// Join panel for the big screen (phone-controls spec 5, "Lobby UI"): QR code (vendored
// qrcode-generator, rendered as inline SVG), the join URLs, "Wrong address?" cycling and the
// 3-step certificate help. Mounted into #join-qr if the host page has one; otherwise
// index.js floats a panel (toggle with the J key).

const STYLE = `
.tk-join{font:600 15px/1.35 system-ui,sans-serif;color:#fff;text-align:center}
.tk-join .tk-qr{background:#fff;border-radius:12px;padding:6px;width:min(100%,320px);min-width:200px;margin:0 auto}
.tk-join .tk-qr svg{display:block;width:100%;height:auto}
.tk-join .tk-url{font:700 1.15em/1.3 ui-monospace,Menlo,Consolas,monospace;margin:.6em 0 .2em;word-break:break-all}
.tk-join .tk-alt{opacity:.75;font-weight:500;font-size:.85em}
.tk-join button{font:inherit;color:inherit;background:#2a2a34;border:0;border-radius:8px;padding:4px 10px;margin:.5em .2em 0;cursor:pointer}
.tk-join details{text-align:left;margin-top:.6em;font-weight:500;font-size:.85em;opacity:.9}
.tk-join summary{cursor:pointer;font-weight:700}
.tk-join ol{margin:.4em 0 0 1.2em;padding:0}
.tk-cards{display:grid;gap:6px;margin-top:10px}
.tk-card{display:flex;align-items:center;gap:8px;background:#1d1d24;border-left:6px solid var(--pc,#888);border-radius:8px;padding:6px 8px;font:600 14px system-ui,sans-serif;color:#fff;text-align:left}
.tk-card .tk-n{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.tk-card .tk-rtt{width:10px;height:10px;border-radius:50%;background:#888;flex:none}
.tk-card .tk-m{opacity:.7;font-weight:500;font-size:.85em}
.tk-card button{background:#3a2430;color:#fff;border:0;border-radius:6px;cursor:pointer;padding:2px 8px}
.tk-card.off{opacity:.5}
.tk-float{position:fixed;left:12px;bottom:12px;z-index:9999;background:rgba(17,17,24,.94);padding:12px;border-radius:14px;width:min(300px,86vw);max-height:92vh;overflow:auto;box-shadow:0 6px 30px #000a}
.tk-float .tk-close{position:absolute;right:6px;top:4px;background:none;border:0;color:#fff;font-size:18px;cursor:pointer}
`;

let qrLoad = null;
function loadQr() {
  if (window.qrcode) return Promise.resolve(window.qrcode);
  if (!qrLoad) {
    qrLoad = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = '/vendor/qrcode.js';
      s.onload = () => resolve(window.qrcode);
      s.onerror = () => reject(new Error('qrcode.js failed to load'));
      document.head.appendChild(s);
    });
  }
  return qrLoad;
}

function injectStyle() {
  if (document.getElementById('tk-join-style')) return;
  const st = document.createElement('style'); st.id = 'tk-join-style'; st.textContent = STYLE; document.head.appendChild(st);
}

/** Pure helper (also unit-tested): the URLs for the address at `idx` of info.ips. */
export function urlsFor(info, idx) {
  const ips = info.ips && info.ips.length ? info.ips : [info.primaryIp || location.hostname];
  const ip = ips[((idx % ips.length) + ips.length) % ips.length];
  const http = info.httpPort != null ? `http://${ip}:${info.httpPort}/controller` : null;
  const https = info.httpsPort != null ? `https://${ip}:${info.httpsPort}/controller` : null;
  const join = info.joinMode === 'http' || !https ? http : https;
  return { ip, http, https, join, ips };
}

export async function mountJoinQr(el) {
  injectStyle();
  // Embedded mode: the engine's lobby already has #join-qr (a white square that styles a direct
  // <svg> child) plus #join-url / #join-alt. We fill those and add our extras after #join-alt.
  const urlHost = document.getElementById('join-url');
  const embedded = !!urlHost && el.id === 'join-qr';
  let qrBox; let urlEl; let altEl; let extras;
  const wrong = document.createElement('button'); wrong.type = 'button'; wrong.textContent = 'Wrong address? \u25b8';
  const help = document.createElement('details'); help.className = 'tk-help';
  help.innerHTML = '<summary>Phones can\'t connect?</summary>'
    + '<div>The https link shows a one-time browser warning because the game runs on this laptop, not the internet. The connection is still encrypted.</div>'
    + '<ol><li><b>iPhone (Safari):</b> "This Connection Is Not Private" &rarr; Show Details &rarr; visit this website &rarr; Visit Website.</li>'
    + '<li><b>Android (Chrome):</b> "Your connection is not private" &rarr; Advanced &rarr; Proceed to the address (unsafe).</li>'
    + '<li>If the link opens inside another app (camera, chat), use "Open in Chrome" / "Open in Safari".</li>'
    + '<li>Phones and laptop must be on the same Wi-Fi. Guest, hotel and campus networks often block this: use a phone hotspot instead. Allow Node through the firewall if asked.</li></ol>';
  if (embedded) {
    qrBox = el;
    urlEl = urlHost;
    altEl = document.getElementById('join-alt') || document.createElement('div');
    extras = document.getElementById('tk-join-extra');
    if (!extras) {
      extras = document.createElement('div'); extras.id = 'tk-join-extra'; extras.className = 'tk-join';
      (altEl.parentNode || el.parentNode).appendChild(extras);
    }
    extras.innerHTML = '';
    extras.append(wrong, help);
  } else {
    el.classList.add('tk-join');
    el.innerHTML = '';
    qrBox = document.createElement('div'); qrBox.className = 'tk-qr';
    urlEl = document.createElement('div'); urlEl.className = 'tk-url';
    altEl = document.createElement('div'); altEl.className = 'tk-alt';
    el.append(qrBox, urlEl, altEl, wrong, help);
  }

  let info = null; let idx = 0; let lastUrl = '';
  async function draw() {
    if (!info) return;
    const u = urlsFor(info, idx);
    wrong.hidden = u.ips.length < 2;
    // always (re)write the text: the engine's lobby writes its own http URL here at startup
    urlEl.textContent = u.join || 'Waiting for the server...';
    if (urlEl.dataset) urlEl.dataset.url = u.join || '';
    altEl.textContent = u.join !== u.http && u.http ? `No tilt? ${u.http} (touch steering only)` : '';
    if (!u.join || u.join === lastUrl) return;
    lastUrl = u.join;
    try {
      const qrcode = await loadQr();
      const qr = qrcode(0, 'M');
      qr.addData(u.join);
      qr.make();
      qrBox.innerHTML = qr.createSvgTag({ cellSize: 8, margin: 4, scalable: true });
      qrBox.title = u.join;
      qrBox.dataset.url = u.join;
    } catch (e) { qrBox.textContent = 'QR unavailable: type the address below.'; }
  }
  wrong.addEventListener('click', () => { idx++; lastUrl = ''; draw(); });

  async function refresh() {
    try {
      const r = await fetch('/api/info', { cache: 'no-store' });
      const next = await r.json();
      if (JSON.stringify([next.joinUrl, next.ips]) !== JSON.stringify(info && [info.joinUrl, info.ips])) lastUrl = '';
      info = next;
      draw();
    } catch (e) { /* retry next tick */ }
    return info;
  }
  await refresh();
  // HTTPS comes up a moment after HTTP, and the engine may overwrite the URL text once: re-check every 2 s
  const timer = setInterval(refresh, 2000);
  return { refresh, stop() { clearInterval(timer); }, get info() { return info; }, get joinUrl() { return urlEl.textContent; } };
}

const RTT_COLORS = ['#3ddc84', '#ffbe0b', '#ff4d6d'];

export function mountCards(el, net) {
  injectStyle();
  el.classList.add('tk-cards');
  const render = () => {
    el.innerHTML = '';
    for (const p of net.roster || []) {
      const c = document.createElement('div'); c.className = `tk-card${p.connected ? '' : ' off'}`; c.style.setProperty('--pc', p.color);
      const dot = document.createElement('span'); dot.className = 'tk-rtt';
      dot.style.background = !p.connected ? '#555' : p.rtt < 40 ? RTT_COLORS[0] : p.rtt < 100 ? RTT_COLORS[1] : RTT_COLORS[2];
      const n = document.createElement('span'); n.className = 'tk-n'; n.textContent = `${p.name}${p.ready ? ' ✓' : ''}`;
      const m = document.createElement('span'); m.className = 'tk-m';
      const drinks = p.lastState && p.lastState.drinks != null ? p.lastState.drinks : 0;
      m.textContent = `${p.mode} · ${p.transport} · ${p.rtt}ms · ${drinks} drinks`;
      const k = document.createElement('button'); k.type = 'button'; k.textContent = '✕'; k.title = 'Remove player';
      k.addEventListener('click', () => net.kick(p.slot));
      c.append(dot, n, m, k);
      el.appendChild(c);
    }
  };
  net.onRoster.push(render);
  render();
  return render;
}
