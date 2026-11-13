// The public pack: general principles only, invented names only (SPEC C8).
// Scenario wording is copied exactly from docs/scenarios/. Change the script first.
(function () {
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
      vance: { name: 'Ms Vance', title: 'Attorney', look: 'lawyer' }
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
          poNumber: '4471'
        },
        k: { orderValue: 6000, margin: 1500, claim: 20000000, cap: 50000, followOn: 75000 },
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
            headline: 'NORTHERN BRIDGE CLOSED. BOLTS BLAMED.',
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

        // What the cap saves, for the what-if lines.
        derive: function (v, k) {
          return { capSaving: k.claim - k.cap };
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
              text: 'One line capping your liability at {cap} would have saved {capSaving}.' }];
          }
          if (v.how === 'capped') {
            return [{ id: 'cap', state: 'on', amount: k.claim - k.cap,
              text: 'The one-line cap saved you {capSaving}.' }];
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
      }
    ]
  });
})();
