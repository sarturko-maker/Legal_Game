// The template for a private pack (PACK-FORMAT 7). Everything here is invented.
//
// To use it: copy this file to packs/private.js on your own machine, change it, then run
//   node tools/check.js --pack packs/private.js
// packs/private.js is never committed: .gitignore lists it, and the check fails if git
// tracks it. The game loads it after the public pack; without it the game runs as usual.
//
// What this example does, one line each, in the order of the table in PACK-FORMAT 7:
// the "In real life" box of s1, the firm and the currency, a new scenario (p1), a
// replacement for s1, and s2 hidden. It also adds a wildcard to p1 (PACK-FORMAT 8).
(function () {
  const B2B = globalThis.B2B;

  B2B.registerPack({
    id: 'example',
    title: 'Example private pack',
    version: 1,

    house: {
      firm: 'Example Trading Co.',
      currency: '$',
      reallife: { s1: 'Example: before you ship on a telegram, send your own terms back the same day.' }
    },

    hide: ['s2'],

    scenarios: [
      {
        // The same id as a public scenario, so it replaces it, whole.
        id: 's1',
        title: 'The usual price',
        blurb: 'An example scenario that replaces scenario 1.',
        tags: ['example', 'price'],
        minutes: 2,
        skin: { customer: 'Bramblewood Mercantile', buyer: 'Teague' },
        k: { orderValue: 4000, margin: 800, dispute: 1200 },
        vars: { how: null },
        start: 'order',
        nodes: {
          order: {
            kind: 'beat', at: 'telegraph', show: 'telegram', mood: 'day',
            from: '{customer}',
            text: 'ORDER FOR 40 LANTERNS STOP USUAL PRICE STOP SHIP FRIDAY STOP {buyer}',
            next: 'ask'
          },
          ask: {
            kind: 'choice', at: 'supply',
            prompt: 'Ship on the telegram, or send your terms first?',
            options: [
              { id: 'ship', label: 'Ship on Friday.', set: { how: 'shipped' }, next: 'end_dispute' },
              { id: 'terms', label: 'Send your terms and price first.', set: { how: 'terms' }, next: 'end_paid' }
            ]
          },
          end_dispute: {
            kind: 'ending', result: 'claim', at: 'supply', show: 'note',
            text: '{customer} says the usual price was last year\'s. You settle for {dispute} less.'
          },
          end_paid: {
            kind: 'ending', result: 'deal', at: 'supply', show: 'note',
            text: 'Your terms went back the same day. Paid in full.'
          }
        },
        settle: function (v, k) {
          const lines = [{ id: 'margin', label: 'Margin on the order', amount: k.margin }];
          if (v.how === 'shipped') lines.push({ id: 'dispute', label: 'The price dispute', amount: -k.dispute });
          return { lines: lines, net: lines.reduce(function (sum, l) { return sum + l.amount; }, 0) };
        },
        lessons: [
          { text: 'A price nobody wrote down is a price you will argue about.', when: function (v) { return v.how === 'shipped'; } }
        ]
        // No reallife here: the house block above supplies the s1 box.
      },
      {
        // A new id, so it is added to the list.
        id: 'p1',
        title: 'The early frost',
        blurb: 'An example scenario added by a private pack, with a wildcard.',
        tags: ['example', 'delivery date'],
        minutes: 2,
        skin: { customer: 'Thistlecombe Feed Co.' },
        k: { orderValue: 3000, margin: 600, penalty: 900 },
        vars: { how: null },
        start: 'standing',
        nodes: {
          standing: {
            kind: 'beat', at: 'supply', show: 'note', mood: 'dawn',
            // A wildcard drawn for this slot is shown as a front page before this note.
            wild: 'frost',
            text: 'A standing order from {customer}: seed, every spring, over the pass.',
            next: 'promise'
          },
          promise: {
            kind: 'choice', at: 'supply',
            prompt: 'Do you promise a delivery date?',
            options: [
              { id: 'date', label: 'Promise the first of the month.', set: { how: 'promised' }, next: 'end_late' },
              { id: 'open', label: 'Promise it when the pass is open.', set: { how: 'open' }, next: 'end_fine' }
            ]
          },
          end_late: {
            kind: 'ending', result: 'claim', at: 'supply', show: 'note', mood: 'storm',
            text: 'The pass froze. You were late, and the order says when. {penalty} off the invoice.'
          },
          end_fine: {
            kind: 'ending', result: 'deal', at: 'supply', show: 'note', mood: 'storm',
            text: 'The pass froze. Nobody minded: you never promised a date.'
          }
        },
        settle: function (v, k) {
          const lines = [{ id: 'margin', label: 'Margin on the order', amount: k.margin }];
          if (v.how === 'promised') lines.push({ id: 'penalty', label: 'Late delivery', amount: -k.penalty });
          return { lines: lines, net: lines.reduce(function (sum, l) { return sum + l.amount; }, 0) };
        },
        lessons: [
          { text: 'Promise a date only when you control the road to it.', when: function (v) { return v.how === 'promised'; } }
        ],
        reallife: 'Example: check the delivery terms before you promise a date.'
      }
    ],

    // A wildcard changes one number (k) or one branch (next) at the node that names its slot.
    wildcards: [
      {
        id: 'thaw', scenario: 'p1', slot: 'frost',
        headline: 'EARLY THAW ON THE PASS',
        text: 'The pass opens a fortnight early this year. Late penalties will run at half.',
        k: { penalty: 450 }
      }
    ]
  });
})();
