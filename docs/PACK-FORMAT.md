# Pack format

A pack is one JavaScript file that hands the game its content: scenarios, names, numbers,
text. The engine contains no scenario-specific code. Everything a player reads comes from
a pack.

Two packs exist in v1:

| File | In git | Purpose |
|---|---|---|
| `packs/public.js` | yes | General principles. The two v1 scenarios. |
| `packs/private.js` | **never** | Optional. Employer-specific content, added on the corporate laptop only. |

`index.html` loads `packs/public.js`, then `packs/private.js` if the file exists. A missing
private pack is normal and must not show an error to the player.

## 1. Shape of a pack

```js
B2B.registerPack({
  id: 'public',
  title: 'General principles',
  version: 1,

  house: {
    firm: 'Last Shot Supply Co.',     // the player's company
    town: 'Caveat Creek',
    paper: 'The Caveat Creek Courier', // the newspaper's masthead
    telegraph: 'Territorial Telegraph', // the telegraph company: its forms and its sign
    currency: '',                     // printed before amounts; empty in the public pack
    reallife: {}                      // optional: scenario id -> text for the "In real life" box
  },

  cast: {
    narrator: { name: '' },
    clerk:    { name: 'the telegraph clerk', look: 'clerk' },
    vance:    { name: 'Ms Vance', title: 'Attorney', look: 'lawyer' },
    dade:     { name: 'Mr Dade', title: 'Project Manager', look: 'foreman' }
  },

  hide: [],                           // scenario ids from earlier packs to leave out of the picker

  scenarios: [ /* see section 2 */ ]
});
```

`look` picks one of the figure silhouettes defined in `docs/ART.md`.

## 2. Shape of a scenario

```js
{
  id: 's1',
  title: 'The new entity',
  blurb: 'An order from a company you know. Or do you?',   // one line, shown in the picker
  tags: ['purchase order', 'group customer'],               // shown in the picker, used to filter
  minutes: 6,

  skin: { group: 'Hartwell Rail Group', groupShort: 'Hartwell', buyer: 'Marsh', poNumber: '4471' },
  k:    { orderValue: 6000, margin: 1500, claim: 20000000, cap: 50000, followOn: 75000 },
  vars: { how: null },                 // every variable, with its default
  start: 'po',

  nodes: { /* see section 3 */ },

  derive:  function (v, k) { return {}; },                    // optional: extra placeholder values
  settle:  function (v, k) { return { lines: [], net: 0 }; }, // required
  whatIfs: function (v, k) { return []; },                    // optional

  lessons: [
    { text: 'A new company in a group you know is a new customer.', small: '', when: null }
  ],
  reallife: 'Not sure a customer is set up on your terms? Check before you ship.'
}
```

- `skin` holds names. `k` holds numbers. `vars` holds what the player's choices set.
- `derive`, `settle`, `whatIfs`, and any function used for `text` or `next`, are small pure
  functions: same input, same output, no side effects, no dates, no randomness, no DOM.
  Nothing else in a pack is code.
- `settle` returns `{ lines: [{ id, label, amount, detail? }], net }` plus any other fields
  the scenario wants to use as placeholders. `net` must equal the sum of the line amounts.
  It may be called at any node, so it must cope with variables still at their defaults.
  It may also return `tally`, rows of `{ label, value }` shown above the money on the
  ending ledger (the count block in `s2`), and `note`, one line shown under the ledger.
- `whatIfs` returns `[{ id, state: 'on' | 'off', amount, text }]`. In `text`, `{amount}` is
  that entry's own amount.
- `whatIfNote` is optional: one line of small print under the what-it-was-worth lines,
  shown only when there is at least one line.
- `lessons[].when` is `null` or a function of `v` that says whether this lesson bit the
  player on this run.

## 3. Nodes

A scenario is a set of nodes. Four kinds.

| `kind` | What it does | Ends with |
|---|---|---|
| `beat` | Shows one thing and waits for the player to continue. | `next` |
| `choice` | The player picks one option. | each option's `next` |
| `pick` | The player picks exactly `count` options, then confirms. | `next` |
| `ending` | Shows the outcome, then the ledger. | nothing |

### Fields

| Field | Kinds | Meaning |
|---|---|---|
| `at` | all | Where it happens: `telegraph`, `supply`, `law`, `depot`, `yard`, `courthouse`. |
| `show` | beat, ending | The prop: `telegram`, `page`, `ledger`, `card`, `poster`, `paper`, `say`, `note`. |
| `text` | beat, ending | A string, an array of paragraphs, or a function `(v, k, d) => string or array`. `d` is the derived values. |
| `lead`, `foot` | beat, ending | One line above and one line below the prop. Same types as `text`. |
| `from`, `to` | telegram | Sender, or addressee for an outgoing one. `to` makes the telegram outgoing. |
| `who` | say, page | Cast id of the speaker, or of the person handling the page. |
| `title`, `headline`, `stamp` | page, card, paper, poster; also `headline` on ledger, `stamp` on telegram | The prop's heading, and a rubber stamp across it. |
| `small` | card | One line of small print under the title. |
| `face` | page | `up` or `down`. A page shown face down shows only its `title`. |
| `mood` | beat, ending | `dawn`, `day`, `dusk`, `night`, `storm`. Stays until another node changes it. |
| `event` | beat | A stage event played before the prop: `trainOut` or `trainIn`. Only at `depot`. |
| `week` | beat, choice | Number, or a placeholder string. Sets the week counter. Stays until changed. |
| `next` | beat, pick | A node id, or a function `(v, k) => node id`. |
| `prompt` | choice, pick | The question. |
| `hint`, `who` | pick | An optional line from a character, shown under the prompt. |
| `options` | choice | 2 to 4 of `{ id, label, note?, set?, next }`. |
| `options`, `count` | pick | 3 or more of `{ id, label, text, set }`, and how many to pick. |
| `result` | ending | `deal`, `claim`, `lost` or `settled`. Drives the ending's look and the year-end tally. |

Only options change variables (`set`). Beats never do.

### Example

```js
nodes: {
  po: {
    kind: 'beat', at: 'telegraph', show: 'telegram', mood: 'day',
    from: '{entity}',
    text: 'PURCHASE ORDER {poNumber} STOP 600 HIGH TENSILE BRIDGE BOLTS STOP ... STOP {buyer}',
    next: 'clerk'
  },
  c1: {
    kind: 'choice', at: 'supply',
    prompt: 'The order is waiting. What do you do?',
    options: [
      { id: 'clone', label: 'Copy the {group} account for the new company and ship.',
        note: 'Fastest. The warehouse can pick it today.',
        set: { how: 'cloned' }, next: 'ship_clone' },
      { id: 'pack', label: 'Send the new company the onboarding pack first.',
        note: 'An account form and our terms. It could take days.',
        next: 'pack_reply' }
    ]
  },
  later: {
    kind: 'beat', at: 'courthouse', show: 'paper', mood: 'night',
    lead: 'Eleven months later.',
    headline: 'NORTHERN BRIDGE CLOSED. BOLTS BLAMED.',
    text: 'Line shut for the season. The railroad counts its losses and sends for its lawyers.',
    next: function (v) { return v.how === 'capped' ? 'end_deal' : 'end_lawsuit'; }
  },
  end_lost: {
    kind: 'ending', result: 'lost', at: 'supply', show: 'telegram', mood: 'dusk',
    from: '{entity}',
    text: 'ORDER {poNumber} WITHDRAWN STOP AWARDED ELSEWHERE STOP {buyer}',
    foot: 'You kept your terms and lost the order.'
  }
}
```

## 4. Placeholders

`{name}` in any text is replaced when the node is shown. First match wins, in this order:

1. `derive(v, k)`
2. `settle(v, k)`
3. the variables
4. `k`
5. `skin`
6. `house`

Numbers are printed with thousands separators, and with `house.currency` in front when it
is set. Telegram text is shown in capitals by the prop, so names in `skin` are written
normally.

People and company names always go in as placeholders. Place flavour (the northern line,
the bridge) may be typed out until skins arrive in milestone M6.

A placeholder that resolves to nothing is an error, caught by the checker.

## 5. Reading a scenario script

The scripts in `docs/scenarios/` are written for a human author. Each node is a heading
followed by a few labelled lines. Converting a script to a pack is mechanical:

| In the script | In the pack |
|---|---|
| Heading: `` `id` · beat · at `x` · show `y` · mood `z` · week `n` · face `up` · stamp `S` · event `e` `` | `id` is the key; the rest are fields of the same name |
| `· outgoing` with a `to:` line | `to: '...'` |
| `· who` on the heading, or `hint (who ...)` | `who: '...'` |
| `from:`, `to:`, `lead:`, `foot:`, `title:`, `headline:`, `stamp:`, `prompt:` | the field of the same name |
| The quoted block (`>` lines) | `text`. A blank quoted line starts a new paragraph. |
| "text, by `var`:" followed by a list | `text` is a function of the variables |
| "next, by ...:" | `next` is a function of the variables |
| `` - `id` · "Label" `` with `note:`, `set a=b`, `next x` | one entry in `options` |
| `ending · result x` | `kind: 'ending', result: 'x'` |
| `pick two` | `kind: 'pick', count: 2` |

Rules for converting:

- **Copy wording exactly.** Every label, line and number in a script is the author's. Do
  not improve, shorten, re-order or re-punctuate it. If something will not fit on screen,
  raise it at the check-in. Do not cut it.
- **Do not add content.** No extra beats, options, clauses, jokes or numbers. If the
  script leaves a gap, ask.
- Ids are used exactly as written. The fixtures depend on option ids.
- Where a script and this document disagree about format, this document wins. Where they
  disagree about content, the script wins.

## 6. What the checker enforces

`node tools/check.js` validates every pack it is given. A pack fails if:

1. Ids repeat, `start` is missing, or a `next` points at a node that does not exist.
2. Any path through a scenario fails to reach an ending within 80 steps, or a node can
   never be reached.
3. A node has a field its kind does not allow, an unknown `at`, `show`, `mood`, `event`,
   `result` or cast id, or a choice with fewer than 2 or more than 4 options.
4. A `pick` has `count` equal to or above its number of options.
5. Any text, on any path, contains a placeholder that does not resolve.
6. `settle` on any ending returns a `net` that is not the sum of its line amounts, or any
   amount that is not a finite number.
7. A text is too long for its prop. Starting limits, in characters: option label 80,
   option note 80, lead or foot 220, telegram 320, say 400, note 400, page 600, card 700,
   headline 48. The v1 scripts were written to fit. If a script line breaks a limit, raise
   the limit after checking the screenshot. Do not edit the line.
8. For a scenario with a fixture in `docs/scenarios/fixtures/`: the pack's `k` differs
   from the fixture's, or replaying any fixture path gives a different ending, result or
   what-if amount.

## 7. Private packs

A private pack is an ordinary pack in `packs/private.js`. It loads after the public pack.

What it may do:

| To | Do this |
|---|---|
| Replace the "In real life" box of a public scenario | `house.reallife: { s1: 'Use the Send to Legal button on the customer email.' }` |
| Rename the player's company, set a currency | `house.firm`, `house.currency` |
| Add scenarios | List them in `scenarios` with new ids |
| Replace a public scenario | Give a scenario the same `id`. The whole scenario is replaced. There is no partial merge. |
| Hide a public scenario | `hide: ['s2']` |

Rules:

- `packs/private.js` is listed in `.gitignore`. The checker fails if git is tracking it.
- It is validated by the same checker: `node tools/check.js --pack packs/private.js`.
- No network addresses, no code beyond the small pure functions described above.
- `packs/private.example.js` is the template. It is in git and contains only invented
  content.

## 8. Variation: skins and wildcards (milestone M6)

Used only when the set-up screen has a seed, or wildcards on (SPEC 9). Otherwise the game
plays the script exactly.

- `skins` on a scenario: other deals for replays.
  `skins: { amounts: ['orderValue', 'margin'], sets: [{ scale: 2, names: { buyer: 'Quill' } }] }`.
  A set's `names` replace keys of `skin`; its `scale` multiplies every `k` key listed in
  `amounts`, together. The scenario's functions see the factor as `k.scale`, so `k` may
  not have its own `scale`. Names tied to a cast member stay out of the sets.
- `wild` on a node: the name of a wildcard slot.
- `wildcards` on a pack: the cards.
  `{ id, scenario, slot, headline, text, k: { penalty: 450 } }` changes one number in `k`;
  `{ id, scenario, slot, headline, text, next: 'nodeId' }` changes the `next` of the beat
  that names the slot. The headline and text are shown as a newspaper front page before
  that node.
- `seed` in the session options. The same seed gives the same session.

The checker plays every path of every skin set and every wildcard.

## 9. Writing rules for new content

For anyone adding a scenario later, human or model.

- One prop per beat. One idea per beat.
- Plain words. A salesperson with no legal training reads every line once and understands it.
- Telegrams: short clauses joined by STOP, signed with a name.
- Clauses on a page: invented wording, one or two sentences, numbered.
- Every choice has at least two options a reasonable person would take. No option is
  labelled so that it is obviously wrong.
- The same misfortune lands on every path where the goods ship. The player's choices
  decide what it costs, never whether it happens.
- Amounts are plain numbers. Outcomes are computed by `settle`, never typed into text.
