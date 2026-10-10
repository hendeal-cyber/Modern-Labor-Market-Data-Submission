// DOM screens: lobby, race chrome, race results and cup standings.
import { TRACKS } from './tracks.js';
import { ordinal } from './viewports.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmtTime = (t) => {
  if (t === null || t === undefined) return '--';
  const m = Math.floor(t / 60), s = t - m * 60;
  return `${m}:${s.toFixed(2).padStart(5, '0')}`;
};

export class UI {
  constructor(game, root) {
    this.game = game;
    this.root = root;
    this.screens = {
      lobby: root.querySelector('#screen-lobby'),
      race: root.querySelector('#screen-race'),
      results: root.querySelector('#screen-results'),
      standings: root.querySelector('#screen-standings'),
    };
    this.cards = root.querySelector('#player-cards');
    const $ = (id) => root.querySelector('#' + id);

    $('btn-add-test').addEventListener('click', () => { game.audio.unlock(); game.addTestPlayer(); });
    $('btn-start').addEventListener('click', () => {
      game.startCup({ races: $('set-races').value, laps: $('set-laps').value, cpuCount: $('set-cpus').value });
    });
    $('btn-next').addEventListener('click', () => game.nextRace());
    $('btn-lobby').addEventListener('click', () => game.toLobby());
    $('btn-again').addEventListener('click', () => game.startCup());
    $('btn-quit').addEventListener('click', () => {
      if (window.confirm('Quit this cup and return to the lobby?')) game.toLobby();
    });
    const mute = document.getElementById('btn-mute');
    const paintMute = () => { mute.textContent = game.audio.muted ? 'Sound: off (M)' : 'Sound: on (M)'; };
    mute.addEventListener('click', () => { game.audio.unlock(); game.audio.toggleMute(); paintMute(); });
    window.addEventListener('keydown', (e) => {
      if (e.code === 'KeyM' && !/input|select|textarea/i.test(e.target.tagName)) { game.audio.unlock(); game.audio.toggleMute(); paintMute(); }
    });
    window.addEventListener('pointerdown', () => game.audio.unlock(), { once: true });
    paintMute();

    this.cards.addEventListener('click', (e) => {
      const b = e.target.closest('[data-remove]');
      if (b) game.removePlayer(Number(b.dataset.remove));
    });

    $('track-list').innerHTML = TRACKS.map((t, i) => `<li><b>${i + 1}. ${esc(t.name)}</b><span>${esc(t.blurb)}</span></li>`).join('');
    this.loadInfo();
    this.renderLobby();
    this.show('lobby');
  }

  async loadInfo() {
    const urlEl = this.root.querySelector('#join-url');
    try {
      const res = await fetch('/api/info', { cache: 'no-store' });
      const info = await res.json();
      this.info = info;
      const url = info.controllerUrls && info.controllerUrls[0] ? info.controllerUrls[0] : location.origin + '/controller';
      urlEl.textContent = url;
      urlEl.dataset.url = url;
      this.root.querySelector('#join-qr').dataset.url = url;
      if (info.controllerUrls && info.controllerUrls.length > 1) {
        this.root.querySelector('#join-alt').textContent = 'Also: ' + info.controllerUrls.slice(1).join('  ·  ');
      }
    } catch (e) {
      const url = location.origin + '/controller';
      urlEl.textContent = url;
      urlEl.dataset.url = url;
    }
  }

  show(name) {
    for (const [k, el] of Object.entries(this.screens)) el.classList.toggle('active', k === name);
    document.body.dataset.screen = name;
  }

  renderLobby() {
    const g = this.game;
    let html = '';
    for (let s = 0; s < 4; s++) {
      const p = g.player(s);
      if (p) {
        html += `<div class="card filled ${p.connected ? 'on' : 'off'}" data-slot="${s}" style="--pc:${esc(p.color)}">
          <div class="card-slot">P${s + 1}</div>
          <div class="card-name">${esc(p.name)}</div>
          <div class="card-status"><i></i>${p.connected ? 'Connected' : 'Disconnected'}</div>
          <div class="card-drinks"><b>${p.drinks || 0}</b> drinks · ${p.racesCompleted || 0} races</div>
          <button class="card-x" data-remove="${s}" title="Remove player">&times;</button>
        </div>`;
      } else {
        html += `<div class="card empty" data-slot="${s}">
          <div class="card-slot">P${s + 1}</div>
          <div class="card-name">Waiting for player&hellip;</div>
          <div class="card-status">Scan the code to join</div>
        </div>`;
      }
    }
    this.cards.innerHTML = html;
    const n = g.session.players.length;
    const start = this.root.querySelector('#btn-start');
    start.textContent = n ? `Start Cup (${n} player${n > 1 ? 's' : ''})` : 'Start Cup';
    this.root.querySelector('#btn-add-test').disabled = n >= 4;
  }

  raceBanner(title, sub) {
    const b = this.root.querySelector('#race-banner');
    b.innerHTML = `<b>${esc(title)}</b><span>${esc(sub)}</span>`;
    b.classList.remove('show');
    void b.offsetWidth;
    b.classList.add('show');
  }

  showResults(results, { raceIndex, totalRaces, trackName }) {
    const g = this.game;
    this.root.querySelector('#results-title').textContent = `Race ${raceIndex + 1} of ${totalRaces}`;
    this.root.querySelector('#results-sub').textContent = trackName;
    const rows = results.map((r) => {
      const p = r.isHuman ? g.player(r.slot) : null;
      return `<tr class="${r.isHuman ? 'human' : ''}" style="--c:${esc(this.colorOf(r))}">
        <td class="place">${ordinal(r.place)}</td>
        <td class="who"><span class="dot"></span>${esc(r.name)}${r.isHuman ? ` <small>P${r.slot + 1}</small>` : ''}</td>
        <td>${r.finished ? fmtTime(r.time) : 'DNF'}</td>
        <td class="pts">+${r.points}</td>
        <td class="tot">${r.totalPoints}</td>
        <td class="drinks">${p ? `${p.drinks || 0}` : ''}</td>
      </tr>`;
    }).join('');
    this.root.querySelector('#results-body').innerHTML = rows;
    this.root.querySelector('#btn-next').textContent = raceIndex + 1 < totalRaces ? 'Next race' : 'Final standings';
    this.show('results');
  }

  colorOf(r) {
    if (typeof r.color === 'string') return r.color;
    return '#' + (r.color >>> 0).toString(16).padStart(6, '0');
  }

  showStandings(standings) {
    const g = this.game;
    const podium = standings.slice(0, 3);
    const order = [1, 0, 2].filter((i) => podium[i]);
    this.root.querySelector('#podium').innerHTML = order.map((i) => {
      const r = podium[i];
      return `<div class="step s${i + 1}" style="--c:${esc(r.color)}"><div class="pname">${esc(r.name)}</div><div class="block"><b>${i + 1}</b><span>${r.points} pts</span></div></div>`;
    }).join('');
    this.root.querySelector('#standings-body').innerHTML = standings.map((r) => {
      const p = r.isHuman ? g.player(r.slot) : null;
      return `<tr class="${r.isHuman ? 'human' : ''}" style="--c:${esc(r.color)}">
        <td class="place">${ordinal(r.rank)}</td>
        <td class="who"><span class="dot"></span>${esc(r.name)}${r.isHuman ? ` <small>P${r.slot + 1}</small>` : ''}</td>
        <td class="tot">${r.points}</td>
        <td class="drinks">${p ? p.drinks || 0 : ''}</td>
      </tr>`;
    }).join('');
    this.show('standings');
  }
}
