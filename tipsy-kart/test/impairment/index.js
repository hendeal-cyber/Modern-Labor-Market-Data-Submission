'use strict';
// Shim so that `node --test tipsy-kart/test/impairment/` works on Node 22+,
// where a directory argument is resolved as a module (-> this index.js) instead
// of being searched for tests. It simply loads every *.test.mjs in this folder.
// (Node 18/20 recurse into the directory themselves; this file is harmless there.)
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

for (const f of fs.readdirSync(__dirname).filter((n) => n.endsWith('.test.mjs')).sort()) {
  import(pathToFileURL(path.join(__dirname, f)).href).catch((e) => {
    console.error(e);
    process.exitCode = 1;
  });
}
