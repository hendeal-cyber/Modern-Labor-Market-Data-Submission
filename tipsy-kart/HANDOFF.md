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
| `lane/engine` | Opus | Core game and server | Merged at checkpoint 3c2d5dc (feature-complete) |
| `lane/controller` | Sonnet | Phone controller, built to the phone spec | Not merged yet (work in progress) |
| `lane/impairment` | Sonnet | Drink impairment, built to the impairment spec | Not merged yet (work in progress) |

Each lane keeps a status file at `docs/handoff/<lane>.md`. The engine's is already here.

The separate repo `hendeal-cyber/tipsy-kart` (public, still empty) is attached to the session. Pushing to it is blocked by the permission system until the user explicitly allows it. Do not try to work around that block.

## Remaining plan

1. Finish the engine, controller and impairment lanes.
2. Integration-qa merges controller and impairment into this branch following `docs/INTEGRATION-*.md`. It runs every test suite (`npm test`) plus a 4-phone Playwright test, then pushes this branch. Once the user grants permission, it also copies the contents of `tipsy-kart/` to the root of `hendeal-cyber/tipsy-kart` and pushes them to its `main` branch.
3. The research lanes review the implementations against their specs. Fixes go back to the same lanes.

Never commit `.claude/worktrees/`, `node_modules/` or `.cert/`.

## Models and workflow

- Opus for research and engine, Sonnet for implementation and integration.
- Each lane works in its own git worktree.

## Resuming in a fresh session

1. Check out `claude/beerio-kart-multiplayer-t2w870` and run `cd tipsy-kart && npm install && npm test`.
2. If the local lane branches are gone, recreate the unmerged lanes from this branch: `git worktree add .claude/worktrees/controller -b lane/controller`, and the same for impairment.
3. Read `docs/handoff/*.md` and `docs/research/*.md`, then continue the plan above.
