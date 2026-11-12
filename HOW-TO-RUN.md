# How to run the build

For the author. Claude Code reads `CLAUDE.md`, not this file.

## 1. One-off set-up

1. Create the public repository. Put the contents of this kit at its root, commit, push.
2. In Claude Code on the web, connect GitHub and keep the Default environment with its
   default (Trusted) network access.
3. Read `docs/DECISIONS.md`. You will be asked for D1 to D6 at the first check-in.

## 2. The routine: one milestone, one session

Each milestone in `docs/PLAN.md` gets its own fresh session. A fresh session starts with
an empty context, reads `docs/STATUS.md` to find out where things are, and does one
milestone.

1. Start a new cloud session on the repository.
2. Set the model and effort (section 3). Do it once, first, and leave it alone: changing
   either in mid-session throws away the cached conversation and it is read again at full
   price.
3. Paste the kick-off line (section 4).
4. Wait for the check-in. The session keeps running if you close the tab.
5. Do what the check-in asks (section 5). Reply in the same session with changes or
   answers. Small fixes happen there.
6. When you are happy, merge the pull request. Start the next milestone in a new session.

## 3. Model and effort

Two ways to run it. The agent files in `.claude/agents/` already pin the builders:
`engine-builder` to Sonnet, `scene-builder` and `spec-reviewer` to Opus, all at medium
effort.

**Lead mode.** A stronger model coordinates and delegates.

```
/model fable
/effort low
```

Low effort suits a lead whose job is to read a plan, write briefs and judge reports. If
it starts skipping checks or accepting weak reports, raise it one step for the next
session.

**Solo mode.** One model does the milestone and calls the reviewer at the end.

```
/model opusplan
```

`opusplan` uses Opus while the session is in plan mode and Sonnet once it starts
building. `/model opus` or `/model sonnet` also work.

Which to use: lead mode earns its cost on M3 to M5, where there is a lot to build and a
lot to look at. M0, M1 and M2 are small and tightly specified, and solo mode is enough.

## 4. Kick-off lines

Change the milestone number each time.

Lead mode:

```
Lead mode. Read docs/STATUS.md and milestone M0 in docs/PLAN.md, then run that milestone as CLAUDE.md describes. Stop at the check-in.
```

Solo mode:

```
Solo mode. Read docs/STATUS.md and milestone M0 in docs/PLAN.md, then build that milestone as CLAUDE.md describes. Stop at the check-in.
```

## 5. What you do at each check-in

Pull the branch, or download it from GitHub as a ZIP, and open the file named in the
check-in. Screenshots are in the pull request, under `docs/checkins/`.

| Check-in | You do | You decide |
|---|---|---|
| 0 | Open `index.html` from disk: a title on a cream page | D1 to D6 |
| 1 | Play scenario 1 in `text.html`, all five paths | The wording |
| 2 | Play scenario 2 in `text.html`. Try the careful path, the worst path, and ceiling plus grace | The numbers (D3) |
| 3 | Open `index.html`. Walk. Read a telegram. Watch day turn to dusk | The look. Two rounds of changes at most |
| 4 | Play scenario 1 in the town, all five paths | Pace, readability |
| 5 | Play a full session from the set-up screen | The wildcard alternatives for M6 |
| 6 | Replay with three seeds. Load the example private pack | Whether replays feel different enough |
| 7 | Run it as you would in a meeting | Done, or a list |

Check-in 3 is the one to take your time over. Everything drawn after it copies that look.

## 6. Keeping the cost down

- Check `/usage` at every check-in.
- Where the model picker marks a model "Requires usage credits", that model spends credit
  and not your plan's allowance. The builders are pinned to models that normally draw on
  the plan.
- The lead's cost grows with the length of its conversation. One milestone per session
  keeps it short.
- If a session has gone wrong twice on the same thing, stop it. Start a new session with
  a sharper instruction. A long session full of failed attempts costs more and does worse.
- If the credit is half gone before check-in 3, switch to solo mode and cut scope before
  the art begins: one mood fewer, scenery buildings left out, wildcards postponed.

## 7. If screenshots do not work

In M0 Claude Code finds out whether it can run a headless browser. If it reports that a
download was refused, open the cloud environment's settings, set network access to
Custom, add the address it names, and keep the box for the default package list ticked.
Then start M0 again.

## 8. Adding private content on another machine

1. On GitHub, download the repository as a ZIP. Do not clone it: a folder with no git
   history cannot be pushed by accident.
2. Open `index.html` from disk to confirm it runs.
3. Copy `packs/private.example.js` to `packs/private.js` and fill it in, by hand or with
   whatever tool is approved on that machine.
4. Open `index.html` again. If the private pack has a mistake, the game shows a plain
   list of what is wrong instead of starting.

## 9. Changing a scenario later

Change the script in `docs/scenarios/` first. Then tell Claude Code: "The script for
scenario 1 changed. Update the pack and the fixtures to match, and show me the diff." If
a number changed, it will update `make-fixtures.js` and run it.
