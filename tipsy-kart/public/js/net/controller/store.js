// Tiny storage helpers. localStorage can throw or be empty (private windows, blocked site data),
// so every access is wrapped and the page keeps working from memory.

const mem = new Map();

export function lsGet(key) {
  try { const v = localStorage.getItem(key); if (v != null) return v; } catch (e) { /* blocked */ }
  return mem.has(key) ? mem.get(key) : null;
}

export function lsSet(key, value) {
  mem.set(key, String(value));
  try { localStorage.setItem(key, String(value)); } catch (e) { /* blocked */ }
}

export function ssGet(key) {
  try { return sessionStorage.getItem(key); } catch (e) { return null; }
}

export function ssSet(key, value) {
  try { sessionStorage.setItem(key, String(value)); } catch (e) { /* blocked */ }
}

export function lsJson(key, dflt) {
  try { const v = lsGet(key); return v ? Object.assign({}, dflt, JSON.parse(v)) : Object.assign({}, dflt); } catch (e) { return Object.assign({}, dflt); }
}

const TOKEN_RE = /^[A-Za-z0-9_-]{16,64}$/;

function newToken() {
  // crypto.randomUUID does not exist on plain-http origins, getRandomValues does.
  const b = new Uint8Array(16);
  (self.crypto || window.msCrypto).getRandomValues(b);
  let s = '';
  for (const x of b) s += String.fromCharCode(x);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Identity: the token lives in localStorage and moves between the http and https origins in the
 * URL hash (#tk=...&nm=...). The hash is consumed and removed on load.
 */
export function loadIdentity() {
  let tk = null; let nm = null;
  try {
    const h = new URLSearchParams(location.hash.replace(/^#/, ''));
    if (TOKEN_RE.test(h.get('tk') || '')) tk = h.get('tk');
    if (h.get('nm')) nm = h.get('nm');
    if (tk || nm) history.replaceState(null, '', location.pathname + location.search);
  } catch (e) { /* ignore */ }
  if (tk) lsSet('tipsyKart.token', tk);
  if (nm) lsSet('tipsyKart.name', nm.slice(0, 12));
  let token = lsGet('tipsyKart.token');
  if (!TOKEN_RE.test(token || '')) { token = newToken(); lsSet('tipsyKart.token', token); }
  return { token, name: lsGet('tipsyKart.name') || '' };
}
