'use strict';
// Tipsy Kart host server.
// Serves public/ (host display at "/", phone controller at "/controller"),
// prints the LAN URLs phones should open, and lets the optional network hub
// (net/hub.js, owned by the phone-controller lane) attach to the HTTP server.

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const DEFAULT_PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';
let PORT = DEFAULT_PORT;
const PUBLIC_DIR = path.join(__dirname, 'public');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.wasm': 'application/wasm',
};

// Host-side plugin entry points. When another lane ships one of these files
// the host page imports it automatically after window.game exists.
const PLUGIN_CANDIDATES = ['js/net/index.js', 'js/impairment/index.js'];

function lanAddresses() {
  const out = [];
  const ifaces = os.networkInterfaces();
  for (const name of Object.keys(ifaces)) {
    for (const addr of ifaces[name] || []) {
      const v4 = addr.family === 'IPv4' || addr.family === 4;
      if (v4 && !addr.internal) out.push(addr.address);
    }
  }
  return out;
}

function info() {
  const ips = lanAddresses();
  const lanUrls = ips.map((ip) => `http://${ip}:${PORT}/`);
  return {
    name: 'Tipsy Kart',
    port: PORT,
    lanUrls,
    controllerUrls: ips.map((ip) => `http://${ip}:${PORT}/controller`),
    plugins: PLUGIN_CANDIDATES.filter((p) => fs.existsSync(path.join(PUBLIC_DIR, p))),
  };
}

function send(res, status, body, type) {
  res.writeHead(status, { 'Content-Type': type || 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache' });
  res.end(body);
}

function serveFile(req, res, filePath) {
  fs.stat(filePath, (err, st) => {
    if (err) return send(res, 404, 'Not found');
    if (st.isDirectory()) return serveFile(req, res, path.join(filePath, 'index.html'));
    const type = MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type, 'Content-Length': st.size, 'Cache-Control': 'no-cache' });
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(filePath).on('error', () => res.destroy()).pipe(res);
  });
}

function handleRequest(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'Method not allowed');
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  } catch (e) {
    return send(res, 400, 'Bad request');
  }
  if (pathname === '/api/info') return send(res, 200, JSON.stringify(info()), MIME['.json']);
  if (pathname === '/favicon.ico') { res.writeHead(204); return res.end(); }
  if (pathname === '/') pathname = '/index.html';
  if (pathname === '/controller' || pathname === '/controller/') pathname = '/controller.html';

  const filePath = path.normalize(path.join(PUBLIC_DIR, pathname));
  if (filePath !== PUBLIC_DIR && !filePath.startsWith(PUBLIC_DIR + path.sep)) return send(res, 403, 'Forbidden');
  serveFile(req, res, filePath);
}

/**
 * Start the server. Resolves to { httpServer, port, httpsPort, close() }.
 * httpsPort is set when net/hub.js exposes ready()/info() with an httpsPort
 * (the controller lane's HTTPS server), otherwise it is null.
 * opts.port: port to bind (0 = random free port). opts.host: bind address.
 */
function start(opts = {}) {
  const port = opts.port ?? DEFAULT_PORT;
  const host = opts.host || HOST;
  const httpServer = http.createServer(handleRequest);

  // Optional network hub (phone-controller lane).
  const hubPath = path.join(__dirname, 'net', 'hub.js');
  let hub = null;
  if (fs.existsSync(hubPath)) {
    try {
      hub = require(hubPath);
      if (hub && typeof hub.attach === 'function') hub.attach(httpServer);
    } catch (e) {
      console.error('[tipsy-kart] failed to attach net/hub.js:', e);
    }
  }

  return new Promise((resolve, reject) => {
    httpServer.once('error', reject);
    httpServer.listen(port, host, async () => {
      httpServer.off('error', reject);
      PORT = httpServer.address().port;
      const httpsPort = await hubHttpsPort(hub);
      if (!opts.quiet) printBanner(httpsPort);
      resolve({
        httpServer,
        port: PORT,
        httpsPort,
        close: async () => {
          if (hub && typeof hub.close === 'function') {
            try { await hub.close(); } catch (e) { /* ignore */ }
          }
          await new Promise((res) => {
            if (typeof httpServer.closeAllConnections === 'function') httpServer.closeAllConnections();
            httpServer.close(() => res());
          });
        },
      });
    });
  });
}

/** Feature-detect the hub's HTTPS port: await hub.ready() (max 5 s), then hub.info().httpsPort. */
async function hubHttpsPort(hub) {
  if (!hub || typeof hub.info !== 'function') return null;
  try {
    if (typeof hub.ready === 'function') {
      let timer;
      await Promise.race([
        Promise.resolve(hub.ready()),
        new Promise((res) => { timer = setTimeout(res, 5000); }),
      ]);
      clearTimeout(timer);
    }
    const i = await hub.info();
    const p = i && Number(i.httpsPort);
    return Number.isInteger(p) && p > 0 ? p : null;
  } catch (e) {
    console.error('[tipsy-kart] net/hub.js info() failed:', e.message);
    return null;
  }
}

function printBanner(httpsPort) {
  const i = info();
  console.log('');
  console.log('  Tipsy Kart is running!');
  console.log(`  Host display (open on the laptop/TV):  http://localhost:${PORT}/`);
  if (i.lanUrls.length) {
    console.log('  Phones on the same Wi-Fi join at:');
    for (const u of i.controllerUrls) console.log(`    ${u}`);
    if (httpsPort) {
      console.log(`  Secure (HTTPS) controller on port ${httpsPort}:`);
      for (const ip of lanAddresses()) console.log(`    https://${ip}:${httpsPort}/controller`);
    }
  } else {
    console.log('  (No LAN IPv4 address found - phones cannot join until this machine is on a network.)');
  }
  console.log('');
}

module.exports = { start, info };

if (require.main === module) {
  start().catch((e) => {
    console.error('[tipsy-kart] failed to start:', e.message);
    process.exit(1);
  });
}
