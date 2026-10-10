// Opt-in browser check against the real game: E2E=1 node --test tipsy-kart/test/impairment/
// Needs playwright-core (npm install in tipsy-kart/) and a Chromium (see e2e-browser.mjs).
import test from 'node:test';
import assert from 'node:assert/strict';

test('E2E impairment in the real game (4 players, drinks 0/2/5)', { skip: process.env.E2E ? false : 'set E2E=1 to run (needs playwright-core + Chromium, 2-5 minutes)', timeout: 900000 }, async () => {
  const { runE2E } = await import('./e2e-browser.mjs');
  const { results } = await runE2E({ log: (m) => console.log(m) });
  for (const r of results) assert.ok(r.ok, r.msg);
});
