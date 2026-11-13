# Status

This file is the hand-over note between sessions. It is rewritten, not appended to, at
the end of every milestone. Keep it under 40 lines.

## Now

- **Current milestone:** M6, variation and the private pack (branch `m6-variation`).
- **Open pull requests**, stacked, to merge in order: #2 M1, #3 M2, #4 M3, #5 M4, #6 M5.

## What exists

- M0-M2: `tools/check.js`, `tools/shots.js`, Stop hook; `src/core/{packs,engine}.js`,
  `packs/public.js` (`s1`, `s2`), `text.html`, `tools/{transcript,load}.js`, tests, 150 fixture paths.
- M3: fonts and licences, `css/base.css`, `css/props.css`, `src/render/{town,stage,figures,props}.js`.
- M4: the whole street, five moods, cast, runner, train, every `s1` prop, the director,
  `src/ui/ledger.js` (ledger, what-ifs, debrief), `src/ui/screens.js`.
- M5: the full game. Title, set-up, both deals, year end, large text, walking off, the
  menu. Pick panel, card, week, Mr Dade. The session is in `src/boot.js`.
- M6: `src/core/rng.js`; seed, skins, wildcards (`packs.dress`, `packs.vary`); front pages;
  `packs/private.js` loaded if present; `packs/private.example.js`.
- `src/core/`: not even a comment may say `Date`, `window`, `document` or `Math.random`.

## Commands that work today

- `node tools/check.js [--pack packs/private.js]`: scan, packs, fixtures, tests, repository.
- `node tools/transcript.js s1 pack law law`, `npm run fixtures`.
- `node tools/shots.js [names] [--paths] [--keys] [--frames]`: `--paths` plays 11 paths
  and a session through the screen against the fixtures; `--keys` a full session by
  keyboard, a mouse run, and a session with reduced motion. `--private`: the example
  private pack, for one run.
- Open `index.html` or `text.html` from disk. `?debug=1`: overlay, `B2B.debug.jump(...)`.

## Open questions for the author (suggested answers stand meanwhile)

- `s1`, `s2` blurbs and minutes; D3; `s2` `protest` lead "MR Dade AGREED" (not in capitals).
- M3 look, blur, Rye (PR #4). Page turns and the face-down title (PR #5). Pitch line.
- Wildcard alternatives' wording (PR #6 q3): then add cards and `wild` on the slot nodes.
