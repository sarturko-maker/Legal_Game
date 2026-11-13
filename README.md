# Back to Back

A short walk-through game for salespeople at a B2B distributor. You follow a deal from
the first telegram to the money at the end, in a small Western town, and find out what
the contract terms cost.

Two deals are in this version: **The new entity** (whose terms an order is on) and **The
delay clause** (delay damages). Each takes 5 to 12 minutes.

## How to run it

Open `index.html` in Chrome or Edge, straight from disk: double-click it. There is no
install, no server and no network. Everything the game needs is in this folder.

`text.html` is a plain text player for proof-reading the scripts.

## How to run a session

1. Open `index.html` and press **Play**. You get every deal, one after another, then the
   year end with the total.
2. Or press **Set up** first. Its choices are remembered on that computer.
   - Tick the deals to play.
   - **Text size: Large** is for a big room.
   - **Walking: Off** cuts between places instead of walking.
   - **Wildcards** and **Seed** are for replays: see below.
3. Play with the keyboard or the mouse.

| To | Keyboard | Mouse |
|---|---|---|
| Continue | Space, Enter or Right arrow | Click the paper, or `Continue` |
| Choose an option | 1 to 4 | Click it |
| Pick two of three | 1 to 3 to punch a ticket, then Enter | Click, then `Confirm` |
| Skip a walk | Space | Click the street |
| Open the menu | Esc | `Menu`, bottom right |

The menu restarts the deal, skips to the next deal, goes back to set-up, or changes the
text size. Nothing times out: a choice waits as long as the room needs.

With a room, read the paper aloud, let the room argue, and take a vote before pressing a
number. The money appears only at the end, on the ledger. After it come what each
protection was worth, the lessons, and what to do in real life.

**Replays.** With a seed, each deal draws one of three versions: the script's own, or one
of two others with a different customer, other names, and every amount scaled up or down
together. The same seed always plays the same deals. Wildcards on, with no seed, draws a
new seed each time.

**Reduced motion.** If the computer is set to reduce motion, the game cuts and fades
instead of walking, typing or moving the scenery.

## How to add a private pack

A private pack holds content that must not go in this public repository, such as your own
company's name, your own "In real life" advice, or your own scenarios.

1. Copy `packs/private.example.js` to `packs/private.js`. The example shows everything a
   private pack can do. Each line is explained in its comments.
2. Change it. A private pack may:
   - replace the "In real life" box of any deal;
   - set the firm's name and a currency;
   - add scenarios;
   - replace a public scenario (same id);
   - hide one.
3. Check it: `node tools/check.js --pack packs/private.js`.
4. Open `index.html`. The set-up screen lists the packs it loaded.

`packs/private.js` is never committed. `.gitignore` lists it, and the check fails if git
tracks it. If the file is missing, the game runs without it. The rules are in
`docs/PACK-FORMAT.md`, section 7.

## How to add a scenario

The writing rules are in `docs/PACK-FORMAT.md`, section 9. Section 5 says how each line of
a script becomes a field in a pack.

**A public scenario** has general principles and invented names only.

1. **Write the script** in `docs/scenarios/`, in the same form as the two that are there.
   It holds every word, number and outcome, plus its ledger, lessons and debrief.
2. **Add the expected results.** `docs/scenarios/fixtures/make-fixtures.js` works out
   each scenario's sums on its own, separately from the pack. Write the new scenario's
   sums and paths there, then run it.
3. **Copy the script into `packs/public.js`**, word for word.
4. **Check it.** Run `node tools/check.js`. It plays every path, checks every
   placeholder and every sum, and replays the fixtures.
5. **Read it through** in `text.html`, then play it in `index.html`.

**A private scenario** stays off this repository, script and all.

1. Keep its script wherever your private material lives.
2. Write it into `packs/private.js`, as `p1` is written in the example.
3. Check it: `node tools/check.js --pack packs/private.js`. This plays every path and
   checks every placeholder and every sum. It has no fixtures.
4. Play it through in `index.html`. `text.html` shows the public pack only.

## For developers

| Command | What it does |
|---|---|
| `node tools/check.js` | Scans for forbidden code, validates the packs, replays the fixtures, runs the tests. It must pass before anything is merged. |
| `node tools/shots.js` | Opens the game in headless Chrome or Edge and saves screenshots to `shots/`. |
| `node tools/shots.js --paths --keys` | Plays paths and whole sessions through the screen, by keyboard, by mouse and with reduced motion. |
| `node tools/shots.js --audit --frames` | Checks contrast, keyboard focus and reduced motion, and measures frame time, load time and size. |
| `node tools/transcript.js s1 pack law law` | Prints one play-through as text. |

The code is plain HTML, CSS and JavaScript in classic `<script>` tags, with no build step
and no dependencies. Each file is described in `docs/SPEC.md`, section 11.

## What is here

| Path | What it is |
|---|---|
| `index.html`, `text.html` | The game, and the text player |
| `css/`, `src/` | The game's styles and code |
| `packs/` | The content: `public.js`, and the private pack template |
| `tools/` | The checker, the screenshot tool, the tests |
| `docs/SPEC.md` | What the game is and how it behaves |
| `docs/scenarios/` | The two scenarios, word for word, and the expected results for every path |
| `docs/PACK-FORMAT.md` | How content is stored, and how private content is added |
| `docs/ART.md` | How it looks and moves |
| `docs/PLAN.md` | The build, in eight milestones with a check-in after each |
| `docs/DECISIONS.md` | Open questions and the decision log |
| `HOW-TO-RUN.md` | How the author runs the build with Claude Code |
| `CLAUDE.md`, `.claude/` | Instructions for Claude Code |

## About the content

Every company and person in this repository is invented. The scenarios illustrate general
commercial principles. They are not legal advice, and the rules of thumb in them are
written from an English-law point of view.
