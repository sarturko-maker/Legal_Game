# Scenario 1: The new entity

Scenario id: `s1` · Playing time: 5 to 7 minutes · Tags: `purchase order`, `group customer`, `whose terms`

This file is the script. Wording, numbers and outcomes here are the author's and are
copied into the pack as written. The notation is explained in `docs/PACK-FORMAT.md`
(section "Reading a scenario script").

## What it teaches

1. A new company inside a group you already supply is a new customer. Your terms do not
   travel with the family name.
2. If the customer's order is the last paper on the table when you ship, expect the
   customer's conditions to apply.
3. A small order can carry a very large claim.
4. Legal's first answer is the full answer. When there is no time for it, go back and ask
   for the smallest change that makes the deal safe.

## The story in one paragraph

A purchase order arrives from a company in a group you have traded with for years. This
particular company was never onboarded, so it has never agreed to your terms. You can copy
the group's account and ship, or send the onboarding pack. If you send the pack, the
customer refuses it and sends its own conditions. If you take those to legal, the customer
loses patience and threatens to put the order out to tender. A second visit to legal
produces a one-line fix. Eleven months later a batch of the bolts fails. What you owe
depends on the paper you shipped under.

## Cast and names (the default skin)

| Key | Default | Notes |
|---|---|---|
| `firm` | Last Shot Supply Co. | The player's company. From the pack's `house` block. |
| `group` | Hartwell Rail Group | Long-standing customer, onboarded, buys on your terms. |
| `groupShort` | Hartwell | How people in town say it. |
| `entity` | Hartwell Northern Extension Co. | New company in the group. No account. |
| `buyer` | Marsh | Buyer at the new company. Signs telegrams. |
| `project` | Northern Extension | What the new company is building. |
| `product` | high-tensile bridge bolts | Low value, critical use. |
| `lawyer` | Ms Vance | Cast id `vance`. |
| `poNumber` | 4471 | |

## Numbers (`k`)

Plain numbers, no currency. All are illustrative.

| Key | Value | Meaning |
|---|---|---|
| `orderValue` | 6,000 | Value of the order. |
| `margin` | 1,500 | Margin on the order. |
| `claim` | 20,000,000 | The claim when the bolts fail. |
| `cap` | 50,000 | The liability cap in the one-line fix. |
| `followOn` | 75,000 | Margin on the follow-on orders you keep if the deal is done safely. |

## Map

```
po > clerk > ledger > c1
  c1 clone ............................ ship_clone > later > end_lawsuit
  c1 pack > pack_reply > their_terms > c2
     c2 agree ......................... ship_agreed > later > end_lawsuit
     c2 law > law1 > redlines > c3
        c3 cave ....................... ship_caved > later > end_lawsuit
        c3 standfirm .................. end_lost
        c3 law > law2 > fix_out > fix_in > ship_capped > later > end_deal
```

Only options set variables. Beats never do.

Five complete paths. Expected results are in `fixtures/s1-paths.json`.

## Variables

| Var | Values | Set by |
|---|---|---|
| `how` | `cloned`, `agreed`, `caved`, `stoodfirm`, `capped` | The choice that decides the ending. Used for ending text. |

## Script

#### `po` · beat · at `telegraph` · show `telegram` · mood `day`
from: {entity}
> PURCHASE ORDER {poNumber} STOP 600 HIGH TENSILE BRIDGE BOLTS STOP DELIVER RAILHEAD IN
> 14 DAYS STOP OUR PURCHASE CONDITIONS APPLY STOP FIRST ORDER OF MANY FOR THE {project}
> STOP {buyer}

next: `clerk`

#### `clerk` · beat · at `telegraph` · show `say` · who `clerk`
> {groupShort} again. Good customers of yours. Worth {orderValue}, that one. Not much, for a
> bridge.

next: `ledger`

#### `ledger` · beat · at `supply` · show `ledger`
lead: You check the account book before you book the order.
> {group}. Customer since 1871. Onboarded. Buys on our terms.
>
> {entity}. No account. Never onboarded.

foot: Same family name. Different company. The new one has never agreed to your terms.

next: `c1`

#### `c1` · choice · at `supply`
prompt: The order is waiting. What do you do?
- `clone` · "Copy the {group} account for the new company and ship."
  note: Fastest. The warehouse can pick it today. · set `how=cloned` · next `ship_clone`
- `pack` · "Send the new company the onboarding pack first."
  note: An account form and our terms. It could take days. · next `pack_reply`

#### `ship_clone` · beat · at `depot` · show `note` · event `trainOut`
> The order goes straight to the warehouse. Nothing goes back to {entity} except the
> bolts.

next: `later`

#### `pack_reply` · beat · at `supply` · show `telegram`
lead: You send the pack. The answer is back within the hour.
from: {entity}
> NOT SIGNING SUPPLIER FORMS STOP WE BUY ON OUR CONDITIONS STOP COPY FOLLOWS STOP CONFIRM
> THE ORDER TODAY STOP {buyer}

next: `their_terms`

#### `their_terms` · beat · at `supply` · show `page` · face `down`
title: {entity}. Conditions of Purchase. Nine pages.

foot: Nine pages of small print. Nobody at {firm} has read them.

next: `c2`

#### `c2` · choice · at `supply`
prompt: Their conditions, or no order. What now?
- `agree` · "Wire back: agreed. Ship on their conditions."
  note: They are a good customer. How bad can nine pages be? · set `how=agreed` · next `ship_agreed`
- `law` · "Take the nine pages to the Law Office."
  note: Somebody should read them. · next `law1`

#### `ship_agreed` · beat · at `depot` · show `note` · event `trainOut`
> You wire your agreement. The bolts leave on the evening train. The nine pages go in a
> drawer, still face down.

next: `later`

#### `law1` · beat · at `law` · show `page` · face `up` · who `vance`
lead: {lawyer} turns the pages over, one at a time.
> Clause 9. The Supplier is liable for all losses of the Buyer, of any kind, without
> limit.
>
> Clause 12. The Supplier pays the Buyer's costs if anything it supplies fails.
>
> Clause 15. These conditions override any terms of the Supplier.

foot: "Bolts for a bridge, and no limit on what you owe if one fails. I have marked twelve
changes. Send them."

next: `redlines`

#### `redlines` · beat · at `law` · show `telegram` · mood `storm`
lead: The marked-up pages go to {entity}. The reply takes a day.
from: {entity}
> TWELVE CHANGES STOP NO TIME FOR THIS STOP PULLING THE ORDER STOP GOING TO TENDER MONDAY
> STOP {buyer}

next: `c3`

#### `c3` · choice · at `law`
prompt: He is pulling the order. What do you do?
- `cave` · "Withdraw the changes. Accept their conditions as they stand."
  note: Keep the order. Keep the customer. · set `how=caved` · next `ship_caved`
- `standfirm` · "Hold the line: our changes, or no order."
  note: Some orders are not worth having. · set `how=stoodfirm` · next `end_lost`
- `law` · "Ask {lawyer} whether there is a smaller ask."
  note: Twelve changes was her first answer. · set `how=capped` · next `law2`

#### `ship_caved` · beat · at `depot` · show `note` · event `trainOut`
> You withdraw all twelve changes. The bolts leave on the evening train.

next: `later`

#### `law2` · beat · at `law` · show `say` · who `vance`
> He has no time for twelve changes. He has time for one. Keep his conditions. Add a
> single line: our total liability under this order is capped at {cap}. This order only.
> Onboarding can wait until nobody is in a hurry.

next: `fix_out`

#### `fix_out` · beat · at `law` · show `telegram` · outgoing
to: {entity}
> YOUR CONDITIONS ACCEPTED FOR PO {poNumber} STOP ONE CHANGE STOP OUR TOTAL LIABILITY
> CAPPED AT {cap} STOP THIS ORDER ONLY STOP AGREED

next: `fix_in`

#### `fix_in` · beat · at `law` · show `telegram` · mood `dusk`
from: {entity}
> AGREED STOP SHIP THE BOLTS STOP {buyer}

next: `ship_capped`

#### `ship_capped` · beat · at `depot` · show `note` · event `trainOut`
> The bolts leave on the morning train. One line of ink travels with them.

next: `later`

#### `later` · beat · at `courthouse` · show `paper` · mood `night`
lead: Eleven months later.
headline: NORTHERN BRIDGE CLOSED. BOLTS BLAMED.
> Line shut for the season. The railroad counts its losses and sends for its lawyers.

next, by `how`: `capped` goes to `end_deal`; anything else goes to `end_lawsuit`.

#### `end_lawsuit` · ending · result `claim` · at `courthouse` · show `poster`
headline: CLAIM: {claim}
text, by `how`:
- `cloned`: Their order carried their conditions. Nothing went back from you except the
  bolts, so their paper was the last on the table and their conditions applied. Clause 9:
  no limit.
- `agreed`: You agreed to their conditions without reading them. Clause 9: no limit.
- `caved`: You saw clause 9. You withdrew the changes anyway. No limit.

foot (all three): An order worth {orderValue}.

#### `end_lost` · ending · result `lost` · at `supply` · show `telegram` · mood `dusk`
from: {entity}
> ORDER {poNumber} WITHDRAWN STOP AWARDED ELSEWHERE STOP {buyer}

foot: You kept your terms and lost the order. The {project} buys from a rival now: this
order, and the ones after it.

#### `end_deal` · ending · result `deal` · at `courthouse` · show `poster`
headline: CLAIM: {claim}
stamp: CAPPED AT {cap}
> The same bridge. The same bolts. The same claim. One line in the order says the most
> you can owe is {cap}. You pay it.
>
> {entity} signed the onboarding pack a month after that first order, once nobody was in
> a hurry. Every order since has been on your terms.

## The ledger

Shown after every ending. Amounts come from `settle`.

| Ending | Lines | Result |
|---|---|---|
| `end_lawsuit` | Margin on the order +1,500 · The claim −20,000,000 | −19,998,500 |
| `end_lost` | No lines. Note under the ledger: "The follow-on orders went with it." | 0 |
| `end_deal` | Margin on the order +1,500 · Follow-on orders +75,000 · The claim, capped −50,000 | +26,500 |

What the cap was worth (one line under the ledger, what-if id `cap`):

- Lawsuit endings: "One line capping your liability at 50,000 would have saved 19,950,000."
- Deal ending: "The one-line cap saved you 19,950,000."
- Order lost: nothing shown.

Reference `settle` for this scenario:

```js
function settle(v, k) {
  if (v.how === 'cloned' || v.how === 'agreed' || v.how === 'caved') {
    return { lines: [
      { id: 'margin', label: 'Margin on the order', amount: k.margin },
      { id: 'claim', label: 'The claim', amount: -k.claim },
    ], net: k.margin - k.claim };
  }
  if (v.how === 'capped') {
    return { lines: [
      { id: 'margin', label: 'Margin on the order', amount: k.margin },
      { id: 'followOn', label: 'Follow-on orders', amount: k.followOn },
      { id: 'cappedClaim', label: 'The claim, capped', amount: -k.cap },
    ], net: k.margin + k.followOn - k.cap };
  }
  return { lines: [], net: 0 }; // stoodfirm
}
```

## Debrief

Lessons, in this order. Each fits on one line of the debrief screen.

1. A new company in a group you know is a new customer. Your terms do not travel with the
   family name.
2. If their order is the last paper on the table when you ship, expect their conditions
   to apply.
3. The size of the order tells you nothing about the size of the claim.
4. Legal's first answer is the full answer. No time for it? Go back and ask for the
   smallest change that makes the deal safe.

Small print under lesson 2: "A rule of thumb under English law. Other countries decide
this differently. Ask your legal team."

"In real life" box (public default, replaced by the private pack):

> Not sure a customer is set up on your terms? Check before you ship. If the customer
> sends its own conditions, send them to your legal team with the order.

## Slots for later (milestone M6, not before)

Skins: every key in the cast table, and the numbers scaled together. The bridge in the
newspaper headline is typed out for now and becomes a skin key in M6.

Wildcard slots, each with the default used when wildcards are off:

| Slot | Default | Alternative to design with the author |
|---|---|---|
| `packAnswer` | Customer refuses the pack | Customer signs it |
| `standFirm` | Order lost | Customer comes back and accepts your terms |
| `fate` | The bolts fail | Nothing fails, and the shortcut pays |

## Author notes (not shown in the game)

Points added to the author's sketch, for him to confirm or strike (see `docs/DECISIONS.md`, D2):

- The two outcomes he did not specify: caving after the redlines leads to the lawsuit;
  standing firm loses the order.
- The follow-on margin of 75,000. It is there so that a safely done deal scores above a
  lost order. Without it, the capped deal ends at −48,500 and the lost order at 0, which
  rewards walking away.
- The claim lands on every path where the bolts ship. The paper you shipped under decides
  what it costs. The game never punishes a choice with bad luck that other choices escape.
- The cap figure, the clause wording and all names are invented.

Legal basis, for adapting to other countries:

- The "clone" path assumes nothing on the seller's terms went back to the customer before
  delivery, so the customer's order was the last document exchanged (the English
  "last shot" approach: *Butler Machine Tool v Ex-Cell-O* [1979] 1 WLR 401; *Tekdata v
  Amphenol* [2009] EWCA Civ 1209). If your order acknowledgement goes out on your terms,
  the analysis changes, and the story should change with it.

Questions a facilitator can put to the room:

- Who decides that a company is "the same customer"?
- What does our system send back when an order is booked, and on whose terms?
- What would you have asked legal for the first time, knowing the customer was in a hurry?
