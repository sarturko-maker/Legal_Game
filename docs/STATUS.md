# Status

This file is the hand-over note between sessions. It is rewritten, not appended to, at
the end of every milestone. Keep it under 40 lines.

## Now

- **Current milestone:** M2, scenario 2 in text. Working overnight at the author's request.
- **Last check-in:** M1, pull request open (branch `m1-engine-s1`). Not merged yet.
- **Branches are stacked:** each milestone branches from the one before. The author merges
  them in order.
- **The author wants to move through the milestones quickly, and to see the game.**

## What exists

- M0: `index.html` title page, `tools/check.js`, `tools/shots.js` (installed Chrome), a
  Stop hook that runs the check.
- M1: `src/core/packs.js` (registry, placeholders, validation rules 1-7),
  `src/core/engine.js` (SPEC 5.1 without `pick`), `packs/public.js` with `s1`,
  `text.html`, `tools/transcript.js`, `tools/load.js`, `tools/tests/engine.js`.
- In `src/core/`, not even a comment may say `Date`, `window`, `document` or `Math.random`.

## Commands that work today

- `node tools/check.js`: scan, packs, fixtures, tests, repository.
- `node tools/transcript.js s1 pack law law`
- `node tools/shots.js`, `node docs/scenarios/fixtures/make-fixtures.js`
- Open `text.html` from disk to play in plain text.

## Open questions for the author (suggested answers stand meanwhile)

- `s1` blurb "An order from a company you know. Or do you?" and 6 minutes, from PACK-FORMAT.

## For later milestones

- M3: `tools/shots.js` drives Chrome over its DevTools pipe (decided at check-in 0).
- M4: SPEC 6.3 turns face-down pages over "at the same place", but `s1` puts them down at
  `supply` and turns them at `law`. Raise it at M4.
- M6: the engine keeps the last scenario started under each id. When a private pack
  replaces `s1`, make sure the game starts the replacement.
