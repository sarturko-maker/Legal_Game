# Status

This file is the hand-over note between sessions. It is rewritten, not appended to, at
the end of every milestone. Keep it under 40 lines.

## Now

- **Current milestone:** M3, the art slice, in review (branch `m3-art-slice`). Overnight run.
- **Open pull requests**, stacked, for the author to merge in order: #2 M1, #3 M2.

## What exists

- M0: `index.html` title, `tools/check.js`, `tools/shots.js`, a Stop hook running the check.
- M1: `src/core/packs.js` (registry, placeholders, validation rules 1-7),
  `src/core/engine.js` (SPEC 5.1), `packs/public.js`, `text.html`, `tools/transcript.js`,
  `tools/load.js`, `tools/tests/engine.js`.
- M2: `s2` in the pack, `pick` in the engine and in `text.html`. 150 fixture paths pass.
- M3: `index.html` plays a fixed demo: `css/fonts.css` (+ `css/licences/`), `base.css`,
  `props.css`, `src/render/{town,stage,figures,props}.js`, `src/boot.js`. Street x 1,400-4,000.
- `src/core/`: not even a comment may say `Date`, `window`, `document` or `Math.random`.

## Commands that work today

- `node tools/check.js`: scan, packs, fixtures, tests, repository.
- `node tools/transcript.js s1 pack law law`, `npm run fixtures`.
- `node tools/shots.js [--frames] [--keys]`: DevTools pipe, debug hooks, both sizes.
- Open `text.html` (plain text) or `index.html` (the M3 demo) from disk.

## Open questions for the author (suggested answers stand meanwhile)

- `s1` blurb "An order from a company you know. Or do you?" and 6 minutes, from PACK-FORMAT.
- `s2` blurb (the story's first sentence) and 11 minutes. D3, the `s2` numbers.
- `s2` `protest` lead prints "MR Dade AGREED": the lead is not in capitals as a telegram is.

## For later milestones

- M4: SPEC 6.3 turns face-down pages "at the same place"; `s1` turns them at another. Raise.
- M6: the engine keeps the last scenario started under each id. When a private pack
  replaces `s1`, make sure the game starts the replacement.
