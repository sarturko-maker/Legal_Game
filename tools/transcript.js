#!/usr/bin/env node
/*
 * Prints a play-through as text, for proof-reading against the script.
 *
 * Run: node tools/transcript.js s1 pack law law
 * A pick is written with commas: node tools/transcript.js s2 law cap,sole ask quote14 formal law
 */
'use strict';
const B2B = require('./load')();

function main(argv) {
  const [id, ...steps] = argv;
  const scenario = B2B.packs.scenarios().find((sc) => sc.id === id);
  if (!scenario) {
    console.error('No scenario "' + id + '". Known: ' + B2B.packs.scenarios().map((sc) => sc.id).join(', '));
    process.exitCode = 1;
    return;
  }
  const house = B2B.packs.house();
  const cast = B2B.packs.cast();
  const money = (n) => (n > 0 ? '+' : '') + B2B.packs.number(n, house.currency);
  const out = [];
  const say = (line) => out.push(line == null ? '' : line);

  say('== ' + scenario.id + ': ' + scenario.title + ' ==');
  say('path: ' + steps.join(' '));
  let state = B2B.engine.start(scenario, house);
  let used = 0;
  for (;;) {
    const v = B2B.engine.view(state);
    say();
    say('[' + state.nodeId + '] ' + [v.kind, v.at, v.show, v.mood, v.week == null ? null : 'week ' + v.week,
      v.face && 'face ' + v.face, v.event].filter(Boolean).join(' · '));
    if (v.lead) say('  (' + v.lead + ')');
    if (v.who) say('  ' + (cast[v.who] ? cast[v.who].name : v.who) + ':');
    if (v.from) say('  From: ' + v.from);
    if (v.to) say('  To: ' + v.to);
    if (v.title) say('  ' + v.title);
    if (v.small) say('  (small print) ' + v.small);
    if (v.headline) say('  ' + v.headline);
    if (v.stamp) say('  [stamp: ' + v.stamp + ']');
    // The telegram prop shows its text in capitals (PACK-FORMAT 4).
    v.text.forEach((p) => say('  ' + (v.show === 'telegram' ? p.toUpperCase() : p)));
    if (v.foot) say('  (' + v.foot + ')');
    if (v.prompt) say('  ' + v.prompt);
    if (v.hint) say('  ' + v.hint);
    v.options.forEach((o) => say('    ' + o.id + ': ' + o.label + (o.note ? '  (' + o.note + ')' : '') + (o.text ? '  ' + o.text : '')));

    if (state.done) break;
    if (v.kind === 'beat') {
      state = B2B.engine.advance(state);
      continue;
    }
    if (used >= steps.length) {
      say();
      say('(The path stops here, at a ' + v.kind + '.)');
      console.log(out.join('\n'));
      return;
    }
    const step = steps[used];
    used += 1;
    if (v.kind === 'choice') {
      state = B2B.engine.choose(state, step);
      say('  > ' + step);
    } else {
      state = B2B.engine.pick(state, step.split(','));
      say('  > ' + step);
    }
  }

  const r = B2B.engine.result(state);
  say();
  say('-- Ledger --');
  r.tally.forEach((row) => say('  ' + row.label + ': ' + (typeof row.value === 'number' ? B2B.packs.number(row.value) : row.value)));
  r.lines.forEach((line) => say('  ' + line.label + '  ' + money(line.amount) + (line.detail ? '  (' + line.detail + ')' : '')));
  say('  Result  ' + money(r.net));
  if (r.note) say('  ' + r.note);
  say();
  say('-- What it was worth --');
  r.whatIfs.forEach((w) => say('  ' + w.text));
  if (!r.whatIfs.length) say('  (nothing shown)');
  if (r.whatIfNote) say('  (small print) ' + r.whatIfNote);
  say();
  say('-- Lessons --');
  r.lessons.forEach((l, i) => {
    say('  ' + (i + 1) + '. ' + l.text + (l.bit ? '  [bit you]' : ''));
    if (l.small) say('     ' + l.small);
  });
  say();
  say('-- In real life --');
  say('  ' + r.reallife);
  if (used < steps.length) say('\n(' + (steps.length - used) + ' steps left over.)');
  console.log(out.join('\n'));
}

main(process.argv.slice(2));
