# Decisions

Two parts. **Open decisions** are the author's to make. Each has a default, so that work
is never blocked: the default stands until he says otherwise. **The log** records what was
decided along the way, by whom, and why.

## Open decisions

Answer at check-in 0 unless a later check-in is named.

**D1 to D6 were decided at check-in 0 (2026-11-12): every default kept.**

### D1. Names

| Thing | Default |
|---|---|
| The game | Back to Back |
| The player's company | Last Shot Supply Co. |
| The town | Caveat Creek |
| The newspaper | The Caveat Creek Courier |
| The telegraph company | Territorial Telegraph |

All other names (customers, people, the mill) are in the scenario scripts.

### D2. Scenario 1: numbers, and two additions

Defaults: order 6,000, margin 1,500, claim 20,000,000, cap 50,000.

Added to the author's sketch, to confirm or strike:

1. Caving after the redlines leads to the lawsuit. Standing firm loses the order.
2. A follow-on margin of 75,000 on the safe ending. Without it the capped deal ends at
   −48,500 and the lost order at 0, so walking away scores best.
3. The customer signs the onboarding pack a month later, once nobody is in a hurry.

### D3. Scenario 2: numbers, and the game devices

Defaults are the `k` table in the script. To confirm, at check-in 2 after playing it in text:

1. **Pick two of three safeguards.** The alternative is that all three can be had.
2. The rate: asked at 0.5% a week, settled at 1% a week.
3. Record but no amendment earns back 4 of the 8 weeks, after an argument.
4. The contractor's other claims: 400,000, once you are 4 or more weeks late and delay
   damages are not the only remedy.
5. Starting without approval: 5 weeks lost instead of 8, none excused, 120,000 to remake.
6. The mill is 3 weeks late. The Engineer is 8 weeks late.

### D4. "Always go to legal"

In version 1 the scenarios play as sketched: in scenario 1 the safe path runs through
legal twice, and a player who always picks legal reaches it without much thought.
Scenario 2 does not have this problem. Options for later, none built now:

- Each visit to legal costs time, and deals have deadlines.
- What the player tells legal decides what comes back: give the context and get the small
  fix the first time; forward the papers bare and get the twelve changes.

Default: leave as sketched. Revisit after the first session with real salespeople.

### D5. Jurisdiction wording

The public pack states the "last paper on the table" rule as a rule of thumb under
English law, with a line telling the player to ask locally. Default: keep.

### D6. Licence

No licence file is added until the author chooses one. Default: none.

### D7. Typefaces (check-in 3)

Rye, Special Elite, IM Fell English, subject to the licence check in M3.

### D8. Smaller defaults

| Question | Default |
|---|---|
| Currency | None. Plain numbers. A private pack may set a symbol. |
| Language | English. All text is in packs, so a translated pack is possible later. |
| Sound | None. |
| Saving a game in progress | No. Only the set-up options are remembered. |

## Log

Newest first. One line each. "Who" is `author` or `claude`.

| Date | Milestone | Decision | Who | Why |
|---|---|---|---|---|
| 2026-11-12 | check-in 0 | D1 to D6: every default kept. | author | |
| 2026-11-12 | check-in 0 | From M3, `tools/shots.js` drives the installed Chrome over its DevTools pipe from plain Node. No `puppeteer-core`. | author | No dependency. |
| 2026-11-12 | check-in 0 | PACK-FORMAT widened so the scripts fit: `who` on `page`, `headline` on `ledger`, `stamp` on `telegram`, `small` on `card`. `settle` may return `tally` (the count block) and `note` (a line under the ledger). | author | The old table would have dropped the author's words. |
| 2026-11-12 | check-in 0 | On an ending whose result is `lost`, no lesson is highlighted (SPEC 8). | author | In `s2`, walking away left lessons 4 and 5 highlighted by default values. |
| 2026-11-12 | check-in 0 | `house.paper` and `house.telegraph` hold the newspaper's and the telegraph company's names (D1). | author | The D1 names had no home in a pack. |
| 2026-11-12 | M0 | Screenshots use the Chrome already installed, through its own `--headless=new --screenshot` option. No development dependency. Puppeteer and Playwright were not needed. | claude | First choice in the order PLAN M0 gives, and it works here. |
| 2026-11-12 | M0 | The Stop hook's script is `.claude/hooks/stop-check.js`, a folder not in SPEC 11. | claude | Kept next to `settings.json`, so the hook works on any branch, with or without `tools/`. |
| 2026-11-12 | M0 | The scan reads only `.html`, `.css` and `.js` files under the game paths. | claude | Those are what the browser loads. Licence texts kept beside the fonts (M3) are not. |
| 2026-11-12 | M0 | Without git (a copy downloaded as a ZIP), the repository check passes with a note. | claude | A folder with no git tracks nothing. |
| 2026-11-12 | M0 | Tests are files in `tools/tests/` that export an object of named functions. A test fails by throwing. | claude | The smallest runner that needs no dependency. |
| 2026-11-12 | M0 | The title page is styled from `css/base.css`, with only the `--paper` and `--ink` tokens. | claude | SPEC 11: `index.html` only loads files. |
| 2026-11-12 | M0 | This repository's git email is the GitHub noreply address. | claude | The repository is public, and the global address is personal. |
| 2026-11-12 | — | Build sessions run in Claude Code on the author's machine, not on the web. `HOW-TO-RUN.md` sections 1, 2 and 7 do not apply as written. | author | The author's choice. |
