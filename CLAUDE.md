# Back to Back

A browser game that teaches salespeople what contract terms can cost. It runs by opening
`index.html` from disk. It is built in milestones, with a check-in with the author after
each one.

## Read first, every session

1. `docs/STATUS.md`: where the build is today.
2. The current milestone in `docs/PLAN.md`: what to build, what to read, how it is checked.

Read other documents only when the milestone lists them. Do not load `docs/SPEC.md` whole
unless the milestone says so.

## Rules that never bend

- It opens from disk. Classic `<script src>` tags only. No ES modules, no `fetch`, no
  bundler, no framework, no TypeScript, no CDN, no network address anywhere.
- No run-time dependencies. Ask before adding any development dependency.
- All art is code: SVG, CSS, canvas. No image files.
- `src/core/` has no DOM, no clock, no randomness and no scenario-specific code. It must
  load in Node as well as in the browser.
- Scenario wording, numbers and outcomes belong to the author. Copy `docs/scenarios/*.md`
  exactly. Never rewrite, trim, extend or "improve" content. If a script looks wrong,
  stop and ask.
- This is a public repository. Invented names only. `packs/private.js` is never
  committed, and is created or edited only when a milestone or the author says so.
- Nothing from The Oregon Trail or any other game. The keep-out list is `docs/ART.md`
  section 2.
- IMPORTANT: one milestone per session. Finish it, post the check-in, stop. Never start
  the next milestone without the author's go-ahead.

## Commands

- `node tools/check.js`: scan, pack validation, fixtures, tests. Must pass before any check-in.
- `node tools/shots.js`: headless screenshots into `shots/`.
- `node tools/transcript.js <scenario> <path...>`: print a play-through as text.
- `node docs/scenarios/fixtures/make-fixtures.js`: regenerate fixtures after the author
  changes a number. Never edit the fixture files by hand.
- To play: open `index.html` or `text.html` from disk. There is no server.

Tools appear as milestones build them. `docs/STATUS.md` says which exist.

## How a milestone runs

Read, plan in ten lines, build the smallest thing that passes, run the checks and look at
the screenshots, have `spec-reviewer` review it, update `docs/STATUS.md` and
`docs/DECISIONS.md`, commit on branch `mN-short-name`, open a pull request, post the
check-in in the format given in `docs/PLAN.md`, stop.

Stop early and ask when: a rule above cannot be met; a script and its fixture disagree;
a dependency seems necessary; the same fix has failed twice; the work is growing beyond
the milestone.

## Two ways of working

The author's first message says which.

- **Lead.** You coordinate and keep your own context small. Delegate building to
  `engine-builder` (logic, data, tools, tests) or `scene-builder` (anything visible), one
  at a time, each with a written brief: the goal, the files, the document sections to
  read, the checks to run, what to report back. Do not pass a model when delegating: the
  agent files set it. Do not read large files or screenshots yourself when a subagent can
  report on them. Then `spec-reviewer`. You write the check-in.
- **Solo.** You build it yourself, then run `spec-reviewer` before the check-in.

If you are a subagent, do the task you were given yourself and report back. Do not
delegate.

## Keep it simple

- The documents are the ceiling as well as the floor. Build what they say and no more.
- No new file, folder, abstraction, option or setting unless the milestone needs it.
- Thirty plain lines beat ten clever ones. No class where a function will do. No helper
  that is used once.
- When the documents are silent, choose the simplest thing, log it in
  `docs/DECISIONS.md`, and mention it at the check-in. If it touches content, scope or a
  rule above, ask instead.

## Code style

- Plain modern JavaScript. Two spaces, semicolons, single quotes.
- Every source file is a classic script wrapped in a function that attaches what it
  exports to the one global, `B2B`.
- Animate only `transform` and `opacity`.
- Comments say why, not what.

## When compacting

Keep: the current milestone and how far its checklist has got, the latest check results,
open questions for the author, and the list of files changed.
