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
| 2026-11-13 | — | Keep building milestone after milestone overnight. Each milestone is reviewed and gets its own pull request, stacked on the one before, for the author to merge. Check-in questions carry a suggested answer, which stands until the author says otherwise. | author | "Work through the night. I really want to see the game and then I will direct you." |
| 2026-11-13 | M4 | A face-up page arrives face down and turns over whenever the last page shown was face down, even at another place. | claude | SPEC 6.3 says "at the same place", but `s1` shows the nine pages at the supply company and Ms Vance turns them over at the law office. Her lead says she turns them. |
| 2026-11-13 | M4 | A page with `who` has a pencil line in the margin of every clause, and that person's name and title pencilled under them, so it reads as their marks and not as their page. | claude | ART 9: "A marked clause has a pencil line in the margin." `law1` is the lawyer's reading, and her foot says she marked them. |
| 2026-11-13 | M4 | The newspaper's date line shows the town's name. The `lead` ("Eleven months later.") stays a strip above the paper, as on every prop. | claude | ART 9 asks for a date line, and the script gives no date. |
| 2026-11-13 | M4 | `lead` and `foot` are strips of paper above and below the prop. The lead comes before the runner, since it often says how long the answer took. The foot appears once the prop has finished (typing, turning, a stamp). | claude | SPEC 6.3: lead, then the prop, then foot. |
| 2026-11-13 | M4 | A face-down page's back carries the script's title between two rules, with the edge of the red seal. | claude | ART 9 says "a blank back", but `their_terms` has a title and no text, so the title must show somewhere. For the author. |
| 2026-11-13 | M4 | Scenery signs not in any script: "BANK", "SALOON", "LIVERY", and the town's name on a post by the track. The church has a cross. | claude | SPEC 6.2 lists them as scenery. |
| 2026-11-13 | M4 | A stamp across a poster is struck on a pasted paper slip, below the headline, so the stamp and the claim both stay legible. | claude | SPEC 13 contrast. Red ink straight over 150 px wood type could not be read. |
| 2026-11-13 | M4 | Ledger amounts are set in the typewriter face. A positive amount carries a plus sign, as in the script's ledger table. | claude | ART 9 asks for tabular figures. IM Fell's figures are neither tabular nor lining, and its 0 looked like a degree sign. |
| 2026-11-13 | M4 | Interface labels not in any script: "Deal 1 of 1", "Result", "What each protection was worth", "Debrief", "bit you on this run", "In real life", "Play again", "Menu", "Restart this deal", "Close", "Week N", "The packs have problems". | claude | The words SPEC 4, 6.4 and 8 use, kept short. |
| 2026-11-13 | M4 | Cast members stand at the door of their place, by look: clerk at the telegraph office, lawyer at the law office (foreman and engineer at the yard, official at the courthouse, for later). Only those a scenario uses appear. | claude | ART 6 names looks, not places. |
| 2026-11-13 | M4 | The train runs while its beat's note is up. The first input finishes the train, the next continues. | claude | ART 7: about 4 seconds, skippable. The note says the bolts leave on the train. |
| 2026-11-13 | M4 | The runner comes from the telegraph office's side, waits while the telegram is read, and runs off. For an outgoing telegram he runs in after it is written, takes it and runs off. | claude | SPEC 6.3. |
| 2026-11-13 | M4 | After a walk there is a 0.7 second pause before the prop rises, so the place's name and the building are seen first. | claude | SPEC 6.5 shows the name for two seconds on arrival. |
| 2026-11-13 | M4 | After the debrief, "Play again" goes back to the intro card. The facilitator menu offers "Restart this deal" and "Close". | claude | The year end and the menu's other entries need the session (M5). |
| 2026-11-13 | M4 | The choice panel no longer puts focus on its first ticket, so Space cannot choose by accident. A focused button keeps Space and Enter for itself. | claude | SPEC 6.4: Space continues, keys 1 to 4 choose. |
| 2026-11-13 | M4 | Moods dawn, night and storm: the sky stops are ART 4's; the silhouette tones are mine. Storm adds a tumbleweed near each stop and dust gusts over the street. | claude | ART 4. |
| 2026-11-13 | M4 | Each building's moving thing: depot pennant, telegraph smoke, supply shingle, bank lantern, law shingle, courthouse flag, saloon lantern glow, stable hoist, yard derrick boom. | claude | ART 5. |
| 2026-11-13 | M4 | `B2B.packs.loaded()` lists the packs for the result record. `B2B.session` is a small stub in `boot.js` until M5. | claude | SPEC 5.3, shown in the debug overlay at the ledger. |
| 2026-11-13 | M4 | Debug: `jump(id, path, until)` takes an optional node to stop at. `view(place, mood)`, `state()`, `mode()` and `player` exist for the screenshot tool. | claude | SPEC 12.3. Screenshots of a beat in the middle of a path need a stop. |
| 2026-11-13 | M4 | Check-in screenshots are saved as JPEG (about 70 KB each), not PNG (about 800 KB). The full-size PNGs stay in `shots/`, which git ignores. | claude | 29 PNGs came to 23 MB. |
| 2026-11-13 | M3 | D7 typefaces pass the licence check. Rye (OFL, reserved name "Rye") is embedded unmodified. IM Fell English (OFL) and Special Elite (Apache 2.0) are subset to Basic Latin and converted to WOFF with the fonttools already installed on the build machine. The project gains no dependency. Licences are in `css/licences/`. | claude | ART 8. A subset is a modified font, and OFL forbids a modified font to keep a reserved name. |
| 2026-11-13 | M3 | Rye is not subset, though ART 8 asks for subsets. The alternative is a renamed, subset copy. | claude | The reserved name. For the author to choose at check-in 3. |
| 2026-11-13 | M3 | STOP on a telegram is a lighter ink (#6B5A4C, 5.2 to 1), not a lower opacity. Stamps are solid red at full strength (5.1 to 1). | claude | SPEC 13: text on props has a contrast of at least 4.5 to 1. |
| 2026-11-13 | M3 | Day: the far layers are cooler and paler than the warm street. Dusk: the sun sets in the west, on the left. | claude | Depth comes from value (ART 3), and the rim light at dusk is on the west edges. |
| 2026-11-13 | M3 | IM Fell English has no minus sign (−), so that one glyph falls back to Georgia. | claude | The font lacks it. Raise it if the ledger looks wrong in M4. |
| 2026-11-13 | M3 | Behind a prop, the scene dims but does not blur. | claude | `backdrop-filter` drew a mirrored ghost of the street in Chrome, and costs frame time on office laptops. |
| 2026-11-13 | M3 | A mood change builds the new world (layers 1 to 5, and layer 6) over the old one and fades it in, so only opacity animates. | claude | ART 7: animate only transform and opacity. |
| 2026-11-13 | M3 | The figures walk in their own layer, between layers 5 and 6, moved with the street. | claude | So the foreground passes in front of them. |
| 2026-11-13 | M3 | `src/boot.js` holds the M3 demonstration and the debug hooks `overlay`, `instant` and `scene`. `jump` and `record` need the director and come in M4. | claude | PLAN M3: a fixed demonstration, not yet connected to the engine. |
| 2026-11-13 | M3 | `tools/shots.js` now drives Chrome over its DevTools pipe. `--frames` measures a walk's frame time, and `--keys` plays the demonstration with real key presses. | claude | Decided at check-in 0. The key run gives evidence for ART 10's "Response" test. |
| 2026-11-13 | M3 | Words on the telegram form that are not in any script ("TELEGRAM", "From", "To", "RECEIVED", "SENT", the town under the stamp) are interface labels. The supply company's hanging shingle shows an anvil and no words. | claude | ART 9 asks for a printed form with a received stamp. |
| 2026-11-13 | M2 | PACK-FORMAT widened: `{amount}` in a what-if's text is that entry's own amount, and a scenario may have `whatIfNote`, the small print under the what-if lines. `s1` now uses `{amount}` too. | claude | The `s2` script writes `{amount}` and has small print under the list. |
| 2026-11-13 | M2 | A what-if worth 0 follows the script's ceiling example for every id: "saved you {amount}" becomes "made no difference this time". | claude | The script gives the rule, with an example only for the ceiling. |
| 2026-11-13 | M2 | `s2` takes its blurb from the first sentence of the script's story paragraph, with 11 minutes. | claude | The script has no blurb. These are the author's words. |
| 2026-11-13 | M2 | In the count block, 1 reads "1 week" or "1 day", not "1 weeks". | claude | The script's "{weeksLate} weeks" assumes a plural. |
| 2026-11-13 | M2 | The `s2` bill is one named function in `packs/public.js`. `settle`, `whatIfs` and the ending's headline all call it. Before `terms` is set (walking away) it returns no lines and 0. | claude | The script's what-ifs and headline both work the bill out again. |
| 2026-11-13 | M2 | A pick is recorded in option order, whatever order the boxes were ticked in. | claude | The same picks always give the same path, as in the fixtures. |
| 2026-11-13 | M2 | `Mr Dade, Project Manager, look foreman` joins the cast, as in the PACK-FORMAT example. | claude | `s2` needs him. |
| 2026-11-13 | M1 | A name that ends in a full stop ("Co.") absorbs a full stop straight after its placeholder, so "{entity}. No account." prints "Co. No account.", not "Co.. No account." | claude | The scripts put a full stop after `{entity}`, and the name already ends in one. The script is unchanged. |
| 2026-11-13 | M1 | The view also carries `small` and `event`. `result()` also returns `tally`, `note` and `reallife`. `B2B.packs` also has `cast()`, `validate()`, `fill()` and `number()`. | claude | The props and the text player need them. Nothing in the contract changes. |
| 2026-11-13 | M1 | `s1` takes its blurb and minutes (6) from the PACK-FORMAT example. The script says 5 to 7 minutes and has no blurb. | claude | These are the author's own words, from the format document. |
| 2026-11-13 | M1 | Mood and week carry from node to node. The engine works them out by retracing the state's path from the start. | claude | The state stays exactly `{ scenarioId, nodeId, vars, path, done }`. |
| 2026-11-13 | M1 | Amounts print with a true minus sign (−) and thousands commas, as in the scripts' ledger tables. | claude | It matches the scripts. |
| 2026-11-13 | M1 | `tools/load.js` loads the core and the public pack into Node for the check, the tests and the transcript. | claude | One list of scripts, in `index.html` order, instead of three. |
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
