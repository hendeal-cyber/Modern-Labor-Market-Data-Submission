'use strict';
// TLS material for the HTTPS origin (phone-controls spec 4.2).
// Order: TIPSY_CERT/TIPSY_KEY -> cached .cert/ -> `selfsigned` -> openssl CLI -> null (HTTP only).

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const DAY = 864e5;

function certDir() {
  return process.env.TIPSY_CERT_DIR || path.join(__dirname, '..', '.cert');
}

function describe(certPem, keyPem, source) {
  const x = new crypto.X509Certificate(certPem);
  return { key: keyPem, cert: certPem, fingerprint: x.fingerprint256, source, validTo: x.validTo, san: x.subjectAltName || '' };
}

/** True when a cached cert still has >7 days left and covers every LAN IP. */
function cachedIsUsable(certPem, ips) {
  try {
    const x = new crypto.X509Certificate(certPem);
    if (new Date(x.validTo).getTime() - Date.now() < 7 * DAY) return false;
    const san = x.subjectAltName || '';
    return ips.every((ip) => san.includes(`IP Address:${ip}`));
  } catch (e) { return false; }
}

async function viaSelfsigned(ips) {
  const selfsigned = require('selfsigned');
  const pems = await selfsigned.generate([{ name: 'commonName', value: 'Tipsy Kart LAN' }], {
    keyType: 'rsa', keySize: 2048, algorithm: 'sha256',
    notAfterDate: new Date(Date.now() + 365 * DAY),
    extensions: [
      { name: 'basicConstraints', cA: false },
      { name: 'keyUsage', digitalSignature: true, keyEncipherment: true },
      { name: 'extKeyUsage', serverAuth: true },
      { name: 'subjectAltName', altNames: [
        { type: 2, value: 'localhost' }, { type: 7, ip: '127.0.0.1' },
        ...ips.filter((ip) => ip !== '127.0.0.1').map((ip) => ({ type: 7, ip })),
      ] },
    ],
  });
  return { key: pems.private, cert: pems.cert };
}

function viaOpenssl(ips, dir) {
  const san = ['DNS:localhost', 'IP:127.0.0.1', ...ips.filter((ip) => ip !== '127.0.0.1').map((ip) => `IP:${ip}`)].join(',');
  const k = path.join(dir, 'key.pem');
  const c = path.join(dir, 'cert.pem');
  execFileSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-sha256', '-days', '365',
    '-subj', '/CN=Tipsy Kart LAN', '-keyout', k, '-out', c,
    '-addext', `subjectAltName=${san}`, '-addext', 'extendedKeyUsage=serverAuth', '-addext', 'basicConstraints=CA:FALSE'],
  { stdio: 'ignore' });
  return { key: fs.readFileSync(k, 'utf8'), cert: fs.readFileSync(c, 'utf8') };
}

function persist(dir, pair) {
  try {
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'key.pem'), pair.key, { mode: 0o600 });
    fs.writeFileSync(path.join(dir, 'cert.pem'), pair.cert);
  } catch (e) { /* a read-only checkout still works, it just regenerates next start */ }
}

/**
 * @param {string[]} ips LAN addresses the cert must cover
 * @param {(msg:string)=>void} log
 * @param {{skipSelfsigned?:boolean}} [opts] test hook to exercise the openssl fallback
 * @returns {Promise<{key,cert,fingerprint,source,regenerated?:boolean}|null>}
 */
async function getTlsOptions(ips = [], log = () => {}, opts = {}) {
  if (process.env.TIPSY_CERT && process.env.TIPSY_KEY) {
    try {
      return describe(fs.readFileSync(process.env.TIPSY_CERT, 'utf8'), fs.readFileSync(process.env.TIPSY_KEY, 'utf8'), 'user');
    } catch (e) { log(`TIPSY_CERT/TIPSY_KEY unreadable (${e.message}); generating a self-signed certificate instead`); }
  }
  const dir = certDir();
  let hadCache = false;
  try {
    const cert = fs.readFileSync(path.join(dir, 'cert.pem'), 'utf8');
    const key = fs.readFileSync(path.join(dir, 'key.pem'), 'utf8');
    hadCache = true;
    if (cachedIsUsable(cert, ips)) return describe(cert, key, 'cache');
  } catch (e) { /* no cache */ }

  let pair = null; let source = null;
  if (!opts.skipSelfsigned && process.env.TIPSY_NO_SELFSIGNED !== '1') {
    try { pair = await viaSelfsigned(ips); source = 'selfsigned'; } catch (e) { log(`selfsigned unavailable (${e.message}); trying openssl`); }
  }
  if (!pair) {
    try { fs.mkdirSync(dir, { recursive: true }); pair = viaOpenssl(ips, dir); source = 'openssl'; } catch (e) { log(`openssl failed (${e.message})`); }
  }
  if (!pair) return null;
  persist(dir, pair);
  const out = describe(pair.cert, pair.key, source);
  out.regenerated = hadCache; // phones will see the browser warning again
  return out;
}

module.exports = { getTlsOptions, certDir, cachedIsUsable };
