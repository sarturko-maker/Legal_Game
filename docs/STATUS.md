# Status

This file is the hand-over note between sessions. It is rewritten, not appended to, at
the end of every milestone. Keep it under 40 lines.

## Now

- **Current milestone:** M0 built. Waiting for check-in 0.
- **Last check-in:** M0, 2026-11-12.
- **Branch:** `m0-skeleton`, pull request open. `main` holds the documents only.

## What exists

- Documents in `docs/`. Fixtures in `docs/scenarios/fixtures/`. Check-in screenshots in
  `docs/checkins/`.
- Agent definitions in `.claude/agents/`. Rules in `.claude/rules/`. A Stop hook in
  `.claude/settings.json` runs `.claude/hooks/stop-check.js`, which runs the check.
- `index.html`: the title on the paper colour, styled by `css/base.css`. It loads
  `src/core/namespace.js`, which creates `B2B`.
- `tools/check.js`: forbidden-pattern scan, repository check, test runner (0 tests). The
  scan reads comments too, so in `src/core/` not even a comment may say `Date`, `window`,
  `document` or `Math.random`.
- `tools/shots.js`: screenshots with the installed Chrome, through its own `--screenshot`
  option. It cannot drive the game through the debug hooks yet.
- No engine, packs, `text.html`, art or fonts.

## Commands that work today

- `node tools/check.js` (or `npm run check`)
- `node tools/shots.js` (or `npm run shots`): writes `shots/m0-title-*.png`
- `node docs/scenarios/fixtures/make-fixtures.js` (or `npm run fixtures`)

## Waiting on the author

- Check-in 0: open `index.html`; D1 to D6 in `docs/DECISIONS.md`; the M0 questions.

## Next

M1: engine and scenario 1, in text. Starts only after the author's go-ahead.
