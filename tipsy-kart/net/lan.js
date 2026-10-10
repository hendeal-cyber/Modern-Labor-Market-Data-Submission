'use strict';
// LAN address discovery and ranking (phone-controls spec 1.3).
// os.networkInterfaces() -> IPv4, non-internal, scored so that the address a
// phone on the same Wi-Fi is most likely to reach comes first.

const os = require('os');

const GOOD_NAME = /^(en\d|wlan|wlp|wl|eth|Wi-?Fi|Wireless|Ethernet)/i;
const BAD_NAME = /(docker|br-|veth|vboxnet|vmnet|virbr|utun|tun|tap|zt|tailscale|wg|vEthernet|VirtualBox|VMware|Hyper-V|WSL|Loopback)/i;

function inCgnat(ip) { // 100.64.0.0/10
  const p = ip.split('.').map(Number);
  return p[0] === 100 && p[1] >= 64 && p[1] <= 127;
}

function score(ip, name) {
  let s = 0;
  if (ip.startsWith('192.168.')) s += 30;
  else if (ip.startsWith('10.')) s += 20;
  else if (/^172\.(1[6-9]|2\d|3[01])\./.test(ip)) s += 10;
  if (GOOD_NAME.test(name)) s += 5;
  if (BAD_NAME.test(name)) s -= 100;
  if (ip.startsWith('192.168.56.') || inCgnat(ip)) s -= 50;
  return s;
}

/** Ranked list of {ip, name, score}, best first. TIPSY_HOST forces one address to the front. */
function rankedLanInterfaces(ifaces = os.networkInterfaces(), env = process.env) {
  const out = [];
  for (const name of Object.keys(ifaces || {})) {
    for (const a of ifaces[name] || []) {
      const v4 = a.family === 'IPv4' || a.family === 4; // Node 18.0-18.3 reported a number
      if (!v4 || a.internal) continue;
      if (a.address.startsWith('169.254.')) continue;
      out.push({ ip: a.address, name, score: score(a.address, name) });
    }
  }
  out.sort((x, y) => y.score - x.score);
  const forced = (env.TIPSY_HOST || '').trim();
  if (forced) {
    const rest = out.filter((o) => o.ip !== forced);
    return [{ ip: forced, name: 'TIPSY_HOST', score: 999 }, ...rest];
  }
  return out;
}

function getLanIps(ifaces, env) {
  const seen = new Set();
  return rankedLanInterfaces(ifaces, env).map((o) => o.ip).filter((ip) => (seen.has(ip) ? false : (seen.add(ip), true)));
}

/** Every address that belongs to this machine (used to recognise "the host page on this laptop"). */
function localAddresses(ifaces = os.networkInterfaces()) {
  const set = new Set(['127.0.0.1', '::1']);
  for (const name of Object.keys(ifaces || {})) for (const a of ifaces[name] || []) set.add(a.address);
  return set;
}

function isWsl() {
  try { return /microsoft/i.test(os.release()); } catch (e) { return false; }
}

/** Human hints printed in the banner / shown on the lobby help panel. */
function hints() {
  const out = [];
  if (isWsl()) out.push('WSL2 detected: phones cannot reach the WSL2 NAT address. Run Node on Windows, or set networkingMode=mirrored in .wslconfig.');
  out.push('If a firewall asks about Node, allow it on Private networks (Windows) or click Allow (macOS).');
  out.push('Guest, hotel and campus Wi-Fi often isolates clients; use a phone or laptop hotspot everyone joins.');
  return out;
}

module.exports = { rankedLanInterfaces, getLanIps, localAddresses, isWsl, hints, score };
