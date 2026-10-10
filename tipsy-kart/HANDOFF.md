# Tipsy Kart: Handoff

This file is a resume point. It lets a fresh session pick the project up if the current container is lost.

## Project

Tipsy Kart is an ORIGINAL browser-based 3D kart racer for Beerio-Kart-style party play. Up to 4 humans play on phones, with CPU karts filling the field, and everything is served from a localhost Node server (`npm start`).

IP rule: no code, data or assets are copied from Nintendo or Mario Kart. That includes riidefi/mkw, snailspeed3/mkw and any other Mario Kart decompilation. Do not clone, fetch or copy from them.

## Where things live

The game is in the `tipsy-kart/` folder of `hendeal-cyber/Modern-Labor-Market-Data-Submission`, on branch `claude/beerio-kart-multiplayer-t2w870`. That branch is the integration branch.

Lane branches. They exist locally in the original container, and each one is worked on in its own git worktree under `.claude/worktrees/`:

| Branch | Model | Purpose | Status on the integration branch |
| --- | --- | --- | --- |
| `lane/research-phone` | Opus | Phone-controller research spec (`docs/research/phone-controls.md`) | Merged (f53bbe0) |
| `lane/research-impairment` | Opus | Drink-impairment research spec (`docs/research/impairment.md`) | Merged (f1cf4cc) |
| `lane/engine` | Opus | Core game and server | Checkpoint-merged at 1e8234d (in progress) |
| `lane/controller` | Sonnet | Phone controller, built to the phone spec | Checkpoint-merged at 6ad12d0 (in progress) |
| `lane/impairment` | Sonnet | Drink impairment, built to the impairment spec | Checkpoint-merged at 5d323ea (in progress) |

**Current state (backup checkpoint).** All three implementation lanes are merged here at their current tips, purely as a durability backup. That is not the final integration. The research lanes have reviewed the implementations against their specs, and each lane is fixing those review findings on its own branch. Some of those fixes were still uncommitted in the engine and controller worktrees when this checkpoint was taken, so they are not in it.

Each lane keeps a status file at `docs/handoff/<lane>.md`, and its integration notes are in `docs/INTEGRATION-<lane>.md`.

Test suites, all run from `tipsy-kart/` after `npm install`:
- `npm test`: engine smoke (headless browser).
- `npm run test:net`: controller protocol, tilt and phone e2e tests.
- `node --test test/impairment/`: impairment unit tests. `CALIBRATE=1` adds the calibration run and `E2E=1` the browser run.

The separate repo `hendeal-cyber/tipsy-kart` (public, still empty) is attached to the session. Pushing to it is blocked by the permission system until the user explicitly allows it. Do not try to work around that block.

## Remaining plan

1. The lanes finish fixing the review findings and commit them on `lane/engine`, `lane/controller` and `lane/impairment`.
2. FINAL INTEGRATION (still pending): integration-qa merges the final lane tips into this branch following `docs/INTEGRATION-*.md`. It runs every test suite plus a 4-phone Playwright test, then pushes this branch. Once the user grants permission, it also copies the contents of `tipsy-kart/` to the root of `hendeal-cyber/tipsy-kart` and pushes them to its `main` branch.
3. The research lanes re-check the final result against their specs. Any fixes go back to the same lanes.

Never commit `.claude/worktrees/`, `node_modules/` or `.cert/`.

## Models and workflow

- Opus for research and engine, Sonnet for implementation and integration.
- Each lane works in its own git worktree.

## Resuming in a fresh session

1. Check out `claude/beerio-kart-multiplayer-t2w870` and run `cd tipsy-kart && npm install && npm test`.
2. If the local lane branches are gone, recreate each lane from this branch, for example `git worktree add .claude/worktrees/controller -b lane/controller`. Then re-apply any review fixes listed in that lane's `docs/handoff/<lane>.md`.
3. Read `docs/handoff/*.md` and `docs/research/*.md`, then continue the plan above.
