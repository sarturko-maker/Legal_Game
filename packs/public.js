// The public pack: general principles only, invented names only (SPEC C8).
// Scenario wording is copied exactly from docs/scenarios/. Change the script first.
(function () {
  // Scenario 2's bill, from "How the bill is worked out" in its script; the same sums as
  // s2Settle in docs/scenarios/fixtures/make-fixtures.js. Named, because the what-if lines
  // and the ending's headline work the bill out again.
  function settle2(v, k) {
    if (!v.terms) return { lines: [], net: 0 };
    const unit = k.orderValue * k.ratePct / 100;
    const negotiated = v.terms === 'negotiated';
    const approvalWeeks = v.riskStart ? k.riskWeeks : k.approvalLateWeeks;
    const relief = v.riskStart ? 0 : { none: 0, argued: k.arguedReliefWeeks, amended: k.approvalLateWeeks }[v.paperwork];
    const weeksLate = Math.max(0, approvalWeeks - relief + k.millSlipWeeks - v.buffer);
    const graceWeeks = negotiated && v.grace ? k.graceWeeks : 0;
    const chargeable = negotiated ? Math.max(0, weeksLate - graceWeeks) : weeksLate * 7;
    const ceiling = k.orderValue * k.capPct / 100;
    const capped = negotiated && v.cap && chargeable * unit > ceiling;
    const damages = capped ? ceiling : chargeable * unit;
    const extra = !(negotiated && v.sole) && weeksLate >= k.extraFromWeeks ? k.extraClaim : 0;
    const remake = v.riskStart ? k.remakeCost : 0;
    const bill = damages + extra + remake;
    const poWeek = k.leadWeeks + v.buffer;
    const chargeUnit = negotiated ? 'week' : 'day';
    const count = function (n, placeholder, word) { return placeholder + ' ' + word + (n === 1 ? '' : 's'); };

    // The count block from "The ledger screen".
    const tally = [{ label: 'Promised', value: 'week {poWeek}' }, { label: 'Delivered', value: 'week {deliveredWeek}' }];
    if (relief > 0) {
      tally.push({ label: 'Excused', value: count(relief, '{reliefWeeks}', 'week') + (v.paperwork === 'amended' ? ' by amendment' : ' after argument') });
    }
    tally.push({ label: 'Late', value: count(weeksLate, '{weeksLate}', 'week') });
    if (graceWeeks) tally.push({ label: 'Grace', value: '{graceWeeks} weeks free' });
    tally.push({ label: 'Charged', value: count(chargeable, '{chargeable}', chargeUnit) + ' at {dayRate}' });

    const lines = [
      { id: 'margin', label: 'Margin on the order', amount: k.margin },
      { id: 'damages', label: 'Delay damages', amount: 0 - damages, detail: capped ? 'ceiling reached' : null }
    ];
    if (extra > 0) lines.push({ id: 'extra', label: '{contractorShort}\'s other claims for the delay', amount: 0 - extra });
    if (remake > 0) lines.push({ id: 'remake', label: 'Scrapped cable, made again', amount: 0 - remake });

    return {
      poWeek: poWeek,
      dueWeek: poWeek + relief,
      deliveredWeek: k.leadWeeks + approvalWeeks + k.millSlipWeeks,
      reliefWeeks: relief,
      weeksLate: weeksLate,
      chargeable: chargeable,
      chargeUnit: chargeUnit,
      damages: damages,
      capped: capped,
      extra: extra,
      remake: remake,
      bill: bill,
      net: k.margin - bill,
      lines: lines,
      tally: tally
    };
  }

  B2B.registerPack({
    id: 'public',
    title: 'General principles',
    version: 1,

    house: {
      firm: 'Last Shot Supply Co.',
      town: 'Caveat Creek',
      paper: 'The Caveat Creek Courier',
      telegraph: 'Territorial Telegraph',
      currency: '',
      reallife: {}
    },

    cast: {
      narrator: { name: '' },
      clerk: { name: 'the telegraph clerk', look: 'clerk' },
      vance: { name: 'Ms Vance', title: 'Attorney', look: 'lawyer' },
      dade: { name: 'Mr Dade', title: 'Project Manager', look: 'foreman' }
    },

    hide: [],

    scenarios: [
      // docs/scenarios/01-the-new-entity.md
      {
        id: 's1',
        title: 'The new entity',
        blurb: 'An order from a company you know. Or do you?',
        tags: ['purchase order', 'group customer', 'whose terms'],
        minutes: 6,

        skin: {
          group: 'Hartwell Rail Group',
          groupShort: 'Hartwell',
          entity: 'Hartwell Northern Extension Co.',
          buyer: 'Marsh',
          project: 'Northern Extension',
          product: 'high-tensile bridge bolts',
          lawyer: 'Ms Vance',
          poNumber: '4471',
          // The newspaper headline is set in capitals, so this name is too.
          bridge: 'NORTHERN BRIDGE'
        },
        k: { orderValue: 6000, margin: 1500, claim: 20000000, cap: 50000, followOn: 75000 },
        // Other deals for replays (SPEC 9). Ms Vance, the firm and the bolts stay the same.
        skins: {
          amounts: ['orderValue', 'margin', 'claim', 'cap', 'followOn'],
          sets: [
            {
              scale: 2,
              names: {
                group: 'Corvane Rail Group', groupShort: 'Corvane', entity: 'Corvane Canyon Spur Co.',
                buyer: 'Tolliver', project: 'Canyon Spur', poNumber: '5208', bridge: 'CANYON SPUR BRIDGE'
              }
            },
            {
              scale: 0.5,
              names: {
                group: 'Dunmarrow Rail Group', groupShort: 'Dunmarrow', entity: 'Dunmarrow Salt Flats Co.',
                buyer: 'Quill', project: 'Salt Flats Line', poNumber: '3916', bridge: 'SALT FLATS BRIDGE'
              }
            }
          ]
        },
        vars: { how: null },
        start: 'po',

        nodes: {
          po: {
            kind: 'beat', at: 'telegraph', show: 'telegram', mood: 'day',
            from: '{entity}',
            text: 'PURCHASE ORDER {poNumber} STOP 600 HIGH TENSILE BRIDGE BOLTS STOP DELIVER RAILHEAD IN 14 DAYS STOP OUR PURCHASE CONDITIONS APPLY STOP FIRST ORDER OF MANY FOR THE {project} STOP {buyer}',
            next: 'clerk'
          },
          clerk: {
            kind: 'beat', at: 'telegraph', show: 'say', who: 'clerk',
            text: '{groupShort} again. Good customers of yours. Worth {orderValue}, that one. Not much, for a bridge.',
            next: 'ledger'
          },
          ledger: {
            kind: 'beat', at: 'supply', show: 'ledger',
            lead: 'You check the account book before you book the order.',
            text: [
              '{group}. Customer since 1871. Onboarded. Buys on our terms.',
              '{entity}. No account. Never onboarded.'
            ],
            foot: 'Same family name. Different company. The new one has never agreed to your terms.',
            next: 'c1'
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
          ship_clone: {
            kind: 'beat', at: 'depot', show: 'note', event: 'trainOut',
            text: 'The order goes straight to the warehouse. Nothing goes back to {entity} except the bolts.',
            next: 'later'
          },
          pack_reply: {
            kind: 'beat', at: 'supply', show: 'telegram',
            lead: 'You send the pack. The answer is back within the hour.',
            from: '{entity}',
            text: 'NOT SIGNING SUPPLIER FORMS STOP WE BUY ON OUR CONDITIONS STOP COPY FOLLOWS STOP CONFIRM THE ORDER TODAY STOP {buyer}',
            next: 'their_terms'
          },
          their_terms: {
            kind: 'beat', at: 'supply', show: 'page', face: 'down',
            title: '{entity}. Conditions of Purchase. Nine pages.',
            foot: 'Nine pages of small print. Nobody at {firm} has read them.',
            next: 'c2'
          },
          c2: {
            kind: 'choice', at: 'supply',
            prompt: 'Their conditions, or no order. What now?',
            options: [
              { id: 'agree', label: 'Wire back: agreed. Ship on their conditions.',
                note: 'They are a good customer. How bad can nine pages be?',
                set: { how: 'agreed' }, next: 'ship_agreed' },
              { id: 'law', label: 'Take the nine pages to the Law Office.',
                note: 'Somebody should read them.',
                next: 'law1' }
            ]
          },
          ship_agreed: {
            kind: 'beat', at: 'depot', show: 'note', event: 'trainOut',
            text: 'You wire your agreement. The bolts leave on the evening train. The nine pages go in a drawer, still face down.',
            next: 'later'
          },
          law1: {
            kind: 'beat', at: 'law', show: 'page', face: 'up', who: 'vance',
            lead: '{lawyer} turns the pages over, one at a time.',
            text: [
              'Clause 9. The Supplier is liable for all losses of the Buyer, of any kind, without limit.',
              'Clause 12. The Supplier pays the Buyer\'s costs if anything it supplies fails.',
              'Clause 15. These conditions override any terms of the Supplier.'
            ],
            foot: '"Bolts for a bridge, and no limit on what you owe if one fails. I have marked twelve changes. Send them."',
            next: 'redlines'
          },
          redlines: {
            kind: 'beat', at: 'law', show: 'telegram', mood: 'storm',
            lead: 'The marked-up pages go to {entity}. The reply takes a day.',
            from: '{entity}',
            text: 'TWELVE CHANGES STOP NO TIME FOR THIS STOP PULLING THE ORDER STOP GOING TO TENDER MONDAY STOP {buyer}',
            next: 'c3'
          },
          c3: {
            kind: 'choice', at: 'law',
            prompt: 'He is pulling the order. What do you do?',
            options: [
              { id: 'cave', label: 'Withdraw the changes. Accept their conditions as they stand.',
                note: 'Keep the order. Keep the customer.',
                set: { how: 'caved' }, next: 'ship_caved' },
              { id: 'standfirm', label: 'Hold the line: our changes, or no order.',
                note: 'Some orders are not worth having.',
                set: { how: 'stoodfirm' }, next: 'end_lost' },
              { id: 'law', label: 'Ask {lawyer} whether there is a smaller ask.',
                note: 'Twelve changes was her first answer.',
                set: { how: 'capped' }, next: 'law2' }
            ]
          },
          ship_caved: {
            kind: 'beat', at: 'depot', show: 'note', event: 'trainOut',
            text: 'You withdraw all twelve changes. The bolts leave on the evening train.',
            next: 'later'
          },
          law2: {
            kind: 'beat', at: 'law', show: 'say', who: 'vance',
            text: 'He has no time for twelve changes. He has time for one. Keep his conditions. Add a single line: our total liability under this order is capped at {cap}. This order only. Onboarding can wait until nobody is in a hurry.',
            next: 'fix_out'
          },
          fix_out: {
            kind: 'beat', at: 'law', show: 'telegram',
            to: '{entity}',
            text: 'YOUR CONDITIONS ACCEPTED FOR PO {poNumber} STOP ONE CHANGE STOP OUR TOTAL LIABILITY CAPPED AT {cap} STOP THIS ORDER ONLY STOP AGREED',
            next: 'fix_in'
          },
          fix_in: {
            kind: 'beat', at: 'law', show: 'telegram', mood: 'dusk',
            from: '{entity}',
            text: 'AGREED STOP SHIP THE BOLTS STOP {buyer}',
            next: 'ship_capped'
          },
          ship_capped: {
            kind: 'beat', at: 'depot', show: 'note', event: 'trainOut',
            text: 'The bolts leave on the morning train. One line of ink travels with them.',
            next: 'later'
          },
          later: {
            kind: 'beat', at: 'courthouse', show: 'paper', mood: 'night',
            lead: 'Eleven months later.',
            headline: '{bridge} CLOSED. BOLTS BLAMED.',
            text: 'Line shut for the season. The railroad counts its losses and sends for its lawyers.',
            next: function (v) { return v.how === 'capped' ? 'end_deal' : 'end_lawsuit'; }
          },
          end_lawsuit: {
            kind: 'ending', result: 'claim', at: 'courthouse', show: 'poster',
            headline: 'CLAIM: {claim}',
            text: function (v) {
              return {
                cloned: 'Their order carried their conditions. Nothing went back from you except the bolts, so their paper was the last on the table and their conditions applied. Clause 9: no limit.',
                agreed: 'You agreed to their conditions without reading them. Clause 9: no limit.',
                caved: 'You saw clause 9. You withdrew the changes anyway. No limit.'
              }[v.how];
            },
            foot: 'An order worth {orderValue}.'
          },
          end_lost: {
            kind: 'ending', result: 'lost', at: 'supply', show: 'telegram', mood: 'dusk',
            from: '{entity}',
            text: 'ORDER {poNumber} WITHDRAWN STOP AWARDED ELSEWHERE STOP {buyer}',
            foot: 'You kept your terms and lost the order. The {project} buys from a rival now: this order, and the ones after it.'
          },
          end_deal: {
            kind: 'ending', result: 'deal', at: 'courthouse', show: 'poster',
            headline: 'CLAIM: {claim}',
            stamp: 'CAPPED AT {cap}',
            text: [
              'The same bridge. The same bolts. The same claim. One line in the order says the most you can owe is {cap}. You pay it.',
              '{entity} signed the onboarding pack a month after that first order, once nobody was in a hurry. Every order since has been on your terms.'
            ]
          }
        },

        settle: function (v, k) {
          if (v.how === 'cloned' || v.how === 'agreed' || v.how === 'caved') {
            return { lines: [
              { id: 'margin', label: 'Margin on the order', amount: k.margin },
              { id: 'claim', label: 'The claim', amount: -k.claim }
            ], net: k.margin - k.claim };
          }
          if (v.how === 'capped') {
            return { lines: [
              { id: 'margin', label: 'Margin on the order', amount: k.margin },
              { id: 'followOn', label: 'Follow-on orders', amount: k.followOn },
              { id: 'cappedClaim', label: 'The claim, capped', amount: -k.cap }
            ], net: k.margin + k.followOn - k.cap };
          }
          if (v.how === 'stoodfirm') {
            return { lines: [], net: 0, note: 'The follow-on orders went with it.' };
          }
          return { lines: [], net: 0 };
        },

        whatIfs: function (v, k) {
          if (v.how === 'cloned' || v.how === 'agreed' || v.how === 'caved') {
            return [{ id: 'cap', state: 'off', amount: k.claim - k.cap,
              text: 'One line capping your liability at {cap} would have saved {amount}.' }];
          }
          if (v.how === 'capped') {
            return [{ id: 'cap', state: 'on', amount: k.claim - k.cap,
              text: 'The one-line cap saved you {amount}.' }];
          }
          return [];
        },

        lessons: [
          { text: 'A new company in a group you know is a new customer. Your terms do not travel with the family name.', small: '', when: null },
          { text: 'If their order is the last paper on the table when you ship, expect their conditions to apply.',
            small: 'A rule of thumb under English law. Other countries decide this differently. Ask your legal team.', when: null },
          { text: 'The size of the order tells you nothing about the size of the claim.', small: '', when: null },
          { text: 'Legal\'s first answer is the full answer. No time for it? Go back and ask for the smallest change that makes the deal safe.', small: '', when: null }
        ],
        reallife: 'Not sure a customer is set up on your terms? Check before you ship. If the customer sends its own conditions, send them to your legal team with the order.'
      },

      // docs/scenarios/02-the-delay-clause.md
      {
        id: 's2',
        title: 'The delay clause',
        blurb: 'An EPC contractor invites you to quote for a large cable order on its own conditions, with a delay clause it says is not negotiable.',
        tags: ['EPC contractor', 'projects', 'delay damages', 'delivery'],
        minutes: 11,

        skin: {
          contractor: 'Ironhorse Construction Co.',
          contractorShort: 'Ironhorse',
          pike: 'Pike',
          dade: 'Dade',
          engineer: 'Dr Lindqvist',
          engineerShort: 'Lindqvist',
          mill: 'Lakeside Cable Works',
          product: 'cable',
          poNumber: '7730',
          lawyer: 'Ms Vance'
        },
        // Other deals for replays (SPEC 9). Mr Dade, Ms Vance, the firm and the cable stay the same.
        skins: {
          amounts: ['orderValue', 'margin', 'remakeCost', 'extraClaim'],
          sets: [
            {
              scale: 2,
              names: {
                contractor: 'Redmesa Construction Co.', contractorShort: 'Redmesa', pike: 'Crane',
                engineer: 'Dr Ostrander', engineerShort: 'Ostrander', mill: 'Bitterwell Cable Works', poNumber: '8152'
              }
            },
            {
              scale: 0.5,
              names: {
                contractor: 'Graystake Construction Co.', contractorShort: 'Graystake', pike: 'Hollis',
                engineer: 'Dr Fairweather', engineerShort: 'Fairweather', mill: 'Ember Ridge Cable Works', poNumber: '6614'
              }
            }
          ]
        },
        k: {
          orderValue: 2000000, margin: 200000, ratePct: 1, capPct: 5, graceWeeks: 2, leadWeeks: 12,
          bufferWeeks: 2, millSlipWeeks: 3, approvalLateWeeks: 8, arguedReliefWeeks: 4, riskWeeks: 5,
          remakeCost: 120000, extraClaim: 400000, extraFromWeeks: 4
        },
        vars: { terms: null, cap: false, sole: false, grace: false, asked: false, buffer: 0, route: null, paperwork: 'none', riskStart: false },
        start: 'packet',

        nodes: {
          packet: {
            kind: 'beat', at: 'telegraph', show: 'telegram', mood: 'day',
            from: '{contractor}',
            text: 'INVITATION TO QUOTE STOP 400 DRUMS OF CABLE FOR THE NORTHERN LINE STOP OUR CONDITIONS OF PURCHASE FOLLOW BY POST STOP NOTE CLAUSE 11 DELAY STOP NOT NEGOTIABLE STOP {pike} PURCHASING AGENT',
            next: 'sums'
          },
          sums: {
            kind: 'beat', at: 'supply', show: 'ledger',
            lead: 'You work the numbers at the counter.',
            text: ['Order value: {orderValue}.', 'Your margin: {margin}.'],
            foot: 'The biggest order of the year.',
            next: 'clause'
          },
          clause: {
            kind: 'beat', at: 'supply', show: 'page', face: 'up',
            lead: 'The conditions arrive. Somebody at {contractor} has underlined clause 11.',
            text: '11. DELAY. If the Supplier delivers late it shall pay the Contractor 1% of the Order value for each day of delay. This does not limit any other right of the Contractor.',
            next: 'cA'
          },
          cA: {
            kind: 'choice', at: 'supply',
            prompt: 'The conditions are on your counter. What do you do?',
            options: [
              { id: 'sign', label: 'Sign and return them.',
                note: 'It is their standard form. Everyone on the line signs it.',
                set: { terms: 'draft' }, next: 'signed_draft' },
              { id: 'refuse', label: 'Wire back: we do not accept delay damages.',
                note: 'Simple. Clean.',
                next: 'refused' },
              { id: 'law', label: 'Walk the conditions over to the Law Office.',
                note: 'It is their paper, not yours.',
                set: { terms: 'negotiated' }, next: 'law_intro' }
            ]
          },
          refused: {
            kind: 'beat', at: 'supply', show: 'telegram', mood: 'dusk',
            from: '{contractor}',
            text: 'EVERY SUPPLIER ON THIS LINE CARRIES DELAY DAMAGES STOP THE RAILROAD HOLDS THE SAME CLAUSE OVER US STOP NO CLAUSE NO ORDER STOP {pike}',
            next: 'cA2'
          },
          cA2: {
            kind: 'choice', at: 'supply',
            prompt: 'No clause, no order. What now?',
            options: [
              { id: 'sign', label: 'Sign their conditions as they stand.',
                note: '{orderValue} is {orderValue}.',
                set: { terms: 'draft' }, next: 'signed_draft' },
              { id: 'walk', label: 'Walk away from the order.',
                note: 'Let somebody else carry clause 11.',
                next: 'end_lost' },
              { id: 'law', label: 'Take it to the Law Office.',
                note: 'There may be something between yes and no.',
                set: { terms: 'negotiated' }, next: 'law_intro' }
            ]
          },
          signed_draft: {
            kind: 'beat', at: 'supply', show: 'page', face: 'up', stamp: 'SIGNED',
            text: '11. DELAY. If the Supplier delivers late it shall pay the Contractor 1% of the Order value for each day of delay. This does not limit any other right of the Contractor.',
            foot: 'You sign. Clause 11 stands exactly as printed.',
            next: 'flow'
          },
          law_intro: {
            kind: 'beat', at: 'law', show: 'say', who: 'vance',
            text: 'They will not take the clause out. They cannot: the railroad holds the same one over them. So we do not fight the clause. We shape it.',
            next: 'law_card'
          },
          law_card: {
            kind: 'beat', at: 'law', show: 'card',
            title: 'DELAY DAMAGES: FOUR QUESTIONS',
            small: 'Your contract may call them liquidated damages, or LDs.',
            text: [
              '1. THE CLOCK. Daily or weekly, and at what rate? One percent a day is {dayRate} a day. Your whole margin is gone in ten days.',
              '2. THE CEILING. Is there a most you can ever owe?',
              '3. THE ONLY REMEDY. Are delay damages all they can claim for lateness, or only the start?',
              '4. THE GRACE PERIOD. Does the clock start on day one?'
            ],
            next: 'rate_out'
          },
          rate_out: {
            kind: 'beat', at: 'law', show: 'telegram',
            to: '{contractor}',
            text: 'CLAUSE 11 STOP WE PROPOSE HALF OF ONE PERCENT PER WEEK IN PLACE OF ONE PERCENT PER DAY',
            next: 'rate_in'
          },
          rate_in: {
            kind: 'beat', at: 'law', show: 'telegram',
            from: '{contractor}',
            text: 'WEEKLY AGREED STOP ONE PERCENT PER WEEK STOP THAT IS FINAL ON THE RATE STOP {pike}',
            foot: '"Take it. {dayRate} a week instead of {dayRate} a day. The rate matters less than the next three questions."',
            next: 'pick'
          },
          pick: {
            kind: 'pick', count: 2, at: 'law',
            prompt: '{pike} will move on two more points. Not three. It is your deal: which two?',
            who: 'vance',
            hint: 'Your margin is {margin}. Keep that number in your head while you choose.',
            options: [
              { id: 'cap', label: 'A ceiling', set: { cap: true },
                text: 'Delay damages can never total more than 5% of the order value: {ceiling}.' },
              { id: 'sole', label: 'The only remedy', set: { sole: true },
                text: 'Delay damages are all they can claim for lateness. Nothing on top.' },
              { id: 'grace', label: 'A grace period', set: { grace: true },
                text: 'The first two weeks late cost nothing.' }
            ],
            next: 'agreed'
          },
          agreed: {
            kind: 'beat', at: 'law', show: 'page', face: 'up', stamp: 'AGREED',
            lead: '{pike} wires one word: AGREED. Clause 11 now reads:',
            // Built from the picks, in the order the script gives.
            text: function (v) {
              return '11. DELAY. If the Supplier delivers late it shall pay the Contractor 1% of the Order value for each full week of delay' +
                (v.grace ? ', not counting the first two weeks.' : '.') +
                (v.cap ? ' Delay damages shall not exceed 5% of the Order value in total.' : '') +
                (v.sole ? ' Delay damages are the Contractor\'s only remedy for late delivery.' : ' This does not limit any other right of the Contractor.');
            },
            next: 'flow'
          },
          flow: {
            kind: 'choice', at: 'supply',
            prompt: 'The cable comes from {mill}. Their lead time is 12 weeks. What date do you promise {contractorShort}?',
            options: [
              { id: 'quote12', label: 'Promise 12 weeks and place the order with the mill.',
                note: '{mill} have never let you down.',
                set: { buffer: 0, asked: false }, next: 'po' },
              { id: 'ask', label: 'First ask the mill to carry the same delay clause.',
                note: 'If you carry it, so should they.',
                set: { asked: true }, next: 'mill_no' }
            ]
          },
          mill_no: {
            kind: 'beat', at: 'supply', show: 'telegram',
            from: '{mill}',
            text: 'WE DO NOT ACCEPT DELAY DAMAGES FROM ANY CUSTOMER STOP LEAD TIME 12 WEEKS ESTIMATED STOP BEST ENDEAVOURS ONLY STOP',
            foot: 'So the gap is yours. You owe {contractorShort} for lateness, and the mill owes you nothing.',
            next: 'cF2'
          },
          cF2: {
            kind: 'choice', at: 'supply',
            prompt: 'The mill will not carry the risk. What date do you promise?',
            options: [
              { id: 'quote12', label: '12 weeks. The mill\'s date is your date.',
                note: 'A shorter date wins orders.',
                set: { buffer: 0 }, next: 'po' },
              { id: 'quote14', label: '14 weeks. Two weeks of slack of your own.',
                note: 'A longer date might lose this one.',
                set: { buffer: 2 }, next: 'fourteen' }
            ]
          },
          fourteen: {
            kind: 'beat', at: 'supply', show: 'telegram',
            from: '{contractor}',
            text: 'FOURTEEN WEEKS STOP NOT A DAY MORE STOP THE PROGRAMME HAS NO SLACK AFTER THAT STOP {pike}',
            next: 'po'
          },
          po: {
            kind: 'beat', at: 'supply', show: 'page', face: 'up', week: 0,
            title: 'PURCHASE ORDER {poNumber}',
            text: function (v) {
              return [
                '400 drums of cable. Delivery at the railhead: week {poWeek}.',
                'Clause 4. Production must not start until the Consulting Engineer has approved the samples.',
                v.terms === 'draft' ? 'Clause 11. Delay: as printed.' : 'Clause 11. Delay: as agreed.',
                'Clause 19. This order may be changed only by a written amendment signed by the Purchasing Agent.'
              ];
            },
            next: 'samples'
          },
          samples: {
            kind: 'beat', at: 'supply', show: 'note', week: 1,
            text: 'Week 1. The samples go east to the Consulting Engineer. The programme allows him until week 3. The mill waits for his answer.',
            next: 'silence'
          },
          silence: {
            kind: 'beat', at: 'supply', show: 'telegram', week: 6, mood: 'dusk',
            from: '{mill}',
            text: 'WEEK SIX STOP STILL NO APPROVAL STOP WE CANNOT START THE RUN WITHOUT IT STOP EVERY WEEK WE WAIT IS A WEEK ON YOUR DATE STOP',
            next: 'cD'
          },
          cD: {
            kind: 'choice', at: 'supply', week: 6,
            prompt: 'The Engineer is silent and your date is slipping. What do you do?',
            options: [
              { id: 'verbal', label: 'Go out to the site and tell the Project Manager the date will move.',
                note: 'A word with the man who runs the job.',
                set: { route: 'verbal', paperwork: 'none' }, next: 'd_verbal' },
              { id: 'wire', label: 'Wire the Project Manager and keep his reply.',
                note: 'Something in writing.',
                set: { route: 'wire', paperwork: 'argued' }, next: 'd_wire_out' },
              { id: 'formal', label: 'Take him a written delay notice and ask for the order date to be amended.',
                note: 'By the book. Slower.',
                next: 'd_formal' },
              { id: 'risk', label: 'Tell the mill to start the run now, without approval.',
                note: 'Protect the date.',
                set: { route: 'risk', riskStart: true }, next: 'd_risk' }
            ]
          },
          d_verbal: {
            kind: 'beat', at: 'yard', show: 'say', who: 'dade',
            text: 'Yeah, that\'s fine. Everybody is waiting on the Engineer. Don\'t worry about the date.',
            next: 'approval'
          },
          d_wire_out: {
            kind: 'beat', at: 'supply', show: 'telegram',
            to: '{dade}, {contractor}',
            text: 'SAMPLES STILL WITH THE ENGINEER STOP OUR DELIVERY DATE WILL MOVE WEEK FOR WEEK STOP PLEASE CONFIRM',
            next: 'd_wire_in'
          },
          d_wire_in: {
            kind: 'beat', at: 'supply', show: 'telegram',
            from: '{contractor}',
            text: 'UNDERSTOOD STOP FINE BY ME STOP {dade}',
            foot: 'You file his reply.',
            next: 'approval'
          },
          d_formal: {
            kind: 'beat', at: 'yard', show: 'say', who: 'dade', mood: 'storm',
            lead: 'You put the notice on his desk.',
            text: 'I don\'t have time for paperwork. I have told you it\'s fine. Just get on with it.',
            next: 'cD3'
          },
          cD3: {
            kind: 'choice', at: 'yard',
            prompt: 'He will not touch the paperwork. What do you do?',
            options: [
              { id: 'takeword', label: 'Take his word. He runs the job.',
                note: 'You did serve the notice.',
                set: { route: 'tookword', paperwork: 'argued' }, next: 'approval' },
              { id: 'standfirm', label: 'Stay put: no signature, no new date.',
                note: 'He has to sign something.',
                set: { route: 'stoodfirm', paperwork: 'argued' }, next: 'd_standfirm' },
              { id: 'law', label: 'Go and ask {lawyer}.',
                note: 'There may be a quicker way to the same signature.',
                set: { route: 'amended', paperwork: 'amended' }, next: 'd_law' }
            ]
          },
          d_standfirm: {
            kind: 'beat', at: 'yard', show: 'say', who: 'dade',
            text: 'Then we have a problem. I can\'t sign that. I build railroads. I don\'t change purchase orders. Leave it on the desk.',
            foot: 'A month later your notice is still on his desk.',
            next: 'approval'
          },
          d_law: {
            kind: 'beat', at: 'law', show: 'say', who: 'vance',
            text: '{dade} can say "fine" all day. Read clause 19: only the Purchasing Agent can change the order. So make it easy for the Purchasing Agent. One page. One change: the delivery date moves by every day the Engineer is late. Nothing else. Send it to {pike} with the receipt for your samples.',
            next: 'd_amended'
          },
          d_amended: {
            kind: 'beat', at: 'law', show: 'telegram', stamp: 'AMENDED', mood: 'day',
            from: '{contractor}',
            text: 'AMENDMENT ONE TO PO {poNumber} SIGNED STOP DELIVERY DATE MOVES DAY FOR DAY WITH THE ENGINEERS APPROVAL STOP {pike}',
            next: 'approval'
          },
          d_risk: {
            kind: 'beat', at: 'supply', show: 'note', week: 6,
            text: 'You wire the mill: start the run. The machines turn. Clause 4 says they should not.',
            next: 'risk_comments'
          },
          risk_comments: {
            kind: 'beat', at: 'supply', show: 'telegram', week: 11,
            from: '{engineer}',
            text: 'SAMPLES APPROVED WITH ONE CHANGE STOP MARKING ON THE SHEATH EVERY YARD NOT EVERY TEN STOP {engineerShort}',
            foot: 'A third of the run is already made the old way. It is scrap. Making it again costs {remakeCost} and two of the weeks you thought you had saved.',
            next: 'mill_slip'
          },
          approval: {
            kind: 'beat', at: 'supply', show: 'telegram', week: 11,
            from: '{engineer}',
            text: 'SAMPLES APPROVED STOP PROCEED STOP {engineerShort}',
            foot: 'Eight weeks late. The mill starts the run.',
            next: 'mill_slip'
          },
          mill_slip: {
            kind: 'beat', at: 'supply', show: 'telegram', week: 17,
            from: '{mill}',
            text: 'COPPER DELIVERY LATE STOP THREE WEEKS LOST STOP REGRET STOP',
            foot: function (v) {
              if (v.buffer === 2) return 'Your two weeks of slack swallow two of them.';
              if (v.asked) return 'You knew the mill would not stand behind its date, and you promised it anyway. All three weeks are yours.';
              return 'You promised the mill\'s date as your own. All three weeks are yours.';
            },
            next: 'delivered'
          },
          delivered: {
            kind: 'beat', at: 'depot', show: 'note', week: '{deliveredWeek}', mood: 'day', event: 'trainIn',
            text: 'Week {deliveredWeek}. Four hundred drums of cable on the platform. The order said week {poWeek}.',
            next: 'claim'
          },
          claim: {
            kind: 'beat', at: 'supply', show: 'page', face: 'up',
            title: '{contractor}. COMMERCIAL OFFICE.',
            text: function (v) {
              if (v.paperwork === 'amended') return 'Delivery date under Amendment 1: week {dueWeek}. Delivered: week {deliveredWeek}. Any delay damages due under clause 11 will be deducted from your invoice.';
              if (v.riskStart) return 'Delivery date under Purchase Order {poNumber}: week {poWeek}. Delivered: week {deliveredWeek}. Production began before approval, contrary to clause 4. Delay damages under clause 11 will be deducted from your invoice.';
              return 'Delivery date under Purchase Order {poNumber}: week {poWeek}. Delivered: week {deliveredWeek}. Delay damages under clause 11 will be deducted from your invoice.';
            },
            next: function (v) {
              return ['verbal', 'wire', 'tookword', 'stoodfirm'].indexOf(v.route) >= 0 ? 'protest' : 'end_settled';
            }
          },
          protest: {
            kind: 'beat', at: 'supply', show: 'telegram', mood: 'storm',
            lead: 'You wire back: MR {dade} AGREED THE DATE WOULD MOVE.',
            from: '{contractor}',
            text: 'MR {dade} BUILDS RAILROADS STOP HE DOES NOT AMEND PURCHASE ORDERS STOP CLAUSE 19 STOP THE ORDER DATE GOVERNS STOP COMMERCIAL OFFICE',
            foot: function (v) {
              return {
                verbal: 'You have nothing in writing. {dade} has moved to another job and remembers nothing.',
                wire: 'You have his wire. It takes four months of argument. They concede half the Engineer\'s delay: four weeks.',
                tookword: 'You have your notice, and the date you served it. It takes four months of argument. They concede half the Engineer\'s delay: four weeks.',
                stoodfirm: 'You have your notice, still unsigned. It takes four months of argument. They concede half the Engineer\'s delay: four weeks.'
              }[v.route];
            },
            next: 'end_settled'
          },
          end_settled: {
            kind: 'ending', result: 'settled', at: 'supply', show: 'ledger',
            headline: function (v, k) {
              // The script's bands are for the script's numbers; a skin scales them too.
              const net = settle2(v, k).net / (k.scale || 1);
              if (net >= 180000) return 'DELIVERED. PAID. DONE.';
              if (net >= 100000) return 'LATE, AND STILL IN PROFIT';
              if (net >= 0) return 'A YEAR\'S WORK FOR SMALL CHANGE';
              if (net > -1000000) return 'THE CLAUSE ATE THE DEAL';
              return 'ONE PERCENT A DAY';
            }
          },
          end_lost: {
            kind: 'ending', result: 'lost', at: 'supply', show: 'note', mood: 'dusk',
            text: 'You walk away. {contractor} places the order with a rival, clause 11 and all.'
          }
        },

        derive: function (v, k) {
          return { dayRate: k.orderValue * k.ratePct / 100, ceiling: k.orderValue * k.capPct / 100 };
        },
        settle: settle2,
        // The script's wording table, "What each protection was worth": [saved, made no difference].
        whatIfs: function (v, k) {
          const words = {
            cap: {
              on: ['Your ceiling saved you {amount}.', 'Your ceiling made no difference this time.'],
              off: ['A ceiling would have saved you {amount}.', 'A ceiling would have made no difference this time.'] },
            sole: {
              on: ['"Only remedy" saved you {amount}.', '"Only remedy" made no difference this time.'],
              off: ['"Only remedy" would have saved you {amount}.', '"Only remedy" would have made no difference this time.'] },
            grace: {
              on: ['Your grace period saved you {amount}.', 'Your grace period made no difference this time.'],
              off: ['A grace period would have saved you {amount}.', 'A grace period would have made no difference this time.'] },
            buffer: {
              on: ['Your two weeks of slack saved you {amount}.', 'Your two weeks of slack made no difference this time.'],
              off: ['Two weeks of slack would have saved you {amount}.', 'Two weeks of slack would have made no difference this time.'] },
            amendment: {
              on: ['The signed amendment saved you {amount}.', 'The signed amendment made no difference this time.'],
              off: ['A signed amendment would have saved you {amount}.', 'A signed amendment would have made no difference this time.'] },
            wait: {
              off: ['Waiting for approval, with a signed amendment, would have saved you {amount}.',
                'Waiting for approval, with a signed amendment, would have made no difference this time.'] },
            negotiate: {
              off: ['Negotiating the clause (weekly, with a ceiling and "only remedy") would have saved you {amount}.',
                'Negotiating the clause (weekly, with a ceiling and "only remedy") would have made no difference this time.'] }
          };
          if (!v.terms) return [];
          const bill = settle2(v, k).bill;
          const out = [];
          const add = function (id, state, alt) {
            const other = settle2(Object.assign({}, v, alt), k).bill;
            const amount = state === 'on' ? other - bill : bill - other;
            out.push({ id: id, state: state, amount: amount, text: words[id][state][amount === 0 ? 1 : 0] });
          };
          if (v.terms === 'negotiated') {
            add('cap', v.cap ? 'on' : 'off', { cap: !v.cap });
            add('sole', v.sole ? 'on' : 'off', { sole: !v.sole });
            add('grace', v.grace ? 'on' : 'off', { grace: !v.grace });
          } else {
            add('negotiate', 'off', { terms: 'negotiated', cap: true, sole: true, grace: false });
          }
          add('buffer', v.buffer ? 'on' : 'off', { buffer: v.buffer ? 0 : k.bufferWeeks });
          if (v.riskStart) add('wait', 'off', { riskStart: false, paperwork: 'amended' });
          else if (v.paperwork === 'amended') add('amendment', 'on', { paperwork: 'none' });
          else add('amendment', 'off', { paperwork: 'amended' });
          return out;
        },
        whatIfNote: 'Each line takes one protection on its own. They overlap, so the lines do not add up.',

        lessons: [
          { text: 'You rarely get delay damages struck out. You can nearly always shape them: weekly not daily, a low rate, a ceiling, "only remedy", a grace period.',
            when: function (v) { return v.terms === 'draft'; } },
          { text: 'A ceiling below your margin, with delay damages as the only remedy, means lateness can cost you profit but cannot turn the deal into a loss.',
            when: function (v) { return v.terms === 'negotiated' && !(v.cap && v.sole); } },
          { text: 'A ceiling on its own is not enough. If delay damages are not the only remedy, the customer can claim its other losses on top.',
            when: function (v) { return v.cap && !v.sole; } },
          { text: 'If your vendor will not carry the clause, the gap is yours. Buy time: promise a later date than your vendor promises you.',
            when: function (v) { return v.buffer === 0; } },
          { text: '"That\'s fine" does not move the date in the order. A signed change from the person the contract names does.',
            when: function (v) { return v.paperwork !== 'amended' && !v.riskStart; } },
          { text: 'Keep the record as you go: what you sent, when you sent it, when the answer came. You will need it to show that their delay caused yours.',
            when: function (v) { return v.paperwork === 'argued'; } },
          { text: 'Do not start work the contract says needs approval. You turn their delay into your cost.',
            when: function (v) { return v.riskStart; } }
        ],
        reallife: 'A customer\'s contract with a delay clause goes to your legal team before you quote. During the job, tell them as soon as the customer\'s own delay starts to move your date.'
      }
    ]
  });
})();
