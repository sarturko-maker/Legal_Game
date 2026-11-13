# Status

This file is the hand-over note between sessions. It is rewritten, not appended to, at
the end of every milestone. Keep it under 40 lines.

## Now

- **Current milestone:** M4, the whole town and scenario 1 in it (branch `m4-town-s1`).
- **Open pull requests**, stacked, for the author to merge in order: #2 M1, #3 M2, #4 M3.

## What exists

- M0-M2: `tools/check.js`, `tools/shots.js`, Stop hook; `src/core/{packs,engine}.js`,
  `packs/public.js` (`s1`, `s2`), `text.html`, `tools/{transcript,load}.js`, tests, 150 fixture paths.
- M3: fonts and licences, `css/base.css`, `css/props.css`, `src/render/{town,stage,figures,props}.js`.
- M4: `index.html` plays `s1` start to debrief. The whole street, five moods, the clerk,
  the lawyer, the runner, the train, every `s1` prop, `src/render/director.js`,
  `src/ui/ledger.js` (ledger, what-ifs, debrief), `src/ui/screens.js` (intro card, menu,
  pack-problem screen). `B2B.session` is a stub in `boot.js` until M5.
- `src/core/`: not even a comment may say `Date`, `window`, `document` or `Math.random`.

## Commands that work today

- `node tools/check.js`: scan, packs, fixtures, tests, repository.
- `node tools/transcript.js s1 pack law law`, `npm run fixtures`.
- `node tools/shots.js [names] [--paths] [--keys] [--frames]`: `--paths` plays every `s1`
  path through the screen and checks the ledger; `--keys` plays one at full speed by
  keyboard, then by mouse, the menu, and with reduced motion.
- Open `index.html` or `text.html` from disk. `?debug=1`: overlay, `B2B.debug.jump(...)`.

## Open questions for the author (suggested answers stand meanwhile)

- `s1`, `s2` blurbs and minutes; D3; `s2` `protest` lead "MR Dade AGREED" (not in capitals).
- M3 look, blur behind props, Rye whole or cut down: questions on PR #4.

## For later milestones

- M5: set-up, year end, real `B2B.session`, the other menu entries, `card` and pick on screen.
- M6: when a private pack replaces `s1`, check the game starts the replacement.
