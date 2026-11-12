# Build plan

Eight milestones. Each one ends with something the author can open and judge, a set of
machine checks that passed, and a check-in. Nothing is built ahead of its milestone.

The order is deliberate: the words and the sums are proved in plain text first, where a
change costs minutes. Then one small piece of the town is made beautiful and approved.
Only then is the rest drawn.

| # | Milestone | The author can then... |
|---|---|---|
| M0 | Skeleton and tools | open an empty game from disk; see the check command work |
| M1 | Engine and scenario 1, in text | play scenario 1 as plain text and fix the wording |
| M2 | Scenario 2, in text | play scenario 2 as plain text and settle the numbers |
| M3 | The art slice | walk between two buildings and say yes or no to the look |
| M4 | The whole town, scenario 1 in it | play scenario 1 properly |
| M5 | Scenario 2 in the town, the session | play both, pick scenarios, see the year end |
| M6 | Variation and the private pack | replay with different names and events; add private content |
| M7 | Finish | use it in a room |

## Rules for every milestone

1. **Read.** `docs/STATUS.md`, this milestone, and the documents it lists under "Read".
   Nothing else unless something is unclear.
2. **Plan** in about ten lines, in the conversation: what will be built, in what order,
   and what will be left alone. If the plan departs from a document, ask before building.
3. **Build** the smallest thing that passes the checks.
4. **Check.** Run every command under "Checks". Look at every screenshot listed. A check
   that was not run is a check that failed.
5. **Review.** Run the `spec-reviewer` agent on the milestone's changes. Fix what it finds
   that affects correctness or a stated requirement. List the rest in the check-in.
6. **Record.** Rewrite `docs/STATUS.md`. Add to the log in `docs/DECISIONS.md` anything
   that was decided along the way.
7. **Commit** on a branch named `mN-short-name`. Copy the 1280×720 versions of the
   milestone's screenshots into `docs/checkins/mN/` so that the author can see them in the
   pull request. Push, open a pull request.
8. **Check in**, using the format below. Then stop and wait.

### Stop and ask straight away, without waiting for the check-in, when

- A hard constraint in `docs/SPEC.md` section 2 cannot be met.
- A scenario script looks wrong, or disagrees with its fixture.
- A dependency of any kind seems necessary.
- The same problem has survived two attempts at fixing it.
- The work is growing beyond what the milestone describes.

### Check-in format

```
CHECK-IN M<n>: <milestone name>

Built
- three to six lines

Evidence
- node tools/check.js: <pass and fail counts>
- screenshots: <files, and one line on what each shows>
- how to try it: <which file to open, what to press>

Not done, or different from the documents
- <list, or "nothing">

Decisions I made (logged in docs/DECISIONS.md)
- <list, or "none">

Questions for you
1. <question> My suggestion: <answer>

Next: M<n+1>, <one line>. Waiting for your go-ahead.
```

---

## M0. Skeleton and tools

**Goal.** An empty game that opens from disk, and a check command that can fail.

**Read.** SPEC sections 2, 11, 12.

**Build.**
- The folder layout from SPEC section 11, with only the files this milestone needs.
- `index.html`: the title, centred, on the paper colour, in a system serif. Loads
  `src/core/namespace.js` with a classic script tag.
- `package.json`: private, no dependencies, scripts for `check`, `shots`, `fixtures`.
- `tools/check.js`: the forbidden-pattern scan and the repository check from SPEC 12.1,
  and a test runner that reports "0 tests" for now.
- `tools/shots.js`: opens `index.html` from disk in a headless browser and saves one
  screenshot. First find out what works in this environment, in this order: a browser
  already installed; Chrome for Testing downloaded by Puppeteer; Playwright. Record the
  answer in `docs/DECISIONS.md`.
- `.claude/settings.json` with a Stop hook that runs `node tools/check.js`. Requirements:
  blocks once when the check fails and passes the failure text back; honours
  `stop_hook_active`; reads the hook input with Node, not `jq`; exits cleanly when
  `tools/check.js` does not exist; finishes in under ten seconds.

**Checks.**
- `node tools/check.js` passes.
- Put `fetch(` in a scratch file under `src/`: the check fails and names the file. Remove
  the scratch file.
- The screenshot exists and shows the title.

**If no headless browser can be made to work:** stop and tell the author which download
address was refused. He can allow it in the cloud environment's network settings, or
agree to judge the visuals by eye. Do not go on to M3 with no way of seeing the screen.

**Check-in 0.** The author opens `index.html` from disk, and answers the open decisions
D1 to D6 in `docs/DECISIONS.md`.

**Not in this milestone.** Any game logic. Any art. Any font.

---

## M1. Engine and scenario 1, in text

**Goal.** Scenario 1 plays from start to every ending as plain text, and matches its
fixture.

**Read.** SPEC sections 2, 5, 12. `docs/PACK-FORMAT.md`. `docs/scenarios/01-the-new-entity.md`.

**Build.**
- `src/core/engine.js` and `src/core/packs.js`, to the contracts in SPEC 5.1 and 5.2.
- `packs/public.js` with scenario `s1`, converted from its script by the rules in
  PACK-FORMAT section 5.
- `text.html`: shows each view as plain text, with buttons for options, then the ledger,
  the what-it-was-worth line, the lessons and the "In real life" box. Almost no styling.
- `tools/transcript.js <scenario> <path...>`: prints a play-through as text.
- In `tools/check.js`: pack validation, the fixture replay for `s1`, and engine tests.

**Checks.**
- `node tools/check.js` passes, including all five paths in `s1-paths.json`.
- `node tools/transcript.js s1 pack law law` prints the full good path.
- The reviewer compares every line of the pack with the script.

**Check-in 1.** The author plays all five paths in `text.html` and reads the transcripts.
Wording changes go into the script first, then the pack.

**Not in this milestone.** `pick` nodes. Scenario 2. Anything visual.

---

## M2. Scenario 2, in text

**Goal.** Scenario 2 plays as plain text and matches all 145 fixture paths.

**Read.** PACK-FORMAT. `docs/scenarios/02-the-delay-clause.md`. `docs/scenarios/fixtures/make-fixtures.js`.

**Build.**
- Engine support still missing for `s2`: `pick` nodes, `derive`, text and `next` written
  as functions, `week`, lessons with `when`.
- Scenario `s2` in `packs/public.js`, with `settle` and `whatIfs`.
- `text.html`: the week counter, the count block on the ledger, the what-it-was-worth
  lines, lessons ordered as the script says.

**Checks.**
- `node tools/check.js` passes, including all 145 paths in `s2-paths.json`, every `expect`
  value and every what-if amount.
- The pack's `k` for `s2` equals the fixture's `k`.
- Transcripts of three paths read correctly from first line to last:
  - the careful one: `law cap,sole ask quote14 formal law`
  - the worst one: `sign quote12 verbal`
  - the trap: `law cap,grace quote12 wire`

**Check-in 2.** The author plays it and settles the numbers (decision D3). A number
changes in three places together: the script, `make-fixtures.js` (then re-run it), and
the pack.

**Not in this milestone.** Wildcards, skins, seed. Anything visual.

---

## M3. The art slice

**Goal.** One stretch of street that passes the quality bar in ART section 10, approved
by the author before any more art is made.

**Read.** SPEC sections 2, 6.1, 6.4, 7, 13. `docs/ART.md`, all of it.

**Build.**
- Fonts: download, check the licences, subset, embed, commit the licence texts.
- The stage: scaling, the eight layers, the camera.
- The street from x 1,400 to x 4,000: the telegraph office and the supply company, with
  everything behind and in front of them.
- Moods `day` and `dusk`, and the change between them.
- The player figure, walking.
- The `telegram` prop with its typing, and the choice panel.
- At least three things that move when nothing is happening.
- The debug hooks from SPEC 12.3.
- A fixed demonstration, not yet connected to the engine: a telegram at the telegraph
  office, a walk to the supply company, the mood turning to dusk, a two-option choice.

**Checks.**
- `node tools/check.js` passes.
- Screenshots at 1280×720 and 1920×1080, each one looked at by whoever built it:
  `m3-telegraph-day`, `m3-walk-mid`, `m3-supply-dusk`, `m3-telegram`, `m3-choice`.
- The five tests in ART section 10, answered one by one in the check-in.
- Average frame time during the walk, measured in the headless browser and reported.

**Check-in 3. The one that matters most.** The author opens `index.html`, walks, and says
yes or names what to change. There are at most two rounds of changes to the look. After
that the look is recorded as fixed in `docs/DECISIONS.md`. If it is still not right after
two rounds, stop and discuss a simpler style. Do not start a third round.

**Not in this milestone.** Any other building. Any other prop. The engine connection.

---

## M4. The whole town, and scenario 1 in it

**Goal.** Scenario 1 is played properly, start to ledger, on every path.

**Read.** SPEC sections 4, 6, 7, 8. ART sections 5, 6, 7, 9. Scenario 1 script.

**Build.**
- The rest of the street and all six locations. The remaining moods.
- The cast figures scenario 1 uses, and the runner.
- The props scenario 1 uses: `page` (face down, face up), `ledger`, `poster`, `paper`,
  `say`, `note`, stamps. The train.
- The director, connecting engine to stage.
- The intro card, the ending, the ledger, the what-it-was-worth line, the debrief.
- What is on screen during a deal (SPEC 6.5). Mouse and keyboard input. The facilitator
  menu with "restart this deal".

**Checks.**
- `node tools/check.js` passes.
- A headless run drives all five `s1` paths through the real screen with
  `B2B.debug.instant` on, and finds the expected result on the ledger each time.
- Screenshots: one per prop type, one per ending, one per mood.
- One path played with the keyboard only.

**Check-in 4.** The author plays all five paths.

**Not in this milestone.** Scenario 2 on screen. The set-up screen. The year end.

---

## M5. Scenario 2 in the town, and the session

**Goal.** Both scenarios play in the town, chosen from the set-up screen, ending at the
year-end summary.

**Read.** SPEC sections 4, 6, 7, 8, 13. Scenario 2 script.

**Build.**
- The pick panel, the `card` prop, the week counter, the yard and its cast.
- The count block on the ledger, the headline by result, the lesson ordering.
- The title screen, the set-up screen, the year end.
- Large text. Reduce-motion behaviour. Walking on or off.
- The facilitator menu in full.

**Checks.**
- `node tools/check.js` passes.
- A headless run drives six `s2` paths through the real screen and finds the expected
  result each time: the three from M2, plus `refuse walk`, `sign ask quote14 risk`, and
  `refuse law sole,grace ask quote12 formal standfirm`.
- A headless run plays a two-deal session and checks the year-end total.
- Screenshots: every new prop and screen, at both sizes, at both text sizes.
- One full session played with the keyboard only, and one with reduce-motion on.

**Check-in 5.** The author plays a full session. He also agrees the wildcard alternatives
for M6, from the slot tables at the end of each scenario script.

**Not in this milestone.** Seed, skins, wildcards, the private pack.

---

## M6. Variation and the private pack

**Goal.** A replay feels like a different deal. Private content can be added on another
machine without touching the repository.

**Read.** SPEC sections 9, 10. PACK-FORMAT sections 7, 8. The slot tables, as agreed at
check-in 5.

**Build.**
- `src/core/rng.js`, the seed option, and its place on the set-up screen.
- Skins: two extra sets of invented names for each scenario, and the scale factor.
- Wildcards, as agreed. Shown as newspaper front pages.
- Private pack loading, the list of loaded packs on the set-up screen, the error screen
  for a pack that fails validation.
- `packs/private.example.js`, exercising every capability in PACK-FORMAT section 7.

**Checks.**
- With wildcards off and no seed, every fixture still passes unchanged.
- The same seed twice gives the same result record.
- For 200 seeds with wildcards on: every path of both scenarios still reaches an ending,
  every placeholder resolves, every `net` is the sum of its lines.
- With `packs/private.example.js` copied to `packs/private.js` locally: the game loads
  it, and the check with `--pack` passes. Delete the copy afterwards. It is never
  committed.
- With no private pack: no error anywhere the player can see.

**Check-in 6.** The author replays with three different seeds, and loads the example
private pack.

**Not in this milestone.** Any real private content. That happens on the author's other
machine.

---

## M7. Finish

**Goal.** Ready to use in front of a room.

**Read.** SPEC, all of it, once. ART section 11.

**Build.**
- A performance pass: frame time, page weight, time to first screen.
- The accessibility list in SPEC section 13, item by item.
- `README.md`: what it is, how to run it, how to run a session, how to add a private
  pack, how to add a scenario.
- Removal of anything unused.
- A licence file only if the author has chosen one (decision D6).

**Checks.**
- Everything from earlier milestones still passes.
- Total size of everything the game loads is under 1.5 MB.
- The reviewer reads SPEC end to end against the finished game and reports every gap.

**Check-in 7.** The author runs a full session as he would in a meeting. Tag `v1.0.0`.
