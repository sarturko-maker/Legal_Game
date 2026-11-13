# Status

This file is the hand-over note between sessions. It is rewritten, not appended to, at
the end of every milestone. Keep it under 40 lines.

## Now

- **Current milestone:** M7, finish (branch `m7-finish`). Version 1 is built.
- **Open pull requests**, stacked, to merge in order: #2 M1, #3 M2, #4 M3, #5 M4, #6 M5,
  #7 M6, then M7. Tag `v1.0.0` after check-in 7.

## What exists

- The whole game: `index.html` from disk. Title, set-up, two deals in the town, ledger,
  what-ifs, debrief, year end. Large text, walking off, reduced motion, menu.
- Variation: seed, skins (two more name sets per scenario, scaled), wildcard machinery
  and front pages. No public wildcard cards yet.
- `packs/private.js` loads when present; `packs/private.example.js` is the template.
- `src/core/` runs in Node; not even a comment there may say `Date` or `window`.

## Commands that work today

- `node tools/check.js [--pack packs/private.js]`: scan, packs, fixtures, tests, repository.
- `node tools/transcript.js s1 pack law law`, `npm run fixtures`.
- `node tools/shots.js [names]`: screenshots into `shots/`. Flags:
  - `--paths`: every fixture path and whole sessions through the screen, and a seed twice.
  - `--keys`: keyboard only, mouse, reduced motion.
  - `--audit`: contrast, focus, reduced motion (SPEC 13).
  - `--frames`: frame time, load time, size.
  - `--private`: the example pack, for one run.
- `?debug=1`: overlay, `B2B.debug.jump(id, path, until, options)`, `session`, `record`.

## Open questions for the author (suggested answers stand meanwhile)

- `s1`, `s2` blurbs and minutes; D3; `s2` `protest` lead "MR Dade AGREED" (not in capitals).
- M3 look, blur, Rye (#4). Page turns, face-down title (#5). Pitch line (#6).
- Wildcard alternatives' wording (#6 q3): then add cards and `wild` on the slot nodes.
- Skin scales, cast names kept, a seed line at the year end (#7).
- Frame time on the author's own laptop (M7 check-in).
