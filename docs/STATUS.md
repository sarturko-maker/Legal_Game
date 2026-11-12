# Status

This file is the hand-over note between sessions. It is rewritten, not appended to, at
the end of every milestone. Keep it under 40 lines.

## Now

- **Current milestone:** M1, engine and scenario 1 in text. In progress, solo mode.
- **Last check-in:** M0, merged 2026-11-12. Check-in 0 answers are in the decision log.
- **Branch:** `m1-engine-s1`.
- **The author wants to move through the milestones quickly, and to see the game.**

## M1 checklist

- [x] Check-in 0 recorded. PACK-FORMAT and SPEC widened to fit the scripts (see the log).
- [ ] `src/core/packs.js`: registry, placeholders (PACK-FORMAT 4), validation (6, rules 1-7).
- [ ] `src/core/engine.js`: SPEC 5.1. `s1` already needs `text` and `next` as functions.
- [ ] `packs/public.js`: house, cast, and `s1` copied exactly from its script.
- [ ] `text.html`: each view as text, buttons, then ledger, what-ifs, lessons, In real life.
- [ ] `tools/transcript.js <scenario> <path...>`.
- [ ] `tools/check.js`: pack validation, `s1` fixture replay (rule 8), engine tests.
- [ ] Checks: all 5 paths in `s1-paths.json`; `node tools/transcript.js s1 pack law law`.
- [ ] `spec-reviewer`, STATUS, log, commit, push, pull request, check-in 1.

## What exists

- M0: `index.html` title page, `tools/check.js`, `tools/shots.js` (installed Chrome), and
  a Stop hook that runs the check.
- In `src/core/`, not even a comment may say `Date`, `window`, `document` or `Math.random`.

## Commands that work today

- `node tools/check.js`, `node tools/shots.js`, `node docs/scenarios/fixtures/make-fixtures.js`

## For later milestones

- M3: `tools/shots.js` drives Chrome over its DevTools pipe (decided at check-in 0).
- M4: SPEC 6.3 turns face-down pages over "at the same place", but `s1` puts them down at
  `supply` and turns them at `law`. Raise it at M4.
