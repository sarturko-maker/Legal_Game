# Scenario 2: The delay clause

Scenario id: `s2` · Playing time: 10 to 12 minutes · Tags: `EPC contractor`, `projects`, `delay damages`, `delivery`

This file is the script. Wording, numbers and outcomes here are the author's and are
copied into the pack as written. The notation is explained in `docs/PACK-FORMAT.md`
(section "Reading a scenario script").

A word on terms. Contracts call these liquidated damages, or LDs. The game says "delay
damages" and shows the contract's own name once, on Ms Vance's card.

## What it teaches

1. You rarely get delay damages struck out. You can nearly always shape them: weekly
   instead of daily, a low rate, a ceiling, "only remedy", a grace period.
2. A ceiling below your margin, with delay damages as the only remedy, means lateness can
   cost you profit but cannot turn the deal into a loss.
3. If your vendor will not carry the same clause, the gap is yours. Add slack to the date
   you promise.
4. A well-negotiated clause only protects you if the paperwork during the job matches it.
   "That's fine" from the project manager does not move the date in the order.
5. Keep the record as you go. You will need it to show that their delay caused yours.

## The story in one paragraph

An EPC contractor invites you to quote for a large cable order on its own conditions,
with a delay clause it says is not negotiable. You can sign, refuse, or take it to legal.
With legal you agree a weekly rate and then choose two of three safeguards. Your cable
mill refuses to carry delay damages, so you decide how much slack to build into your
date. Then the job runs. The customer's Consulting Engineer sits on the sample approval
for weeks, the project manager says the date can move, and the contractor's Commercial
Office later deducts delay damages anyway because the order was never amended. The final
ledger itemises what each protection saved or would have saved.

## Cast and names (the default skin)

| Key | Default | Notes |
|---|---|---|
| `contractor` | Ironhorse Construction Co. | EPC contractor building the northern line for the railroad. |
| `contractorShort` | Ironhorse | How people in town say it. |
| `pike` | Pike | Purchasing Agent. The only person who can change the order. |
| `dade` | Dade | Project Manager. Runs the site. Cannot change the order. |
| `engineer` | Dr Lindqvist | The railroad's Consulting Engineer. Approves samples. |
| `engineerShort` | Lindqvist | How he signs a telegram. |
| `mill` | Lakeside Cable Works | Your vendor. |
| `product` | cable | 400 drums. |
| `poNumber` | 7730 | |
| `lawyer` | Ms Vance | Cast id `vance`. |

## Numbers (`k`)

Plain numbers, no currency. All are illustrative. They are also the header of
`fixtures/s2-paths.json`, and the pack's `k` must equal them.

| Key | Value | Meaning |
|---|---|---|
| `orderValue` | 2,000,000 | Value of the order. |
| `margin` | 200,000 | Margin on the order (10%). |
| `ratePct` | 1 | Percent of order value: per day on the draft, per week once negotiated. So 20,000 a day or 20,000 a week. |
| `capPct` | 5 | The ceiling: 5% of order value, 100,000. Half the margin. |
| `graceWeeks` | 2 | The grace period. |
| `leadWeeks` | 12 | The mill's lead time: 3 weeks for sample approval, 9 to make and ship. |
| `bufferWeeks` | 2 | The slack the player can add. |
| `millSlipWeeks` | 3 | How late the mill runs for its own reasons. |
| `approvalLateWeeks` | 8 | How late the Engineer's approval is (due week 3, arrives week 11). |
| `arguedReliefWeeks` | 4 | Weeks conceded after an argument, when you have a record but no amendment. |
| `riskWeeks` | 5 | Weeks lost if production starts without approval (3 already gone by week 6, 2 to remake). |
| `remakeCost` | 120,000 | Cost of remaking the scrapped part of the run. |
| `extraClaim` | 400,000 | The contractor's other losses, claimable when delay damages are not the only remedy. |
| `extraFromWeeks` | 4 | ...and the delivery is at least this many weeks late. |

## Map

```
ACT 1  THE CLAUSE
packet > sums > clause > cA
  cA sign ..................................... signed_draft > flow
  cA refuse > refused > cA2
     cA2 sign ................................. signed_draft > flow
     cA2 walk ................................. end_lost
     cA2 law .................................. law_intro
  cA law > law_intro > law_card > rate_out > rate_in > pick (two of three) > agreed > flow

flow
  flow quote12 ................................ po
  flow ask > mill_no > cF2
     cF2 quote12 .............................. po
     cF2 quote14 > fourteen ................... po

ACT 2  THE DELIVERY
po > samples > silence > cD
  cD verbal > d_verbal ........................ approval
  cD wire > d_wire_out > d_wire_in ............ approval
  cD formal > d_formal > cD3
     cD3 takeword ............................. approval
     cD3 standfirm > d_standfirm .............. approval
     cD3 law > d_law > d_amended .............. approval
  cD risk > d_risk > risk_comments ............ mill_slip

approval > mill_slip > delivered > claim > (protest) > end_settled
```

145 complete paths, 32 distinct outcomes plus "order lost". Expected results for every
path are in `fixtures/s2-paths.json`.

## Variables

Only options set variables. Beats never do.

| Var | Default | Values | Set by |
|---|---|---|---|
| `terms` | none | `draft`, `negotiated` | `cA`, `cA2` |
| `cap` | false | true, false | `pick` |
| `sole` | false | true, false | `pick` |
| `grace` | false | true, false | `pick` |
| `asked` | false | true, false | `flow` |
| `buffer` | 0 | 0, 2 | `flow`, `cF2` |
| `route` | none | `verbal`, `wire`, `tookword`, `stoodfirm`, `amended`, `risk` | `cD`, `cD3`. Used for text. |
| `paperwork` | `none` | `none`, `argued`, `amended` | `cD`, `cD3` |
| `riskStart` | false | true, false | `cD` |

Derived values, available as placeholders from `settle`: `poWeek`, `dueWeek`,
`deliveredWeek`, `reliefWeeks`, `weeksLate`, `chargeable`, `chargeUnit`, `damages`,
`capped`, `extra`, `remake`, `bill`, `net`.

## Script: Act 1, the clause

#### `packet` · beat · at `telegraph` · show `telegram` · mood `day`
from: {contractor}
> INVITATION TO QUOTE STOP 400 DRUMS OF CABLE FOR THE NORTHERN LINE STOP OUR CONDITIONS OF
> PURCHASE FOLLOW BY POST STOP NOTE CLAUSE 11 DELAY STOP NOT NEGOTIABLE STOP {pike}
> PURCHASING AGENT

next: `sums`

#### `sums` · beat · at `supply` · show `ledger`
lead: You work the numbers at the counter.
> Order value: {orderValue}.
>
> Your margin: {margin}.

foot: The biggest order of the year.

next: `clause`

#### `clause` · beat · at `supply` · show `page` · face `up`
lead: The conditions arrive. Somebody at {contractor} has underlined clause 11.
> 11. DELAY. If the Supplier delivers late it shall pay the Contractor 1% of the Order
> value for each day of delay. This does not limit any other right of the Contractor.

next: `cA`

#### `cA` · choice · at `supply`
prompt: The conditions are on your counter. What do you do?
- `sign` · "Sign and return them."
  note: It is their standard form. Everyone on the line signs it. · set `terms=draft` · next `signed_draft`
- `refuse` · "Wire back: we do not accept delay damages."
  note: Simple. Clean. · next `refused`
- `law` · "Walk the conditions over to the Law Office."
  note: It is their paper, not yours. · set `terms=negotiated` · next `law_intro`

#### `refused` · beat · at `supply` · show `telegram` · mood `dusk`
from: {contractor}
> EVERY SUPPLIER ON THIS LINE CARRIES DELAY DAMAGES STOP THE RAILROAD HOLDS THE SAME
> CLAUSE OVER US STOP NO CLAUSE NO ORDER STOP {pike}

next: `cA2`

#### `cA2` · choice · at `supply`
prompt: No clause, no order. What now?
- `sign` · "Sign their conditions as they stand."
  note: {orderValue} is {orderValue}. · set `terms=draft` · next `signed_draft`
- `walk` · "Walk away from the order."
  note: Let somebody else carry clause 11. · next `end_lost`
- `law` · "Take it to the Law Office."
  note: There may be something between yes and no. · set `terms=negotiated` · next `law_intro`

#### `signed_draft` · beat · at `supply` · show `page` · face `up` · stamp `SIGNED`
> 11. DELAY. If the Supplier delivers late it shall pay the Contractor 1% of the Order
> value for each day of delay. This does not limit any other right of the Contractor.

foot: You sign. Clause 11 stands exactly as printed.

next: `flow`

#### `law_intro` · beat · at `law` · show `say` · who `vance`
> They will not take the clause out. They cannot: the railroad holds the same one over
> them. So we do not fight the clause. We shape it.

next: `law_card`

#### `law_card` · beat · at `law` · show `card`
title: DELAY DAMAGES: FOUR QUESTIONS
small print under the title: Your contract may call them liquidated damages, or LDs.
> 1. THE CLOCK. Daily or weekly, and at what rate? One percent a day is {dayRate} a day.
>    Your whole margin is gone in ten days.
>
> 2. THE CEILING. Is there a most you can ever owe?
>
> 3. THE ONLY REMEDY. Are delay damages all they can claim for lateness, or only the
>    start?
>
> 4. THE GRACE PERIOD. Does the clock start on day one?

next: `rate_out`

`{dayRate}` is `orderValue * ratePct / 100`: 20,000.

#### `rate_out` · beat · at `law` · show `telegram` · outgoing
to: {contractor}
> CLAUSE 11 STOP WE PROPOSE HALF OF ONE PERCENT PER WEEK IN PLACE OF ONE PERCENT PER DAY

next: `rate_in`

#### `rate_in` · beat · at `law` · show `telegram`
from: {contractor}
> WEEKLY AGREED STOP ONE PERCENT PER WEEK STOP THAT IS FINAL ON THE RATE STOP {pike}

foot: "Take it. {dayRate} a week instead of {dayRate} a day. The rate matters less than
the next three questions."

next: `pick`

#### `pick` · pick two · at `law`
prompt: {pike} will move on two more points. Not three. It is your deal: which two?
hint (who `vance`): Your margin is {margin}. Keep that number in your head while you
choose.
- `cap` · "A ceiling" · set `cap=true`
  text: Delay damages can never total more than 5% of the order value: {ceiling}.
- `sole` · "The only remedy" · set `sole=true`
  text: Delay damages are all they can claim for lateness. Nothing on top.
- `grace` · "A grace period" · set `grace=true`
  text: The first two weeks late cost nothing.

next: `agreed`

`{ceiling}` is `orderValue * capPct / 100`: 100,000.

#### `agreed` · beat · at `law` · show `page` · face `up` · stamp `AGREED`
lead: {pike} wires one word: AGREED. Clause 11 now reads:

The clause is built from the picks, in this order:

> 11. DELAY. If the Supplier delivers late it shall pay the Contractor 1% of the Order
> value for each full week of delay
>
> - if `grace`: ", not counting the first two weeks."  otherwise: "."
> - if `cap`: " Delay damages shall not exceed 5% of the Order value in total."
> - if `sole`: " Delay damages are the Contractor's only remedy for late delivery."
>   otherwise: " This does not limit any other right of the Contractor."

Note the last line. Without "only remedy", the sentence from the draft stays in.

next: `flow`

## Script: the date you promise

#### `flow` · choice · at `supply`
prompt: The cable comes from {mill}. Their lead time is 12 weeks. What date do you promise {contractorShort}?
- `quote12` · "Promise 12 weeks and place the order with the mill."
  note: {mill} have never let you down. · set `buffer=0`, `asked=false` · next `po`
- `ask` · "First ask the mill to carry the same delay clause."
  note: If you carry it, so should they. · set `asked=true` · next `mill_no`

#### `mill_no` · beat · at `supply` · show `telegram`
from: {mill}
> WE DO NOT ACCEPT DELAY DAMAGES FROM ANY CUSTOMER STOP LEAD TIME 12 WEEKS ESTIMATED STOP
> BEST ENDEAVOURS ONLY STOP

foot: So the gap is yours. You owe {contractorShort} for lateness, and the mill owes you
nothing.

next: `cF2`

#### `cF2` · choice · at `supply`
prompt: The mill will not carry the risk. What date do you promise?
- `quote12` · "12 weeks. The mill's date is your date."
  note: A shorter date wins orders. · set `buffer=0` · next `po`
- `quote14` · "14 weeks. Two weeks of slack of your own."
  note: A longer date might lose this one. · set `buffer=2` · next `fourteen`

#### `fourteen` · beat · at `supply` · show `telegram`
from: {contractor}
> FOURTEEN WEEKS STOP NOT A DAY MORE STOP THE PROGRAMME HAS NO SLACK AFTER THAT STOP {pike}

next: `po`

#### `po` · beat · at `supply` · show `page` · face `up` · week 0
title: PURCHASE ORDER {poNumber}
> 400 drums of cable. Delivery at the railhead: week {poWeek}.
>
> Clause 4. Production must not start until the Consulting Engineer has approved the
> samples.
>
> Clause 11. Delay: (if `terms=draft`) "as printed." (otherwise) "as agreed."
>
> Clause 19. This order may be changed only by a written amendment signed by the
> Purchasing Agent.

next: `samples`

## Script: Act 2, the delivery

From here the week counter shows in the corner of the screen.

#### `samples` · beat · at `supply` · show `note` · week 1
> Week 1. The samples go east to the Consulting Engineer. The programme allows him until
> week 3. The mill waits for his answer.

next: `silence`

#### `silence` · beat · at `supply` · show `telegram` · week 6 · mood `dusk`
from: {mill}
> WEEK SIX STOP STILL NO APPROVAL STOP WE CANNOT START THE RUN WITHOUT IT STOP EVERY WEEK
> WE WAIT IS A WEEK ON YOUR DATE STOP

next: `cD`

#### `cD` · choice · at `supply` · week 6
prompt: The Engineer is silent and your date is slipping. What do you do?
- `verbal` · "Go out to the site and tell the Project Manager the date will move."
  note: A word with the man who runs the job. · set `route=verbal`, `paperwork=none` · next `d_verbal`
- `wire` · "Wire the Project Manager and keep his reply."
  note: Something in writing. · set `route=wire`, `paperwork=argued` · next `d_wire_out`
- `formal` · "Take him a written delay notice and ask for the order date to be amended."
  note: By the book. Slower. · next `d_formal`
- `risk` · "Tell the mill to start the run now, without approval."
  note: Protect the date. · set `route=risk`, `riskStart=true` · next `d_risk`

#### `d_verbal` · beat · at `yard` · show `say` · who `dade`
> Yeah, that's fine. Everybody is waiting on the Engineer. Don't worry about the date.

next: `approval`

#### `d_wire_out` · beat · at `supply` · show `telegram` · outgoing
to: {dade}, {contractor}
> SAMPLES STILL WITH THE ENGINEER STOP OUR DELIVERY DATE WILL MOVE WEEK FOR WEEK STOP
> PLEASE CONFIRM

next: `d_wire_in`

#### `d_wire_in` · beat · at `supply` · show `telegram`
from: {contractor}
> UNDERSTOOD STOP FINE BY ME STOP {dade}

foot: You file his reply.

next: `approval`

#### `d_formal` · beat · at `yard` · show `say` · who `dade` · mood `storm`
lead: You put the notice on his desk.
> I don't have time for paperwork. I have told you it's fine. Just get on with it.

next: `cD3`

#### `cD3` · choice · at `yard`
prompt: He will not touch the paperwork. What do you do?
- `takeword` · "Take his word. He runs the job."
  note: You did serve the notice. · set `route=tookword`, `paperwork=argued` · next `approval`
- `standfirm` · "Stay put: no signature, no new date."
  note: He has to sign something. · set `route=stoodfirm`, `paperwork=argued` · next `d_standfirm`
- `law` · "Go and ask {lawyer}."
  note: There may be a quicker way to the same signature. · set `route=amended`, `paperwork=amended` · next `d_law`

#### `d_standfirm` · beat · at `yard` · show `say` · who `dade`
> Then we have a problem. I can't sign that. I build railroads. I don't change purchase
> orders. Leave it on the desk.

foot: A month later your notice is still on his desk.

next: `approval`

#### `d_law` · beat · at `law` · show `say` · who `vance`
> {dade} can say "fine" all day. Read clause 19: only the Purchasing Agent can change the
> order. So make it easy for the Purchasing Agent. One page. One change: the delivery date
> moves by every day the Engineer is late. Nothing else. Send it to {pike} with the
> receipt for your samples.

next: `d_amended`

#### `d_amended` · beat · at `law` · show `telegram` · stamp `AMENDED` · mood `day`
from: {contractor}
> AMENDMENT ONE TO PO {poNumber} SIGNED STOP DELIVERY DATE MOVES DAY FOR DAY WITH THE
> ENGINEERS APPROVAL STOP {pike}

next: `approval`

#### `d_risk` · beat · at `supply` · show `note` · week 6
> You wire the mill: start the run. The machines turn. Clause 4 says they should not.

next: `risk_comments`

#### `risk_comments` · beat · at `supply` · show `telegram` · week 11
from: {engineer}
> SAMPLES APPROVED WITH ONE CHANGE STOP MARKING ON THE SHEATH EVERY YARD NOT EVERY TEN
> STOP {engineerShort}

foot: A third of the run is already made the old way. It is scrap. Making it again costs
{remakeCost} and two of the weeks you thought you had saved.

next: `mill_slip`

#### `approval` · beat · at `supply` · show `telegram` · week 11
from: {engineer}
> SAMPLES APPROVED STOP PROCEED STOP {engineerShort}

foot: Eight weeks late. The mill starts the run.

next: `mill_slip`

#### `mill_slip` · beat · at `supply` · show `telegram` · week 17
from: {mill}
> COPPER DELIVERY LATE STOP THREE WEEKS LOST STOP REGRET STOP

foot, by variables:
- `buffer=2`: Your two weeks of slack swallow two of them.
- `buffer=0` and `asked=true`: You knew the mill would not stand behind its date, and you
  promised it anyway. All three weeks are yours.
- `buffer=0` and `asked=false`: You promised the mill's date as your own. All three weeks
  are yours.

next: `delivered`

#### `delivered` · beat · at `depot` · show `note` · week {deliveredWeek} · mood `day` · event `trainIn`
> Week {deliveredWeek}. Four hundred drums of cable on the platform. The order said
> week {poWeek}.

next: `claim`

#### `claim` · beat · at `supply` · show `page` · face `up`
title: {contractor}. COMMERCIAL OFFICE.
text, by `paperwork` and `riskStart`:
- `paperwork=amended`: Delivery date under Amendment 1: week {dueWeek}. Delivered: week
  {deliveredWeek}. Any delay damages due under clause 11 will be deducted from your
  invoice.
- `riskStart=true`: Delivery date under Purchase Order {poNumber}: week {poWeek}.
  Delivered: week {deliveredWeek}. Production began before approval, contrary to clause 4.
  Delay damages under clause 11 will be deducted from your invoice.
- otherwise: Delivery date under Purchase Order {poNumber}: week {poWeek}. Delivered:
  week {deliveredWeek}. Delay damages under clause 11 will be deducted from your invoice.

next, by variables: `route` is `verbal`, `wire`, `tookword` or `stoodfirm` goes to
`protest`; anything else goes to `end_settled`.

#### `protest` · beat · at `supply` · show `telegram` · mood `storm`
lead: You wire back: MR {dade} AGREED THE DATE WOULD MOVE.
from: {contractor}
> MR {dade} BUILDS RAILROADS STOP HE DOES NOT AMEND PURCHASE ORDERS STOP CLAUSE 19 STOP
> THE ORDER DATE GOVERNS STOP COMMERCIAL OFFICE

foot, by `route`:
- `verbal`: You have nothing in writing. {dade} has moved to another job and remembers
  nothing.
- `wire`: You have his wire. It takes four months of argument. They concede half the
  Engineer's delay: four weeks.
- `tookword`: You have your notice, and the date you served it. It takes four months of
  argument. They concede half the Engineer's delay: four weeks.
- `stoodfirm`: You have your notice, still unsigned. It takes four months of argument.
  They concede half the Engineer's delay: four weeks.

next: `end_settled`

#### `end_settled` · ending · result `settled` · at `supply` · show `ledger`
headline, by `net`:

| Net | Headline |
|---|---|
| 180,000 or more | DELIVERED. PAID. DONE. |
| 100,000 to 179,999 | LATE, AND STILL IN PROFIT |
| 0 to 99,999 | A YEAR'S WORK FOR SMALL CHANGE |
| −999,999 to −1 | THE CLAUSE ATE THE DEAL |
| −1,000,000 or worse | ONE PERCENT A DAY |

#### `end_lost` · ending · result `lost` · at `supply` · show `note` · mood `dusk`
> You walk away. {contractor} places the order with a rival, clause 11 and all.

## How the bill is worked out

The reference implementation is `s2Settle` in `fixtures/make-fixtures.js`. The pack's
`settle` must return the same numbers, plus the display lines below. In words:

1. **Weeks late.** Start with the Engineer's delay: 8 weeks. Take off the weeks excused:
   8 with a signed amendment, 4 with a record but no amendment, 0 with nothing in writing.
   Add the mill's 3 weeks. Take off your slack (0 or 2). Never below zero.
   If production started without approval, the first figure is 5 instead of 8 and nothing
   is excused.
2. **What is charged.** On the draft: every day late, at 20,000 a day. Once negotiated:
   every week late, at 20,000 a week, after taking off 2 weeks if you have the grace
   period.
3. **The ceiling.** If you have it, delay damages stop at 100,000.
4. **Other claims.** If delay damages are not the only remedy and you are 4 or more weeks
   late, the contractor also claims 400,000 for its own losses.
5. **Remake.** If production started without approval, add 120,000.
6. **Result.** Margin of 200,000, less everything above.

### The ledger screen

The count, then the money.

```
Promised            week {poWeek}
Delivered           week {deliveredWeek}
Excused             {reliefWeeks} weeks        (only if more than 0; "by amendment" or "after argument")
Late                {weeksLate} weeks
Grace               2 weeks free               (only with the grace period)
Charged             {chargeable} weeks at 20,000     (or "days" on the draft)

Margin on the order                      +200,000
Delay damages                            -{damages}    ("ceiling reached" when capped)
{contractorShort}'s other claims for the delay   -{extra}      (only if more than 0)
Scrapped cable, made again               -{remake}     (only if more than 0)
RESULT                                    {net}
```

### What each protection was worth

Under the ledger, one line per protection. The rule: change that one thing, keep
everything else, work out the bill again, show the difference. Expected amounts for every
path are in the fixture (`whatIfs`).

| id | You had it (`on`) | You did not (`off`) |
|---|---|---|
| `cap` | Your ceiling saved you {amount}. | A ceiling would have saved you {amount}. |
| `sole` | "Only remedy" saved you {amount}. | "Only remedy" would have saved you {amount}. |
| `grace` | Your grace period saved you {amount}. | A grace period would have saved you {amount}. |
| `buffer` | Your two weeks of slack saved you {amount}. | Two weeks of slack would have saved you {amount}. |
| `amendment` | The signed amendment saved you {amount}. | A signed amendment would have saved you {amount}. |
| `wait` | (never on) | Waiting for approval, with a signed amendment, would have saved you {amount}. |
| `negotiate` | (never on) | Negotiating the clause (weekly, with a ceiling and "only remedy") would have saved you {amount}. |

When the amount is 0, say so plainly: "Your ceiling made no difference this time." or "A
ceiling would have made no difference this time."

Small print under the list: "Each line takes one protection on its own. They overlap, so
the lines do not add up."

### All 32 outcomes

Generated by `make-fixtures.js`. "Slack" is the weeks added to the promised date.

| Clause | Slack | Delivery | Weeks late | Delay damages | Other claims | Remake | Bill | Net |
|---|---|---|---|---|---|---|---|---|
| draft, signed as sent | 0 | verbal only | 11 | 1,540,000 | 400,000 | 0 | 1,940,000 | -1,740,000 |
| draft, signed as sent | 0 | record, no amendment | 7 | 980,000 | 400,000 | 0 | 1,380,000 | -1,180,000 |
| draft, signed as sent | 0 | signed amendment | 3 | 420,000 | 0 | 0 | 420,000 | -220,000 |
| draft, signed as sent | 0 | started without approval | 8 | 1,120,000 | 400,000 | 120,000 | 1,640,000 | -1,440,000 |
| draft, signed as sent | 2 | verbal only | 9 | 1,260,000 | 400,000 | 0 | 1,660,000 | -1,460,000 |
| draft, signed as sent | 2 | record, no amendment | 5 | 700,000 | 400,000 | 0 | 1,100,000 | -900,000 |
| draft, signed as sent | 2 | signed amendment | 1 | 140,000 | 0 | 0 | 140,000 | 60,000 |
| draft, signed as sent | 2 | started without approval | 6 | 840,000 | 400,000 | 120,000 | 1,360,000 | -1,160,000 |
| ceiling + only remedy | 0 | verbal only | 11 | 100,000 (ceiling) | 0 | 0 | 100,000 | 100,000 |
| ceiling + only remedy | 0 | record, no amendment | 7 | 100,000 (ceiling) | 0 | 0 | 100,000 | 100,000 |
| ceiling + only remedy | 0 | signed amendment | 3 | 60,000 | 0 | 0 | 60,000 | 140,000 |
| ceiling + only remedy | 0 | started without approval | 8 | 100,000 (ceiling) | 0 | 120,000 | 220,000 | -20,000 |
| ceiling + only remedy | 2 | verbal only | 9 | 100,000 (ceiling) | 0 | 0 | 100,000 | 100,000 |
| ceiling + only remedy | 2 | record, no amendment | 5 | 100,000 | 0 | 0 | 100,000 | 100,000 |
| ceiling + only remedy | 2 | signed amendment | 1 | 20,000 | 0 | 0 | 20,000 | 180,000 |
| ceiling + only remedy | 2 | started without approval | 6 | 100,000 (ceiling) | 0 | 120,000 | 220,000 | -20,000 |
| ceiling + grace | 0 | verbal only | 11 | 100,000 (ceiling) | 400,000 | 0 | 500,000 | -300,000 |
| ceiling + grace | 0 | record, no amendment | 7 | 100,000 | 400,000 | 0 | 500,000 | -300,000 |
| ceiling + grace | 0 | signed amendment | 3 | 20,000 | 0 | 0 | 20,000 | 180,000 |
| ceiling + grace | 0 | started without approval | 8 | 100,000 (ceiling) | 400,000 | 120,000 | 620,000 | -420,000 |
| ceiling + grace | 2 | verbal only | 9 | 100,000 (ceiling) | 400,000 | 0 | 500,000 | -300,000 |
| ceiling + grace | 2 | record, no amendment | 5 | 60,000 | 400,000 | 0 | 460,000 | -260,000 |
| ceiling + grace | 2 | signed amendment | 1 | 0 | 0 | 0 | 0 | 200,000 |
| ceiling + grace | 2 | started without approval | 6 | 80,000 | 400,000 | 120,000 | 600,000 | -400,000 |
| only remedy + grace | 0 | verbal only | 11 | 180,000 | 0 | 0 | 180,000 | 20,000 |
| only remedy + grace | 0 | record, no amendment | 7 | 100,000 | 0 | 0 | 100,000 | 100,000 |
| only remedy + grace | 0 | signed amendment | 3 | 20,000 | 0 | 0 | 20,000 | 180,000 |
| only remedy + grace | 0 | started without approval | 8 | 120,000 | 0 | 120,000 | 240,000 | -40,000 |
| only remedy + grace | 2 | verbal only | 9 | 140,000 | 0 | 0 | 140,000 | 60,000 |
| only remedy + grace | 2 | record, no amendment | 5 | 60,000 | 0 | 0 | 60,000 | 140,000 |
| only remedy + grace | 2 | signed amendment | 1 | 0 | 0 | 0 | 0 | 200,000 |
| only remedy + grace | 2 | started without approval | 6 | 80,000 | 0 | 120,000 | 200,000 | 0 |

What the table shows, and what a player should be able to work out from the ledger:

- Ceiling plus "only remedy" never ends worse than +100,000 unless production started
  without approval. That is lesson 2.
- Ceiling plus grace looks safe and is the most dangerous pair: without "only remedy",
  one bad delivery brings the 400,000 claim on top.
- "Only remedy" plus grace does best when the delivery goes well and worst of the three
  when it goes badly.
- The draft loses money on every path except the best-run one, where it still takes
  140,000 of a 200,000 margin for one week's lateness.

## Debrief

Seven lessons. The screen shows at most four at a time: first the ones that bit the
player on this run (the "highlight when" column), then the rest in order.

| # | Lesson | Highlight when |
|---|---|---|
| 1 | You rarely get delay damages struck out. You can nearly always shape them: weekly not daily, a low rate, a ceiling, "only remedy", a grace period. | `terms=draft` |
| 2 | A ceiling below your margin, with delay damages as the only remedy, means lateness can cost you profit but cannot turn the deal into a loss. | `terms=negotiated` and not both `cap` and `sole` |
| 3 | A ceiling on its own is not enough. If delay damages are not the only remedy, the customer can claim its other losses on top. | `cap` and not `sole` |
| 4 | If your vendor will not carry the clause, the gap is yours. Buy time: promise a later date than your vendor promises you. | `buffer=0` |
| 5 | "That's fine" does not move the date in the order. A signed change from the person the contract names does. | `paperwork` is not `amended` and not `riskStart` |
| 6 | Keep the record as you go: what you sent, when you sent it, when the answer came. You will need it to show that their delay caused yours. | `paperwork=argued` |
| 7 | Do not start work the contract says needs approval. You turn their delay into your cost. | `riskStart` |

"In real life" box (public default, replaced by the private pack):

> A customer's contract with a delay clause goes to your legal team before you quote.
> During the job, tell them as soon as the customer's own delay starts to move your date.

## Slots for later (milestone M6, not before)

Skins: every key in the cast table, and the numbers scaled together from `orderValue`.

Wildcard slots, each with the default used when wildcards are off:

| Slot | Default | Alternatives to design with the author |
|---|---|---|
| `millSlip` | 3 weeks | 1 week, 5 weeks |
| `approvalLate` | 8 weeks | 4 weeks, 12 weeks |
| `engineerVerdict` (risk path) | Approved with one change | Approved as sent: the gamble pays |
| `pikeSigns` | Signs the amendment at once | Sends you through his own form: two more weeks |
| `thirdPoint` | Pike gives two safeguards | Pike gives all three |

## Author notes (not shown in the game)

Points added to the author's brief, for him to confirm or strike (see `docs/DECISIONS.md`, D3):

- "Pick two of three." His brief lists the safeguards. Making the player choose two is a
  game device, so that the choice has a cost and the ledger can show it. The alternative
  (all three available) is the `thirdPoint` slot.
- The opening counter of 0.5% a week, settled at 1% a week.
- Clause 19 and the split between the Project Manager, who says "fine", and the
  Purchasing Agent, who can change the order. This is the reason the Commercial Office
  later ignores what the Project Manager said.
- "Record but no amendment" earning back half the Engineer's delay after an argument. His
  brief says you are still hit and then have to prove they prevented you. Four weeks out
  of eight is a fixed, deliberately unsatisfying middle.
- Starting production without approval, as a fourth option.
- The 400,000 of other claims, and the rule that it applies from 4 weeks late.
- The ledger lines showing what each protection was worth.

Legal basis, for adapting to other countries:

- Clause 19 is a "no oral modification" clause. English courts give effect to them
  (*Rock Advertising v MWB Business Exchange Centres* [2018] UKSC 24), with narrow room
  for estoppel. Where local law is more relaxed about informal changes, soften the
  `protest` scene.
- The argument the player is left with on the "record, no amendment" paths is prevention:
  the customer cannot charge for delay it caused. It turns on evidence, which is lesson 6.
- "Only remedy" clauses often come with a right to cancel once the ceiling is reached.
  The game does not go there. A facilitator may want to.

Questions a facilitator can put to the room:

- Which two did you pick, and what number were you looking at when you chose?
- On our jobs, who can actually change a delivery date? Is it the person we talk to
  every day?
- When did we last start work before an approval arrived, and who knew?
