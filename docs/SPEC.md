# Back to Back: game specification, version 1

Working title: **Back to Back**. A walk-through game that teaches salespeople at a B2B
distributor what the contract terms on a deal can cost them, and when to involve legal.

## 0. How the documents fit together

| Document | Says | Wins on |
|---|---|---|
| `docs/scenarios/*.md` | Every word, number and outcome of each scenario | Content |
| `docs/SPEC.md` (this file) | What the game is and how it behaves | Behaviour and structure |
| `docs/PACK-FORMAT.md` | How content is stored | Data format |
| `docs/ART.md` | How it looks and moves | Look |
| `docs/PLAN.md` | The order of work, the checks, the check-ins | Process |
| `docs/DECISIONS.md` | Open questions for the author, and the log of decisions made | Anything marked open |
| `docs/STATUS.md` | Where the build is today | Nothing. It is a hand-over note. |

If two documents disagree, the one in the "wins on" column for that subject is right, and
the disagreement is reported at the next check-in.

## 1. What we are building

**Audience.** Salespeople and sales managers. No legal training. Short attention for
anything that smells of compliance training.

**How it is used.** On the author's laptop. Either one person plays, or the author
projects it to a room and the room shouts out or votes on each choice. One screen, one
person at the controls.

**A session.** The author picks which scenarios to play. Each scenario is one deal,
followed from first contact to the money at the end, in 5 to 12 minutes. The player walks
a character through a small Western town, receives telegrams and contract pages, makes a
handful of choices, and ends at a ledger that shows what the choices cost.

**How it teaches.**

- The player makes the decision before seeing the lesson, and sees the lesson as money.
- Every choice offers at least two options a sensible salesperson would take. Nothing is
  labelled as the wrong answer.
- The same misfortune lands on every path where the goods ship. Choices decide what it
  costs, never whether it happens. Nobody loses to bad luck that another path escapes.
- The ledger itemises the result, and shows what each protection saved or would have saved.
- Legal appears as a place the player can walk to. Its first answer is thorough. Its
  second answer, when asked for less, is small and practical.

**Why a Western town.** It is nobody's intellectual property, it gives the distributor a
natural place in the middle (manufacturers arrive by rail on one side, customers build on
the other), and period staging around modern commercial language is funny. The words stay
modern: purchase order, onboarding pack, liability cap, delay damages.

## 2. Hard constraints

These are not preferences. A change to any of them needs the author's written agreement.

| # | Constraint |
|---|---|
| C1 | **Opens from disk.** Double-click `index.html` and it runs, in current Edge and Chrome on Windows and macOS. No server, no install, no build step. |
| C2 | **No network at run time.** No CDN, no remote fonts, no analytics, no `fetch`, no `XMLHttpRequest`, no WebSocket, no remote URL in any file the game loads. |
| C3 | **Classic scripts only.** Plain HTML, CSS and JavaScript loaded with ordinary `<script src>` tags. No ES modules (`import`, `export`, `type="module"`), no bundler, no transpiler, no TypeScript, no framework. Browsers block modules and `fetch` on pages opened from disk, which is why. |
| C4 | **All art is drawn in code.** Inline SVG, CSS and canvas. No image files. No SVG loaded by reference from another file. Fonts are the one exception: open-licence fonts embedded in a CSS file as base64. |
| C5 | **No run-time dependencies.** Development tools may use `devDependencies` for one purpose only: headless screenshots. |
| C6 | **Content is data.** The engine has no scenario-specific code. All text, names and numbers live in packs. |
| C7 | **Deterministic.** Same packs, same seed, same choices: same result. The engine never reads the clock and never calls `Math.random`. |
| C8 | **The public repository holds general principles only.** No real company, customer, vendor, person, price or policy. `packs/private.js` is never committed. |
| C9 | **Nothing borrowed.** No imagery, wording, mechanics or layout from The Oregon Trail or any other game or film. The keep-out list is in `docs/ART.md`. |
| C10 | **Projector-readable.** Works from 1280×720 to 2560×1440, 16:9, letterboxed on other shapes. Body text is legible from the back of a meeting room. |
| C11 | **No pressure by clock.** Nothing times out. A choice waits as long as the room needs. Keyboard and mouse both work for everything. |
| C12 | **Runs on an office laptop.** Smooth on integrated graphics. Honours the operating system's "reduce motion" setting. |

## 3. Scope

### In version 1

- Two scenarios: `s1` The new entity, `s2` The delay clause.
- A scenario picker, so the author plays only what suits the audience.
- The town, the walking character, the paper props, the moods.
- The ledger, the what-it-was-worth lines, the lessons, the year-end summary.
- A text-only player for proof-reading scripts (`text.html`).
- From milestone M6: a seed, skins and wildcards, so that replays differ without breaking
  the story; and the private pack.

### Not in version 1

Multiplayer. Hosting. Sign-in. Leaderboards. Any AI at run time. Sound. Saving a game in
progress. Undo. Translation. A scenario editor. Touch-screen layout. More than two
scenarios. Section 14 lists what the design keeps open for these.

## 4. How a session plays

1. **Title.** The name, one line of pitch, `Play`, `Set up`.
2. **Set up.** Every scenario from the loaded packs, each with title, one-line blurb,
   tags, minutes and a tick box. Options: text size (normal, large), walking (on, off).
   From M6: wildcards (off, on) and seed. `Start` plays the ticked scenarios in the order
   listed. `Play` on the title screen plays all of them with default options.
3. **For each scenario:**
   1. An intro card: "Deal 1 of 2", the title.
   2. The deal, in the town. Sections 6 and 7.
   3. The ending.
   4. The ledger: the lines, the result, what each protection was worth.
   5. The debrief: up to four lessons, and the "In real life" box.
4. **Year end.** One row per deal (title, outcome, result), the total, and two buttons:
   `Play again`, `Back to set up`.

There is no score on screen during a deal. Money appears only at the ledger.

## 5. The game model

Full data format: `docs/PACK-FORMAT.md`. In short:

- A **pack** registers scenarios, a cast and house settings.
- A **scenario** is a graph of **nodes**: `beat` (show one thing), `choice` (pick one),
  `pick` (pick N of M), `ending`.
- **Variables** record what the player chose. Only options set them.
- At an ending the scenario's `settle` function turns variables into ledger lines and a
  net result. `whatIfs` says what each protection was worth.
- A **session** is the list of scenarios played and their results.

### 5.1 Engine contract

One file, `src/core/engine.js`. No DOM, no timers, no globals other than `B2B`. It runs
unchanged in the browser and in Node, because the tests run it in Node.

```
B2B.engine.start(scenario, house, options)  -> state
B2B.engine.view(state)                      -> view
B2B.engine.advance(state)                   -> state      at a beat
B2B.engine.choose(state, optionId)          -> state      at a choice
B2B.engine.pick(state, optionIds)           -> state      at a pick
B2B.engine.result(state)                    -> { lines, net, whatIfs, lessons }   at an ending
B2B.engine.replay(scenario, house, path)    -> state      plays a recorded path to its end
```

- `state` is plain data: `{ scenarioId, nodeId, vars, path, done }`. Every call returns a
  new state and leaves the old one untouched.
- `path` records the player's decisions in order: an option id for a choice, an array of
  option ids for a pick. This is the same shape as the fixtures and the result record.
- `view` is everything the screen needs for the current node, with every placeholder
  resolved and every function already called: `{ kind, at, show, text, lead, foot, from,
  to, who, title, headline, stamp, face, mood, week, prompt, hint, options, count, result,
  news }`. `text` is always an array of paragraphs. `news` is a wildcard's front page,
  `{ headline, text }`, or null (section 9).
- A wrong move (unknown option, wrong number of picks, advancing at a choice) throws an
  `Error` that names the scenario, the node and the problem.
- `replay` auto-advances beats and consumes one path step at each choice or pick.

### 5.2 Pack registry

`src/core/packs.js`.

```
B2B.registerPack(pack)          called by each pack file
B2B.packs.scenarios()           -> scenarios available to the picker, after replace and hide
B2B.packs.house()               -> merged house settings (later packs win, key by key)
B2B.packs.problems()            -> list of validation problems, empty when all is well
```

If `problems()` is not empty when the game starts, the game shows a plain error screen
listing them and does not start. This is how a private-pack author finds mistakes without
developer tools.

### 5.3 Session and result record

`B2B.session` holds the chosen scenarios, the options, and the results so far.
`B2B.session.record()` returns plain data:

```
{ packs: [{ id, version }], seed, deals: [{ id, path, result, net }], total }
```

Version 1 only shows it in the debug overlay. It exists so that a later version can send
it to a leaderboard.

## 6. The world

Look, palette, layers and motion are specified in `docs/ART.md`. This section says what
exists and how it behaves.

### 6.1 The stage

- A fixed logical stage of 1920×1080, scaled to fit the window and centred. The game is
  laid out once, in logical units.
- One long street, drawn as layered SVG, seen from the side. The camera moves left and
  right only. Layers further away move less (parallax).
- One player character who walks along the street.

### 6.2 Locations, west to east

| id | Sign | Used for |
|---|---|---|
| `depot` | DEPOT | Goods leave and arrive by train. |
| `telegraph` | the telegraph company's name from `house.telegraph` | Orders and enquiries arrive. |
| `supply` | the firm's name from `house.firm` | The player's own counter: the account book, the sums, most decisions, the ledger. |
| `law` | LAW OFFICE | Legal. |
| `courthouse` | COURTHOUSE | Claims. |
| `yard` | SITE OFFICE | The customer's project site, at the east end where the line is being built. |

Other buildings (bank, saloon, stable, church, water tower) are scenery in version 1.
They take no part in play, and the bank is placed so that a later "approval" scenario can
use it.

### 6.3 The director

`src/render/director.js` is the only code that knows both the engine and the stage. For
each `view` it does this, in order:

1. **Travel.** If `at` differs from where the character stands, walk there. The camera
   follows. Any "continue" input during a walk jumps straight to arrival.
2. **Set the scene.** Apply `mood` and `week` if the view has them.
3. **Present.** Bring the prop to the front of the screen: `lead`, then the prop, then
   `foot`.
4. **Wait** for the player.
5. **Tell the engine**, get the next view, repeat.

Rules:

- **The runner.** A telegram shown anywhere other than `telegraph` is brought by a
  messenger who runs in from the telegraph office side and out again. The player does not
  walk to the telegraph office for every reply.
- **Outgoing telegrams** (`to`) are shown being written, then handed to the runner.
- **Pages** shown `face: down` show their backs. A later `face: up` beat at the same
  place turns them over, one after another.
- **Endings** hold on the prop until the player continues, then move to the ledger.
- With walking switched off in set-up, or with the system's reduce-motion setting on,
  travel is a short fade cut.

### 6.4 Input

| Action | Mouse | Keyboard |
|---|---|---|
| Continue | Click the prop or the `Continue` button | Space, Enter, Right arrow |
| Choose an option | Click it | 1 to 4 |
| Pick N of M | Click to toggle, then `Confirm` | 1 to 9 to toggle, Enter to confirm |
| Skip a walk | Click | Space, Enter, Right arrow |
| Facilitator menu | Corner button | Esc |

The facilitator menu offers: restart this deal, skip to the next deal, back to set-up,
text size. There is no undo: a choice, once made, stands.

### 6.5 What is on screen during a deal

- Top left: the deal's title.
- Top right: the week counter, once a node has set `week`.
- Bottom centre: the name of the location, for two seconds on arrival.
- Nothing else. No score, no meters, no inventory.

## 7. The props

Each `show` value is a component in `src/render/props.js`, built from HTML and CSS so that
type is crisp and text can be selected and read by assistive software.

| `show` | What the player sees | Notes |
|---|---|---|
| `telegram` | A telegraph form. Text in capitals, typed out letter by letter. | Any input completes the typing at once. |
| `page` | A page of a contract or letter. Optional title and rubber stamp. | Can lie face down. |
| `ledger` | A ruled account-book page. Also used for the ending ledger. | Amounts right-aligned, negatives in red ink with a minus sign. |
| `card` | A single printed card with a title and numbered points. | Ms Vance's "four questions". |
| `poster` | A wood-type poster. A huge headline, an optional stamp across it. | Claims. |
| `paper` | The front page of the town newspaper: masthead, headline, a few lines. | Time skips, events, and from M6 the wildcards. |
| `say` | A character speaking: a silhouette portrait and a speech panel. | |
| `note` | A plain caption over the scene. | Narration. |

The choice panel and the pick panel follow the same visual language. An option shows its
label large and its note small. A pick option shows label and text, and a clear picked or
not-picked state that does not rely on colour alone.

## 8. The ledger, what-ifs and debrief

Shown after every ending, in this order, each on its own screen.

1. **Ledger.** The scenario's own count (`tally` from `settle`, if it has one, as in
   `s2`), the lines from `settle`, and the result. The result is the last thing to
   appear. A `note` from `settle`, if there is one, sits under it.
2. **What each protection was worth.** One line per entry from `whatIfs`. The wording
   rules are in each scenario script.
3. **Debrief.** Up to four lessons, those whose `when` is true first, then the rest in
   order. On an ending whose `result` is `lost`, no lesson counts as having bitten: they
   are shown in order. Then the "In real life" box: `house.reallife[scenarioId]` if a pack
   sets it, otherwise the scenario's own `reallife`.

## 9. Variation (milestone M6, not before)

The aim: a replay should feel like a different deal, and the story must never contradict
itself.

- **Seed.** One number in the session options drives every random pick, through a small
  seeded generator in `src/core/rng.js`. The same seed gives the same session.
- **Skins.** A scenario may list alternative sets of names, and a scale factor applied to
  every amount in `k` together, so that ratios and lessons are unchanged.
- **Wildcards.** A node may name a slot. A wildcard card that matches the slot changes one
  declared parameter or one branch, and is shown as a newspaper front page. Each slot has
  a default, used when wildcards are off. The slots for each scenario are listed at the
  end of its script. Their alternatives are designed with the author at check-in 5.
- **Off by default.** With wildcards off and no seed, the game plays exactly the scripts
  and matches the fixtures.

## 10. The private pack (milestone M6, not before)

Rules and capabilities: `docs/PACK-FORMAT.md` section 7. Requirements on the game:

- `index.html` includes a script tag for `packs/private.js`. When the file is absent the
  game runs normally and shows nothing about it.
- The set-up screen shows which packs are loaded, by title.
- `packs/private.example.js` is a complete, working, invented example that exercises
  every capability in the table.
- `node tools/check.js` fails if git is tracking `packs/private.js`.

## 11. Code layout

Target layout. Merge two files if one of them would be under about 40 lines. Do not add
files or folders beyond this without saying why at the check-in.

```
index.html               the game: loads the css and scripts in order, nothing else
text.html                text-only player, for proof-reading scripts
css/
  fonts.css              embedded fonts
  base.css               tokens, stage, layout
  props.css              telegram, page, ledger, card, poster, paper, panels
src/
  core/namespace.js      creates the one global, B2B
  core/engine.js         section 5.1
  core/packs.js          section 5.2, placeholders, validation
  core/rng.js            seeded generator (M6)
  render/stage.js        layers, camera, moods, scaling
  render/town.js         builds the street from data
  render/figures.js      the player and the cast
  render/props.js        section 7
  render/director.js     section 6.3
  ui/screens.js          title, set-up, intro card, year end, facilitator menu
  ui/ledger.js           section 8
  boot.js                starts everything; debug overlay
packs/
  public.js
  private.example.js
tools/
  check.js               section 12
  shots.js               headless screenshots
  tests/                 engine and pack tests
docs/
```

Every source file is a classic script wrapped in a function, attaching what it exports to
`B2B`. Files in `src/core/` must also load in Node, with no reference to `window` or
`document`.

## 12. Checks

The build is checked by machine before any person looks at it.

### 12.1 `node tools/check.js`

Runs everything below and exits non-zero on any failure. It must finish in a few seconds,
because the Stop hook runs it at the end of every turn. `--pack <file>` checks one extra
pack.

1. **Forbidden patterns** in every file the game loads (`index.html`, `text.html`, `css/`,
   `src/`, `packs/`): `import` and `export` statements, `type="module"`, `fetch(`,
   `XMLHttpRequest`, `WebSocket`, and any `http://` or `https://` address. Two exceptions:
   the `http://www.w3.org/` namespace strings that SVG needs, and licence text inside
   comments. Inside `src/core/` also: `Math.random`, `Date`, `window`, `document`.
2. **Pack validation.** The rules in `docs/PACK-FORMAT.md` section 6.
3. **Fixtures.** Every path in `docs/scenarios/fixtures/s1-paths.json` and
   `s2-paths.json` is replayed through the real engine and the real public pack. The
   ending node reached, every value in `expect`, and every what-if entry must match.
4. **Engine tests.** States are not mutated; wrong moves throw; `view` returns no
   unresolved placeholder on any node of any path.
5. **Repository.** `packs/private.js` is not tracked by git.

### 12.2 `node tools/shots.js`

Opens `index.html` from disk in a headless browser, drives the game through the debug
hooks, and saves named screenshots at 1280×720 and 1920×1080. Each milestone in
`docs/PLAN.md` lists the screenshots it needs. Whoever built the screen looks at its
screenshot before claiming it is done.

### 12.3 Debug hooks

Only active with `?debug=1` on the address.

- An overlay with the scenario id, node id and variables.
- `B2B.debug.jump(scenarioId, path)`: replay a path instantly and show where it ends.
- `B2B.debug.instant = true`: no walking, no typing effect, no transitions.
- `B2B.debug.record()`: the result record from section 5.3.

## 13. Accessibility and room use

- Everything can be done from the keyboard. Focus is always visible.
- Text on props has a contrast ratio of at least 4.5 to 1. Nothing depends on colour alone.
- Two text sizes. At 1920×1080 logical size: normal body 30 px, large body 38 px, option
  labels one step larger than body.
- "Reduce motion" on: no walking, no typing effect, no parallax drift; cuts and fades only.
- Nothing flashes. No sound.
- Prop text is real text in the page, in reading order.

## 14. Later, and what version 1 keeps open for it

Nothing here is built now. Each line names the one thing version 1 does so that the later
step is cheap.

| Later | Kept open by |
|---|---|
| Multiplayer rooms: a host screen, phones voting | The engine is pure and runs in Node, so a server can run it unchanged. |
| Hosting on Azure, sign-in, private pack served to signed-in users | The game is static files. The private pack is one file behind one script tag. |
| Leaderboards on a shared seed | The result record, section 5.3. |
| AI-written scenarios | Packs are data with a strict checker. New content is written offline, checked, and read by the author before anyone plays it. |
| More scenarios (approvals, vendor remedies, price holds) | Packs. The bank is already on the street. |
| Translation | All player-facing text is in packs and `house`. |
| Sound | Nothing. Add it then. |
