// Variation tests (PLAN M6): the seed, skins and wildcards. Each export is a test.
'use strict';
const assert = require('assert');
const B2B = require('../load')();

const house = () => B2B.packs.house();

// Every path through a scenario, each ending's state passed to fn. view() is called at every
// node, so a placeholder that does not resolve throws.
function everyPath(sc, fn) {
  const combos = (ids, n) => (n === 0 ? [[]] : ids.flatMap((id, i) => combos(ids.slice(i + 1), n - 1).map((rest) => [id].concat(rest))));
  const visit = (state, steps) => {
    if (steps > 80) throw new Error(sc.id + ': path ' + state.path.join(' ') + ' never ends');
    B2B.engine.view(state);
    const node = sc.nodes[state.nodeId];
    if (state.done) return fn(state);
    if (node.kind === 'beat') return visit(B2B.engine.advance(state), steps + 1);
    if (node.kind === 'choice') return node.options.forEach((o) => visit(B2B.engine.choose(state, o.id), steps + 1));
    combos(node.options.map((o) => o.id), node.count).forEach((ids) => visit(B2B.engine.pick(state, ids), steps + 1));
  };
  visit(B2B.engine.start(sc, house()), 1);
}

// What a session would record for these paths, dressed from this seed.
function record(seed, wild) {
  const list = B2B.packs.vary(B2B.packs.scenarios(), seed, wild);
  const paths = { s1: ['pack', 'law', 'law'], s2: ['sign', 'quote12', 'verbal'] };
  return list.map((sc) => {
    const state = B2B.engine.replay(sc, house(), paths[sc.id]);
    return { id: sc.id, skin: sc.skin, path: state.path, net: B2B.engine.result(state).net };
  });
}

module.exports = {
  'the same seed twice gives the same record': () => {
    assert.deepStrictEqual(record(4471, true), record(4471, true));
    assert.deepStrictEqual(record(9, false), record(9, false));
  },

  'seeds give different deals': () => {
    const seen = new Set();
    for (let seed = 1; seed <= 20; seed += 1) seen.add(JSON.stringify(record(seed, true)));
    assert.ok(seen.size > 3, 'only ' + seen.size + ' different sessions from 20 seeds');
  },

  'a skin scales every amount together, so the result scales too': () => {
    const sc = B2B.packs.scenarios().find((s) => s.id === 's1');
    const net = (dressed) => B2B.engine.result(B2B.engine.replay(dressed, house(), ['pack', 'law', 'law'])).net;
    assert.strictEqual(net(B2B.packs.dress(sc, { set: 1 })), 2 * net(sc));
    assert.strictEqual(net(B2B.packs.dress(sc, { set: 2 })), 0.5 * net(sc));
  },

  'a scaled s2 deal keeps its headline': () => {
    const sc = B2B.packs.scenarios().find((s) => s.id === 's2');
    const headline = (dressed) => B2B.engine.view(B2B.engine.replay(dressed, house(), ['law', ['cap', 'sole'], 'ask', 'quote14', 'formal', 'law'])).headline;
    assert.strictEqual(headline(B2B.packs.dress(sc, { set: 1 })), headline(sc));
    assert.strictEqual(headline(B2B.packs.dress(sc, { set: 2 })), headline(sc));
  },

  // PLAN M6: for 200 seeds with wildcards on, every path of every scenario reaches an
  // ending, every placeholder resolves, and every net is the sum of its lines. Seeds that
  // dress a scenario the same way are played once.
  '200 seeds with wildcards on: every path ends, resolves and adds up': () => {
    const played = new Set();
    let endings = 0;
    for (let seed = 1; seed <= 200; seed += 1) {
      B2B.packs.vary(B2B.packs.scenarios(), seed, true).forEach((sc) => {
        const key = JSON.stringify([sc.id, sc.skin, sc.k, Object.keys(sc.nodes).map((id) => [sc.nodes[id].news, sc.nodes[id].next])]);
        if (played.has(key)) return;
        played.add(key);
        everyPath(sc, (state) => {
          const settled = sc.settle(state.vars, sc.k);
          const sum = settled.lines.reduce((a, l) => a + l.amount, 0);
          assert.ok(Math.abs(sum - settled.net) < 1e-6, sc.id + ' ' + state.path.join(' ') + ': net ' + settled.net + ', lines ' + sum);
          B2B.engine.result(state);
          endings += 1;
        });
      });
    }
    assert.ok(played.size >= 6 && endings > 0);
  },

  'a wildcard changes one number or one branch, and brings its front page': () => {
    const sc = {
      id: 'wildtest', title: 'Wild', k: { amount: 10 }, vars: {}, skin: {}, start: 'a',
      nodes: {
        a: { kind: 'beat', at: 'supply', show: 'note', text: 'Start.', wild: 'storm', next: 'b' },
        b: { kind: 'ending', result: 'deal', at: 'supply', show: 'note', text: 'Plain.' },
        c: { kind: 'ending', result: 'deal', at: 'supply', show: 'note', text: 'Other.' }
      },
      settle: (v, k) => ({ lines: [{ id: 'one', label: 'One', amount: k.amount }], net: k.amount })
    };
    const number = B2B.packs.dress(sc, { cards: [{ scenario: 'wildtest', slot: 'storm', headline: 'DUST', text: 'Worth {amount}.', k: { amount: 30 } }] });
    const start = B2B.engine.start(number, {});
    assert.deepStrictEqual(B2B.engine.view(start).news, { headline: 'DUST', text: ['Worth 30.'] });
    assert.strictEqual(B2B.engine.result(B2B.engine.advance(start)).net, 30);
    const branch = B2B.packs.dress(sc, { cards: [{ scenario: 'wildtest', slot: 'storm', headline: 'DUST', next: 'c' }] });
    assert.strictEqual(B2B.engine.advance(B2B.engine.start(branch, {})).nodeId, 'c');
    assert.strictEqual(B2B.engine.view(B2B.engine.start(sc, {})).news, null);
  }
};
