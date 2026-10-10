// Tipsy Kart phone controller: wiring (phone-controls spec section 3).
// join -> (calibrate) -> pad / lobby card, with overlays for rotate, reconnect, full, kicked.

import { loadIdentity, lsGet, lsSet, lsJson, ssGet } from './store.js';
import { Link } from './link.js';
import { Tilt } from './tilt.js';
import { Controls } from './controls.js';
import { Haptics, isIos } from './haptics.js';

const $ = (id) => document.getElementById(id);
const ORD = ['th', 'st', 'nd', 'rd'];
const ordinal = (n) => { const v = n % 100; return n + (ORD[(v - 20) % 10] || ORD[v] || ORD[0]); };
const clean = (s) => String(s || '').replace(/[\u0000-\u001f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 12);

// ---------------------------------------------------------------- page hygiene (3.2)
for (const ev of ['gesturestart', 'gesturechange', 'gestureend']) document.addEventListener(ev, (e) => e.preventDefault());
document.addEventListener('touchmove', (e) => { if (!(e.target.closest && e.target.closest('#settings'))) e.preventDefault(); }, { passive: false });
document.addEventListener('contextmenu', (e) => e.preventDefault());
document.addEventListener('dblclick', (e) => e.preventDefault());

// ---------------------------------------------------------------- state
const ident = loadIdentity();
const DEFAULTS = { mode: 'tilt', maxDeg: 28, invert: false, autoGas: false, lefty: false, haptics: true };
const settings = lsJson('tipsyKart.settings', DEFAULTS);
const saveSettings = () => lsSet('tipsyKart.settings', JSON.stringify(settings));

const S = {
  token: ident.token, name: clean(ident.name),
  started: false, calibrating: false, mode: 'touch', tiltAvail: false, tiltWhy: '', perm: 'n/a',
  slot: null, color: '#FF4D6D', colorName: '', everWelcomed: false, resumed: false, queuePos: 0,
  phase: 'lobby', place: null, of: null, lap: null, laps: null, item: null, drinks: 0,
  impair: { level: 0, label: '' }, rtt: 0, hostConnected: true, ready: false,
  ended: null, secureFailed: false, urls: null, settingsOpen: false, wakeTip: false,
};

const haptics = new Haptics($('flash'), () => settings.haptics);
const tilt = new Tilt(settings);
const link = new Link({
  token: S.token,
  hello: () => ({
    t: 'hello', v: 1, role: 'phone', token: S.token, name: S.name || '',
    caps: { secure: window.isSecureContext === true, tilt: S.tiltAvail, vibrate: haptics.canVibrate, ios: isIos(), transport: link.transport },
  }),
});

const els = {
  rightCol: $('rightCol'), driftBand: $('driftBand'), gasArea: $('gasArea'), brakeStrip: $('brakeStrip'),
  stickZone: $('stickZone'), stickBase: $('stickBase'), stickKnob: $('stickKnob'), itemBtn: $('itemBtn'), brakeBtn: $('brakeBtn'),
};
const controls = new Controls(els, () => sendNow(), { keepOnRotate: () => phaseIsPad() });

// iOS native switch haptic on direct ITEM taps (not on DRIFT: a rolled-in thumb never "taps" it)
if (isIos()) Haptics.attachSwitch(els.itemBtn);

// ---------------------------------------------------------------- input send loop (2.1, 2.3)
let seq = 0; let lastSent = null; let lastSentAt = 0; let liveSteer = 0;

function buildInput() {
  const c = controls.read();
  const tiltMode = S.mode === 'tilt';
  const padOn = controls.active;
  const raw = tiltMode ? tilt.steer() : c.stick;
  liveSteer = raw;                 // the lobby card gauge still shows tilt feedback
  const steer = padOn ? raw : 0;   // but nothing steers the kart unless the pad is up
  let throttle = c.throttle;
  if (padOn && settings.autoGas && !c.brake) throttle = 1;
  return { steer, throttle: padOn ? throttle : 0, brake: padOn ? c.brake : 0, drift: padOn ? c.drift : false, item: controls.itemCount, mode: S.mode };
}

function differs(a, b) {
  return !b || a.steer !== b.steer || a.throttle !== b.throttle || a.brake !== b.brake || a.drift !== b.drift || a.item !== b.item || a.mode !== b.mode;
}

function emitInput(inp) {
  lastSent = inp; lastSentAt = performance.now();
  link.sendInput(Object.assign({ t: 'input', seq: ++seq }, inp));
}

/** Button edges go out immediately, ignoring the 30 Hz limit. */
function sendNow() { if (link.welcomed) emitInput(buildInput()); }

setInterval(() => {
  const now = performance.now();
  const inp = buildInput();
  if (differs(inp, lastSent) ? now - lastSentAt >= 33 : now - lastSentAt >= 100) emitInput(inp); // <=30 Hz changing, 10 Hz heartbeat
  paintGauges();
}, 16);

// ---------------------------------------------------------------- rendering
const show = (el, on) => el.classList.toggle('hidden', !on);

function cupSvg() {
  return '<svg viewBox="0 0 12 14" aria-hidden="true"><path d="M1 1h10l-1.4 11.2a1 1 0 0 1-1 .8H3.4a1 1 0 0 1-1-.8z" fill="currentColor" opacity=".9"/><path d="M1.6 4h8.8" stroke="#111" stroke-width="1"/></svg>';
}

function paintGauges() {
  const deg = Math.round(liveSteer * 70);
  const w = $('wheelSvg'); if (w) w.style.transform = `rotate(${deg}deg)`;
  const wn = $('wheelNum'); if (wn && S.mode === 'tilt') wn.textContent = liveSteer ? liveSteer.toFixed(2) : '';
  const k = $('cardGaugeKnob'); if (k && S.mode === 'tilt') k.style.left = `${50 + liveSteer * 48}%`;
}

function phaseIsPad() { return S.phase === 'countdown' || S.phase === 'racing'; }

function render() {
  document.documentElement.style.setProperty('--c', S.color);
  const meta = document.querySelector('meta[name=theme-color]'); if (meta) meta.content = '#111111';

  // join screen info
  const j = $('joinStatus');
  if (S.queuePos > 0 && S.slot == null) j.textContent = `Room is full: you're #${S.queuePos} in line`;
  else if (S.slot != null) j.textContent = S.resumed ? `Welcome back, ${S.name || S.colorName}` : `You're ${S.colorName} (player ${S.slot + 1})`;
  else if (link.status === 'reconnecting') j.textContent = 'Reconnecting...';
  else j.textContent = 'Connecting...';
  if (!$('name').value && S.name && document.activeElement !== $('name')) $('name').value = S.name;
  $('name').placeholder = S.name || 'Your name';

  const insecure = window.isSecureContext !== true;
  $('joinNote').textContent = insecure
    ? 'This is the basic link: touch steering only. Tilt needs the secure link.'
    : (S.slot != null ? 'Tilt steering needs motion access, which your phone will ask for.' : '');
  show($('joinSecure'), insecure && !!secureHref());
  $('joinSecure').href = secureHref() || '#';

  // which screen
  const inGame = S.started && !S.ended && !(S.queuePos > 0 && S.slot == null);
  show($('join'), !S.started && !S.ended);
  show($('calib'), S.started && S.calibrating && !S.ended);
  const padShown = inGame && !S.calibrating && phaseIsPad();
  const cardShown = inGame && !S.calibrating && !phaseIsPad();
  show($('pad'), padShown || (inGame && S.calibrating && false));
  show($('card'), cardShown);
  $('pad').classList.toggle('mode-tilt', S.mode === 'tilt');
  $('pad').classList.toggle('mode-touch', S.mode !== 'tilt');
  document.getElementById('app').classList.toggle('lefty', !!settings.lefty);
  controls.setActive(padShown);
  // while racing a hard roll may rotate an iPhone to portrait: never block the pad, just hint
  document.body.classList.toggle('racing', padShown);

  // overlays
  const everIn = S.everWelcomed || S.slot != null;
  show($('full'), S.started && S.queuePos > 0 && S.slot == null && !S.ended);
  $('queuePos').textContent = String(S.queuePos);
  show($('ended'), !!S.ended);
  if (S.ended) {
    $('endedTitle').textContent = S.ended.title;
    $('endedText').textContent = S.ended.text;
    show($('rejoin'), S.ended.canRejoin);
  }
  show($('recon'), !S.ended && S.started && link.status !== 'online');
  $('reconText').textContent = everIn ? 'Reconnecting... your spot is saved' : 'Connecting...';
  show($('basicLink'), S.secureFailed && !!basicHref());
  $('basicLink').href = basicHref() || '#';
  show($('wait'), !S.ended && S.started && link.status === 'online' && S.slot != null && S.hostConnected === false && !(S.queuePos > 0));
  show($('settings'), S.settingsOpen);

  renderHud();
  renderSettings();
}

function renderHud() {
  $('statNum').textContent = S.slot != null ? String(S.slot + 1) : '-';
  $('statName').textContent = S.name || S.colorName || '';
  const bits = [];
  if (S.place != null && S.of) bits.push(`<b>${ordinal(S.place)}</b> / ${S.of}`);
  if (S.lap != null && S.laps) bits.push(`Lap ${Math.min(S.lap, S.laps)}/${S.laps}`);
  bits.push(S.item ? `Item: ${String(S.item)}` : 'No item');
  $('statMid').innerHTML = bits.join(' &middot; ');
  $('itemName').textContent = S.item ? String(S.item) : '';
  const n = Math.max(0, Math.floor(S.drinks || 0));
  $('cups').innerHTML = n <= 5 ? cupSvg().repeat(n) : `${cupSvg()}<span class="more">x${n}</span>`;
  const lvl = Math.max(0, Math.min(1, Number(S.impair && S.impair.level) || 0));
  const filled = Math.ceil(lvl * 5 - 1e-9);
  [...$('meter').children].forEach((el, i) => el.classList.toggle('on', i < filled));
  const label = (S.impair && S.impair.label) || '';
  $('tipLabel').textContent = label;
  $('meter').title = label;

  // card
  const titles = { lobby: 'Lobby', finished: 'You finished!', results: 'Race results', cupResults: 'Cup results', countdown: 'Get ready', racing: 'Racing' };
  $('cardTitle').textContent = titles[S.phase] || 'Lobby';
  let result = '';
  if (S.phase === 'lobby') result = S.hostConnected ? 'Pick your name, then tap ready.' : 'Waiting for the big screen...';
  else if (S.place != null) result = `You are ${ordinal(S.place)}${S.of ? ` of ${S.of}` : ''}.`;
  $('cardResult').textContent = result;
  $('cardDrinksN').textContent = String(n);
  $('readyBtn').textContent = S.ready ? 'Not ready' : "I'm ready";
  show($('readyBtn'), S.phase === 'lobby');
  show($('cardGauge'), S.mode === 'tilt');
}

function secureHref() {
  if (!S.urls || !S.urls.httpsPort) return null;
  return `https://${location.hostname}:${S.urls.httpsPort}/controller#tk=${S.token}&nm=${encodeURIComponent(S.name || '')}`;
}
function basicHref() {
  if (!S.urls || !S.urls.httpPort) return null;
  return `http://${location.hostname}:${S.urls.httpPort}/controller#tk=${S.token}&nm=${encodeURIComponent(S.name || '')}`;
}

function renderSettings() {
  if (!S.settingsOpen) return;
  for (const b of $('setMode').querySelectorAll('button')) {
    b.classList.toggle('on', b.dataset.mode === S.mode);
    b.disabled = b.dataset.mode === 'tilt' && !S.tiltAvail && S.started;
  }
  $('setRange').value = String(settings.maxDeg);
  $('setRangeN').textContent = `${settings.maxDeg}°`;
  $('setInvert').checked = !!settings.invert;
  $('setAuto').checked = !!settings.autoGas;
  $('setLefty').checked = !!settings.lefty;
  $('setHaptics').checked = !!settings.haptics;
  if (document.activeElement !== $('setName')) $('setName').value = S.name;
  $('conninfo').textContent = `Link: ${link.transport === 'ws' ? (location.protocol === 'https:' ? 'wss' : 'ws') : 'sse'} · ${S.rtt} ms · ${link.status}${S.slot != null ? ` · player ${S.slot + 1}` : ''}`;
  const why = {
    insecure: 'Tilt needs the secure link (https). This basic link only has touch steering.',
    denied: 'Motion access was blocked. Close the Safari tab and reopen the link to be asked again.',
    nosensor: 'No motion sensor found on this device, so touch steering is used.',
    android: 'No motion data. If this phone has a motion sensor: Chrome \u22ee \u2192 Site settings \u2192 Motion sensors \u2192 Allow, then reload.',
    '': '',
  }[S.tiltWhy] || '';
  $('whyTiltText').textContent = why;
  show($('whyTilt'), !!why);
  show($('secureLink'), S.tiltWhy === 'insecure' && !!secureHref());
  $('secureLink').href = secureHref() || '#';
}

let toastTimer = null;
function toast(text, ms = 2500) {
  const t = $('toast'); t.textContent = text; show(t, true);
  clearTimeout(toastTimer); toastTimer = setTimeout(() => show(t, false), ms);
}

// ---------------------------------------------------------------- join gesture (3.1)
let wakeLock = null;
async function requestWake() {
  try {
    if (!('wakeLock' in navigator)) throw new Error('none');
    wakeLock = await navigator.wakeLock.request('screen');
    wakeLock.addEventListener('release', () => { wakeLock = null; });
  } catch (e) {
    // without a secure context there is no Wake Lock API at all: tell people once
    if (!S.wakeTip && window.isSecureContext !== true) { S.wakeTip = true; toast('Tip: set Auto-Lock to Never during the party', 5000); }
  }
}
let fsLost = false; let wantFs = false;
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible' || !S.started) return;
  requestWake();
  if (wantFs) fsLost = true; // Android drops fullscreen + the orientation lock after an app switch
});
function regainScreen() {
  if (!S.started) return;
  if (wakeLock === null) requestWake();
  if (fsLost && !document.fullscreenElement) {
    fsLost = false;
    try {
      Promise.resolve(document.documentElement.requestFullscreen({ navigationUI: 'hide' }))
        .then(() => (screen.orientation && screen.orientation.lock ? screen.orientation.lock('landscape') : null)).catch(() => {});
    } catch (e) { /* not available */ }
  } else fsLost = false;
}
for (const id of ['pad', 'card']) $(id).addEventListener('pointerdown', regainScreen, true);

$('go').addEventListener('click', () => {
  // ---- everything needing the user gesture runs synchronously, before any await
  let permP = null;
  try {
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') permP = DeviceOrientationEvent.requestPermission();
  } catch (e) { permP = Promise.resolve('denied'); }
  try {
    const de = document.documentElement;
    if (document.fullscreenEnabled && de.requestFullscreen) {
      wantFs = true;
      Promise.resolve(de.requestFullscreen({ navigationUI: 'hide' })).then(() => {
        if (screen.orientation && screen.orientation.lock) return screen.orientation.lock('landscape');
        return null;
      }).catch(() => {});
    }
  } catch (e) { /* not available (iPhone) */ }
  requestWake();
  haptics.prime();
  $('name').blur();
  const nm = clean($('name').value) || S.name;
  go(nm, permP);
});

async function go(nm, permP) {
  let perm = 'n/a';
  if (permP) { try { perm = await permP; } catch (e) { perm = 'denied'; } }
  S.perm = perm;
  let tiltOk = false; let why = '';
  if (window.isSecureContext !== true) why = 'insecure';
  else if (!('DeviceOrientationEvent' in window)) why = 'nosensor';
  else if (perm === 'denied') why = 'denied';
  else { tiltOk = await tilt.start(); if (!tiltOk) why = /Android/i.test(navigator.userAgent) ? 'android' : 'nosensor'; }
  S.tiltAvail = tiltOk; S.tiltWhy = why;
  S.mode = tiltOk && settings.mode !== 'touch' ? 'tilt' : 'touch';
  if (nm && nm !== S.name) { S.name = nm; lsSet('tipsyKart.name', nm); link.send({ t: 'name', name: nm }); }
  S.started = true;
  S.calibrating = S.mode === 'tilt';
  armBackGuard();
  render();
}

// A stray Back swipe must not drop a racer out of the game.
let backGuard = false;
function armBackGuard() {
  if (backGuard) return;
  backGuard = true;
  try { history.pushState({ tipsyGuard: 1 }, ''); } catch (e) { /* ignore */ }
  window.addEventListener('popstate', () => {
    if (!S.started || S.ended) return;
    try { history.pushState({ tipsyGuard: 1 }, ''); } catch (e) { /* ignore */ }
    toast('Use Settings \u2192 Leave to quit', 3000);
  });
}

$('calibGo').addEventListener('click', async () => {
  $('calibGo').disabled = true;
  await tilt.calibrate();
  $('calibGo').disabled = false;
  S.calibrating = false; render();
});
$('calibSkipTouch').addEventListener('click', () => { setMode('touch'); S.calibrating = false; render(); });

// ---------------------------------------------------------------- settings
function setMode(m) {
  if (m === 'tilt' && !S.tiltAvail) return;
  S.mode = m; settings.mode = m; saveSettings();
  controls.releaseAll();
  render();
}
for (const b of $('setMode').querySelectorAll('button')) b.addEventListener('click', () => { setMode(b.dataset.mode); if (b.dataset.mode === 'tilt') tilt.calibrate(); });
$('setRange').addEventListener('input', (e) => { settings.maxDeg = Number(e.target.value); saveSettings(); renderSettings(); });
$('setInvert').addEventListener('change', (e) => { settings.invert = e.target.checked; saveSettings(); });
$('setAuto').addEventListener('change', (e) => { settings.autoGas = e.target.checked; saveSettings(); });
$('setLefty').addEventListener('change', (e) => { settings.lefty = e.target.checked; saveSettings(); render(); });
$('setHaptics').addEventListener('change', (e) => { settings.haptics = e.target.checked; saveSettings(); if (e.target.checked) haptics.cue('tick'); });
$('setCal').addEventListener('click', async () => { await tilt.calibrate(); toast('Calibrated'); });
$('setName').addEventListener('change', (e) => {
  const nm = clean(e.target.value);
  if (nm) { S.name = nm; lsSet('tipsyKart.name', nm); link.send({ t: 'name', name: nm }); render(); }
});
const openSettings = () => { S.settingsOpen = true; controls.releaseAll(); render(); };
$('gear').addEventListener('click', openSettings);
$('cardGear').addEventListener('click', openSettings);
$('setClose').addEventListener('click', () => { S.settingsOpen = false; render(); });
$('setLeave').addEventListener('click', () => {
  link.send({ t: 'leave' });
  link.terminal = 'left';
  S.settingsOpen = false; S.slot = null; S.everWelcomed = false;
  S.ended = { title: 'You left the game', text: 'Your spot was released.', canRejoin: true };
  render();
});
$('rejoin').addEventListener('click', () => {
  S.ended = null; S.slot = null; S.queuePos = 0; S.everWelcomed = false;
  link.rejoin();
  render();
});
// double-tap the steering wheel indicator to recalibrate
let lastWheelTap = 0;
$('wheel').addEventListener('pointerdown', () => {
  const now = performance.now();
  if (now - lastWheelTap < 400) { tilt.calibrate(); toast('Calibrated'); }
  lastWheelTap = now;
});
$('readyBtn').addEventListener('click', () => { S.ready = !S.ready; link.send({ t: 'ready', ready: S.ready }); render(); });
$('drinkPlus').addEventListener('click', () => link.send({ t: 'drink', delta: 1 }));
$('drinkMinus').addEventListener('click', () => link.send({ t: 'drink', delta: -1 }));

// ---------------------------------------------------------------- link events
link.on('welcome', (m) => {
  S.slot = m.slot; S.color = m.color; S.colorName = m.colorName; S.resumed = !!m.resumed; S.queuePos = 0;
  S.everWelcomed = true; S.secureFailed = false;
  if (!S.name || S.name !== m.name) S.name = m.name;
  if (m.phase) S.phase = m.phase;
  S.ended = null;
  render();
});
link.on('state', (m) => {
  const prev = (S.impair && S.impair.level) || 0;
  for (const k of ['phase', 'place', 'of', 'lap', 'laps', 'item', 'drinks', 'impair', 'rtt', 'hostConnected', 'ready']) if (k in m) S[k] = m[k];
  const now = (S.impair && S.impair.level) || 0;
  if (now > prev + 1e-6) {
    haptics.cue('drink');
    const mt = $('meter'); mt.classList.remove('flash'); void mt.offsetWidth; mt.classList.add('flash');
  }
  render();
});
link.on('vibe', (m) => haptics.cue(m.cue));
link.on('toast', (m) => toast(String(m.text || ''), Number(m.ms) || 2500));
link.on('full', (m) => { S.queuePos = m.queuePos; render(); });
link.on('kicked', (m) => {
  const idle = m && m.reason === 'idle';
  S.ended = { title: 'You were removed', text: idle ? 'You were idle in the lobby for too long.' : 'The host removed you from the game.', canRejoin: true };
  S.slot = null; S.everWelcomed = false; controls.releaseAll(); render();
});
link.on('replaced', () => { S.ended = { title: 'Opened somewhere else', text: 'This game is open in another tab or window on this phone.', canRejoin: true }; render(); });
link.on('fatal', () => { S.ended = { title: 'Could not join', text: 'The server refused this connection.', canRejoin: false }; render(); });
link.on('secureFailed', () => { S.secureFailed = true; render(); });
link.on('status', () => render());
link.on('transport', () => render());

// ---------------------------------------------------------------- boot
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') controls.releaseAll(); });
screen.orientation && screen.orientation.addEventListener && screen.orientation.addEventListener('change', render);
fetch('/api/info', { cache: 'no-store' }).then((r) => r.json()).then((i) => { S.urls = i; render(); }).catch(() => {});
if (ssGet('tipsyKart.transport') === 'sse') link.transport = 'sse';
// Where no permission prompt exists (Android, desktop) listen from the start, so the sensor is
// already known to work by the time the player taps "Let's go".
if (window.isSecureContext && 'DeviceOrientationEvent' in window && typeof DeviceOrientationEvent.requestPermission !== 'function') tilt.listen();
render();
link.start();

// Debug / test handle (also used by test/net/phones.e2e.test.js)
window.tipsyController = { S, settings, link, tilt, controls, haptics, buildInput };
