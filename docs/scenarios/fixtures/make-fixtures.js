#!/usr/bin/env node
/*
 * Reference model for the two v1 scenarios.
 *
 * This is a second, independent implementation of the scenario logic. It exists
 * only to produce the expected results that the game's engine and public pack
 * are tested against. It is not part of the game and is never loaded by it.
 *
 * Run:   node docs/scenarios/fixtures/make-fixtures.js
 * Writes s1-paths.json and s2-paths.json next to this file, and prints the
 * tables used in the scenario scripts.
 *
 * If the human changes a number in a scenario script, change it here too,
 * re-run, and commit the regenerated fixtures with the pack change.
 */
'use strict';
const fs = require('fs');
const path = require('path');

/* ------------------------------------------------------------------ */
/* Scenario 1: The new entity                                          */
/* ------------------------------------------------------------------ */

const K1 = {
  orderValue: 6000,
  margin: 1500,
  claim: 20000000,
  cap: 50000,
  followOn: 75000,
};

function s1Result(ending, k) {
  if (ending === 'lawsuit') {
    return {
      lines: [{ id: 'margin', amount: k.margin }, { id: 'claim', amount: -k.claim }],
      net: k.margin - k.claim,
    };
  }
  if (ending === 'lost') {
    return { lines: [], net: 0 };
  }
  if (ending === 'deal') {
    return {
      lines: [
        { id: 'margin', amount: k.margin },
        { id: 'followOn', amount: k.followOn },
        { id: 'cappedClaim', amount: -k.cap },
      ],
      net: k.margin + k.followOn - k.cap,
    };
  }
  throw new Error('unknown ending ' + ending);
}

/* What the one-line cap was worth. Same convention as scenario 2:
 * state 'on' = the player had it (amount saved); 'off' = did not (amount it would have saved). */
function s1WhatIfs(ending, k) {
  if (ending === 'lawsuit') return [{ id: 'cap', state: 'off', amount: k.claim - k.cap }];
  if (ending === 'deal') return [{ id: 'cap', state: 'on', amount: k.claim - k.cap }];
  return [];
}

const S1_ROUTES = [
  { path: ['clone'], ending: 'lawsuit', vars: { how: 'cloned' } },
  { path: ['pack', 'agree'], ending: 'lawsuit', vars: { how: 'agreed' } },
  { path: ['pack', 'law', 'cave'], ending: 'lawsuit', vars: { how: 'caved' } },
  { path: ['pack', 'law', 'standfirm'], ending: 'lost', vars: { how: 'stoodfirm' } },
  { path: ['pack', 'law', 'law'], ending: 'deal', vars: { how: 'capped' } },
];

/* ------------------------------------------------------------------ */
/* Scenario 2: The delay clause                                        */
/* ------------------------------------------------------------------ */

const K2 = {
  orderValue: 2000000,
  margin: 200000,
  ratePct: 1,            // % of order value: per DAY on the draft, per WEEK once negotiated
  capPct: 5,             // ceiling, % of order value
  graceWeeks: 2,
  leadWeeks: 12,         // the mill's quoted lead time
  bufferWeeks: 2,        // slack the player may add to the date promised
  millSlipWeeks: 3,      // the mill's own lateness
  approvalLateWeeks: 8,  // how late the Consulting Engineer's approval is
  arguedReliefWeeks: 4,  // weeks conceded after an argument, when there is a record but no amendment
  riskWeeks: 5,          // weeks lost when production starts without approval and part is remade
  remakeCost: 120000,
  extraClaim: 400000,    // the contractor's other losses, claimable when delay damages are not the only remedy
  extraFromWeeks: 4,     // ...and the delivery is at least this late
};

function s2Settle(v, k) {
  const unit = k.orderValue * k.ratePct / 100;
  const negotiated = v.terms === 'negotiated';
  const approvalWeeks = v.riskStart ? k.riskWeeks : k.approvalLateWeeks;
  const relief = v.riskStart
    ? 0
    : { none: 0, argued: k.arguedReliefWeeks, amended: k.approvalLateWeeks }[v.paperwork];
  const weeksLate = Math.max(0, approvalWeeks - relief + k.millSlipWeeks - v.buffer);

  const graceWeeks = negotiated && v.grace ? k.graceWeeks : 0;
  const chargeable = negotiated ? Math.max(0, weeksLate - graceWeeks) : weeksLate * 7;
  let damages = chargeable * unit;
  const ceiling = k.orderValue * k.capPct / 100;
  let capped = false;
  if (negotiated && v.cap && damages > ceiling) {
    damages = ceiling;
    capped = true;
  }

  const onlyRemedy = negotiated && v.sole;
  const extra = !onlyRemedy && weeksLate >= k.extraFromWeeks ? k.extraClaim : 0;
  const remake = v.riskStart ? k.remakeCost : 0;
  const bill = damages + extra + remake;

  const poWeek = k.leadWeeks + v.buffer;
  return {
    poWeek,                              // the week promised in the order
    dueWeek: poWeek + relief,            // the week the customer ends up holding you to
    deliveredWeek: k.leadWeeks + approvalWeeks + k.millSlipWeeks,
    reliefWeeks: relief,
    weeksLate,
    chargeable,
    chargeUnit: negotiated ? 'week' : 'day',
    damages,
    capped,
    extra,
    remake,
    bill,
    net: k.margin - bill,
  };
}

/* What each protection was worth on this path, taken on its own.
 * state 'on'  : the player had it; amount = what it saved.
 * state 'off' : the player did not have it; amount = what it would have saved. */
function s2WhatIfs(v, k) {
  const base = s2Settle(v, k).bill;
  const out = [];
  const add = (id, state, alt) => {
    const other = s2Settle(alt, k).bill;
    out.push({ id, state, amount: state === 'on' ? other - base : base - other });
  };
  if (v.terms === 'negotiated') {
    add('cap', v.cap ? 'on' : 'off', { ...v, cap: !v.cap });
    add('sole', v.sole ? 'on' : 'off', { ...v, sole: !v.sole });
    add('grace', v.grace ? 'on' : 'off', { ...v, grace: !v.grace });
  } else {
    add('negotiate', 'off', { ...v, terms: 'negotiated', cap: true, sole: true, grace: false });
  }
  add('buffer', v.buffer ? 'on' : 'off', { ...v, buffer: v.buffer ? 0 : k.bufferWeeks });
  if (v.riskStart) {
    add('wait', 'off', { ...v, riskStart: false, paperwork: 'amended' });
  } else if (v.paperwork === 'amended') {
    add('amendment', 'on', { ...v, paperwork: 'none' });
  } else {
    add('amendment', 'off', { ...v, paperwork: 'amended' });
  }
  return out;
}

const STARTS = [
  { path: ['sign'], terms: 'draft' },
  { path: ['refuse', 'sign'], terms: 'draft' },
  { path: ['law'], terms: 'negotiated' },
  { path: ['refuse', 'law'], terms: 'negotiated' },
];
const PAIRS = [['cap', 'sole'], ['cap', 'grace'], ['sole', 'grace']];
const FLOWS = [
  { path: ['quote12'], buffer: 0, asked: false },
  { path: ['ask', 'quote12'], buffer: 0, asked: true },
  { path: ['ask', 'quote14'], buffer: 2, asked: true },
];
const DELIVERIES = [
  { path: ['verbal'], route: 'verbal', paperwork: 'none', riskStart: false },
  { path: ['wire'], route: 'wire', paperwork: 'argued', riskStart: false },
  { path: ['formal', 'takeword'], route: 'tookword', paperwork: 'argued', riskStart: false },
  { path: ['formal', 'standfirm'], route: 'stoodfirm', paperwork: 'argued', riskStart: false },
  { path: ['formal', 'law'], route: 'amended', paperwork: 'amended', riskStart: false },
  { path: ['risk'], route: 'risk', paperwork: 'none', riskStart: true },
];

function s2Routes() {
  const routes = [{ path: ['refuse', 'walk'], ending: 'lost', vars: null }];
  for (const s of STARTS) {
    const termSets = s.terms === 'draft'
      ? [{ pick: null, cap: false, sole: false, grace: false }]
      : PAIRS.map((p) => ({ pick: p, cap: p.includes('cap'), sole: p.includes('sole'), grace: p.includes('grace') }));
    for (const t of termSets) {
      for (const f of FLOWS) {
        for (const d of DELIVERIES) {
          const p = [...s.path];
          if (t.pick) p.push(t.pick);
          p.push(...f.path, ...d.path);
          routes.push({
            path: p,
            ending: 'settled',
            vars: {
              terms: s.terms, cap: t.cap, sole: t.sole, grace: t.grace,
              asked: f.asked, buffer: f.buffer,
              route: d.route, paperwork: d.paperwork, riskStart: d.riskStart,
            },
          });
        }
      }
    }
  }
  return routes;
}

/* ------------------------------------------------------------------ */
/* Output                                                              */
/* ------------------------------------------------------------------ */

function build() {
  const s1 = {
    scenario: 's1',
    note: 'Generated by make-fixtures.js. Do not edit by hand. ending is the id of the ending node reached. Compare every key in expect; for lines compare id and amount, in order.',
    k: K1,
    paths: S1_ROUTES.map((r) => ({
      path: r.path,
      ending: 'end_' + r.ending,          // the id of the ending node reached
      vars: r.vars,
      expect: s1Result(r.ending, K1),
      whatIfs: s1WhatIfs(r.ending, K1),
    })),
  };
  const s2 = {
    scenario: 's2',
    note: 'Generated by make-fixtures.js. Do not edit by hand. ending is the id of the ending node reached. A path step that is an array is the pick-two choice. Compare every key in expect, and every whatIfs entry by id, state and amount.',
    k: K2,
    paths: s2Routes().map((r) => r.ending === 'lost'
      ? { path: r.path, ending: 'end_lost', vars: null, expect: { net: 0 }, whatIfs: [] }
      : { path: r.path, ending: 'end_settled', vars: r.vars, expect: s2Settle(r.vars, K2), whatIfs: s2WhatIfs(r.vars, K2) }),
  };
  return { s1, s2 };
}

/* Header pretty-printed, then one path per line: small on disk and easy to diff. */
function serialise(f) {
  const head = JSON.stringify({ scenario: f.scenario, note: f.note, k: f.k }, null, 2).replace(/\n}$/, ',');
  const rows = f.paths.map((p) => '    ' + JSON.stringify(p)).join(',\n');
  return head + '\n  "paths": [\n' + rows + '\n  ]\n}\n';
}

function fmt(n) {
  const s = Math.abs(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return n < 0 ? '-' + s : s;
}

function printTables(s1, s2) {
  console.log('SCENARIO 1\n');
  console.log('| Path | Ending | Net |');
  console.log('|---|---|---|');
  for (const p of s1.paths) console.log(`| ${p.path.join(' > ')} | ${p.ending} | ${fmt(p.expect.net)} |`);

  console.log('\nSCENARIO 2: the 32 distinct outcomes\n');
  console.log('| Clause | Slack | Delivery | Weeks late | Delay damages | Other claims | Remake | Bill | Net |');
  console.log('|---|---|---|---|---|---|---|---|---|');
  const seen = new Set();
  const label = (v) => v.terms === 'draft' ? 'draft, signed as sent'
    : [v.cap && 'ceiling', v.sole && 'only remedy', v.grace && 'grace'].filter(Boolean).join(' + ');
  const dlabel = (v) => v.riskStart ? 'started without approval'
    : { none: 'verbal only', argued: 'record, no amendment', amended: 'signed amendment' }[v.paperwork];
  for (const p of s2.paths) {
    if (!p.vars) continue;
    const v = p.vars;
    const key = [v.terms, v.cap, v.sole, v.grace, v.buffer, v.paperwork, v.riskStart].join('|');
    if (seen.has(key)) continue;
    seen.add(key);
    const e = p.expect;
    console.log(`| ${label(v)} | ${v.buffer} | ${dlabel(v)} | ${e.weeksLate} | ${fmt(e.damages)}${e.capped ? ' (ceiling)' : ''} | ${fmt(e.extra)} | ${fmt(e.remake)} | ${fmt(e.bill)} | ${fmt(e.net)} |`);
  }
  console.log(`\nDistinct outcomes: ${seen.size}. Complete paths: ${s2.paths.length} (one of them ends with the order lost).`);
}

function main() {
  const { s1, s2 } = build();
  fs.writeFileSync(path.join(__dirname, 's1-paths.json'), serialise(s1));
  fs.writeFileSync(path.join(__dirname, 's2-paths.json'), serialise(s2));
  printTables(s1, s2);
}

if (require.main === module) main();
module.exports = { K1, K2, s1Result, s1WhatIfs, s2Settle, s2WhatIfs, build };
