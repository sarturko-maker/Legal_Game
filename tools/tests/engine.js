// Engine and pack tests (SPEC 12.1, item 4). Each export is a test; a test fails by throwing.
'use strict';
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const B2B = require('../load')();

const FIXTURES = path.join(__dirname, '..', '..', 'docs', 'scenarios', 'fixtures');

// Every fixture path whose scenario is in a pack, as [scenario, path].
function fixturePaths() {
  const out = [];
  for (const file of fs.readdirSync(FIXTURES).filter((f) => f.endsWith('-paths.json'))) {
    const fx = JSON.parse(fs.readFileSync(path.join(FIXTURES, file), 'utf8'));
    const scenario = B2B.packs.scenarios().find((sc) => sc.id === fx.scenario);
    if (scenario) fx.paths.forEach((p) => out.push([scenario, p.path]));
  }
  return out;
}

// Steps through a path, calling fn(state) at every node, ending included.
function walk(scenario, steps, fn) {
  let state = B2B.engine.start(scenario, B2B.packs.house());
  let used = 0;
  for (;;) {
    fn(state);
    if (state.done) return state;
    const kind = scenario.nodes[state.nodeId].kind;
    if (kind === 'beat') state = B2B.engine.advance(state);
    else if (kind === 'choice') state = B2B.engine.choose(state, steps[used++]);
    else state = B2B.engine.pick(state, steps[used++]);
  }
}

const s1 = () => B2B.packs.scenarios().find((sc) => sc.id === 's1');

function throwsNaming(fn, words) {
  assert.throws(fn, (err) => words.every((w) => err.message.includes(w)) || assert.fail('message was: ' + err.message));
}

// A tiny scenario for testing the checker itself. Its id is not one a pack uses.
function tinyScenario(changes) {
  const sc = {
    id: 'tiny', title: 'Tiny', k: { amount: 10 }, vars: { picked: null }, skin: { name: 'Ash' }, start: 'a',
    nodes: {
      a: { kind: 'beat', at: 'supply', show: 'say', text: 'Hello {name}.', next: 'b' },
      b: { kind: 'choice', at: 'supply', prompt: 'Which?', options: [
        { id: 'x', label: 'X', set: { picked: 'x' }, next: 'end' },
        { id: 'y', label: 'Y', set: { picked: 'y' }, next: 'end' }
      ] },
      end: { kind: 'ending', result: 'deal', at: 'supply', show: 'note', text: 'Done.' }
    },
    settle: (v, k) => ({ lines: [{ id: 'one', label: 'One', amount: k.amount }], net: k.amount })
  };
  return Object.assign(sc, changes(sc) || {});
}

function problemsOf(sc) {
  return B2B.packs.validate({ id: 'test', scenarios: [sc] }, { currency: '' }, {}).join('\n');
}

module.exports = {
  'the public pack has no validation problems'() {
    assert.deepStrictEqual(B2B.packs.problems(), []);
  },

  'no call changes the state it was given'() {
    for (const [scenario, steps] of fixturePaths()) {
      walk(scenario, steps, (state) => {
        assert.ok(Object.isFrozen(state) && Object.isFrozen(state.vars) && Object.isFrozen(state.path), 'state is not frozen');
        const before = JSON.stringify(state);
        B2B.engine.view(state);
        if (state.done) B2B.engine.result(state);
        assert.strictEqual(JSON.stringify(state), before);
      });
    }
  },

  'view leaves no placeholder unresolved on any node of any fixture path'() {
    for (const [scenario, steps] of fixturePaths()) {
      const end = walk(scenario, steps, (state) => {
        const text = JSON.stringify(B2B.engine.view(state));
        assert.ok(!/\{\w+\}/.test(text), scenario.id + ' ' + state.nodeId + ': ' + text);
        assert.ok(Array.isArray(B2B.engine.view(state).text), 'text is not an array');
      });
      assert.ok(!/\{\w+\}/.test(JSON.stringify(B2B.engine.result(end))), 'result has a placeholder');
    }
  },

  'wrong moves throw and name the scenario and the node'() {
    const start = B2B.engine.start(s1(), B2B.packs.house());
    throwsNaming(() => B2B.engine.choose(start, 'clone'), ['s1', 'po', 'choose']);
    throwsNaming(() => B2B.engine.result(start), ['s1', 'po', 'result']);
    const atChoice = B2B.engine.advance(B2B.engine.advance(B2B.engine.advance(start)));
    assert.strictEqual(atChoice.nodeId, 'c1');
    throwsNaming(() => B2B.engine.advance(atChoice), ['s1', 'c1', 'advance']);
    throwsNaming(() => B2B.engine.choose(atChoice, 'nonsense'), ['s1', 'c1', 'nonsense']);
  },

  'replay refuses a path that runs out or runs over'() {
    throwsNaming(() => B2B.engine.replay(s1(), B2B.packs.house(), ['pack']), ['s1', 'c2', 'runs out']);
    throwsNaming(() => B2B.engine.replay(s1(), B2B.packs.house(), ['clone', 'law']), ['s1', 'end_lawsuit', 'left over']);
  },

  'a pick takes exactly count distinct known options, and records them in option order'() {
    const s2 = B2B.packs.scenarios().find((sc) => sc.id === 's2');
    let state = B2B.engine.start(s2, B2B.packs.house());
    while (state.nodeId !== 'pick') {
      const kind = s2.nodes[state.nodeId].kind;
      state = kind === 'beat' ? B2B.engine.advance(state) : B2B.engine.choose(state, 'law');
    }
    throwsNaming(() => B2B.engine.pick(state, ['cap']), ['s2', 'pick', 'exactly 2']);
    throwsNaming(() => B2B.engine.pick(state, ['cap', 'cap']), ['s2', 'pick', 'twice']);
    throwsNaming(() => B2B.engine.pick(state, ['cap', 'moon']), ['s2', 'pick', 'moon']);
    throwsNaming(() => B2B.engine.choose(state, 'cap'), ['s2', 'pick', 'choose']);
    const after = B2B.engine.pick(state, ['sole', 'cap']);
    assert.deepStrictEqual(after.path[after.path.length - 1], ['cap', 'sole']);
    assert.strictEqual(after.vars.cap && after.vars.sole && !after.vars.grace, true);
  },

  'the week counter stays until changed, and can be a placeholder'() {
    const s2 = B2B.packs.scenarios().find((sc) => sc.id === 's2');
    const end = B2B.engine.replay(s2, B2B.packs.house(), ['sign', 'quote12', 'verbal']);
    assert.strictEqual(B2B.engine.view(end).week, 23);
    assert.strictEqual(B2B.engine.view(B2B.engine.start(s2, B2B.packs.house())).week, null);
  },

  'lessons that bit come first, and none bites on a lost deal'() {
    const s2 = B2B.packs.scenarios().find((sc) => sc.id === 's2');
    const worst = B2B.engine.result(B2B.engine.replay(s2, B2B.packs.house(), ['sign', 'quote12', 'verbal']));
    assert.deepStrictEqual(worst.lessons.map((l) => l.bit), [true, true, true, false]);
    assert.ok(worst.lessons[0].text.startsWith('You rarely get'));
    const lost = B2B.engine.result(B2B.engine.replay(s2, B2B.packs.house(), ['refuse', 'walk']));
    assert.ok(lost.lessons.every((l) => !l.bit) && lost.lessons.length === 4);
    assert.ok(lost.lessons[0].text.startsWith('You rarely get'));
  },

  'mood stays until a node changes it'() {
    const state = B2B.engine.replay(s1(), B2B.packs.house(), ['pack', 'law', 'cave']);
    assert.strictEqual(B2B.engine.view(state).mood, 'night');
    const atClerk = B2B.engine.advance(B2B.engine.start(s1(), B2B.packs.house()));
    assert.strictEqual(B2B.engine.view(atClerk).mood, 'day');
  },

  'numbers get thousands separators and the house currency'() {
    assert.strictEqual(B2B.packs.number(20000000), '20,000,000');
    assert.strictEqual(B2B.packs.number(-1500, '$'), '−$1,500');
    assert.strictEqual(B2B.packs.number(999), '999');
    assert.strictEqual(B2B.packs.number(0.5), '0.5');
    assert.strictEqual(B2B.packs.fill('{a} and {b}', [{ a: 1000 }, { a: 'no', b: 'two' }], '', 'here'), '1,000 and two');
  },

  'a name ending in a full stop absorbs the full stop after it'() {
    assert.strictEqual(B2B.packs.fill('{e}. No. {e}, yes.', [{ e: 'Ash Co.' }], '', 'here'), 'Ash Co. No. Ash Co., yes.');
  },

  'a placeholder that does not resolve throws'() {
    throwsNaming(() => B2B.packs.fill('{nobody}', [{}], '', 'here'), ['here', '{nobody}']);
  },

  'the checker passes a sound scenario'() {
    assert.strictEqual(problemsOf(tinyScenario(() => null)), '');
  },

  'the checker catches each kind of broken scenario'() {
    const cases = [
      [(sc) => { sc.nodes.a.next = 'nowhere'; }, 'nowhere'],
      [(sc) => { sc.start = 'missing'; }, 'start'],
      [(sc) => { sc.nodes.lonely = { kind: 'beat', at: 'supply', show: 'say', text: '.', next: 'end' }; }, 'never be reached'],
      [(sc) => { sc.nodes.a.text = 'Hello {stranger}.'; }, '{stranger}'],
      [(sc) => { sc.nodes.a.at = 'moon'; }, 'unknown at'],
      [(sc) => { sc.nodes.a.who = 'ghost'; }, 'unknown who'],
      [(sc) => { sc.nodes.a.set = { picked: 'x' }; }, 'may not have "set"'],
      [(sc) => { sc.nodes.b.options.pop(); }, '2 to 4 options'],
      [(sc) => { sc.nodes.b.options[0].label = 'L'.repeat(81); }, 'label is 81'],
      [(sc) => { sc.nodes.a.text = 'S'.repeat(401); }, 'say text is 401'],
      [(sc) => { sc.nodes.end.headline = 'H'.repeat(49); }, 'headline is 49'],
      [(sc) => { sc.settle = () => ({ lines: [{ id: 'one', label: 'One', amount: 1 }], net: 2 }); }, 'add up'],
      [(sc) => { sc.settle = () => ({ lines: [{ id: 'one', label: 'One', amount: NaN }], net: NaN }); }, 'finite'],
      [(sc) => { sc.nodes.a.next = () => 'a'; }, '80 steps'],
      [(sc) => { sc.nodes.end.event = 'trainOut'; }, 'may not have "event"']
    ];
    for (const [change, words] of cases) {
      const found = problemsOf(tinyScenario(change));
      assert.ok(found.includes(words), 'expected a problem mentioning "' + words + '", got: ' + (found || 'none'));
    }
  }
};
