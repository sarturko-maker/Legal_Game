// The engine contract (SPEC 5.1). States are plain, frozen data. The engine knows nothing
// about any particular scenario: everything comes from the scenario object handed to start.
(function () {
  const B2B = globalThis.B2B;
  // start() remembers the scenario and house by id, because a state carries only the id.
  const started = {};
  const has = function (obj, key) { return Object.prototype.hasOwnProperty.call(obj, key); };

  function fail(state, problem) {
    throw new Error('Scenario ' + state.scenarioId + ', node ' + state.nodeId + ': ' + problem);
  }

  function load(state) {
    const run = started[state.scenarioId];
    if (!run) throw new Error('Scenario ' + state.scenarioId + ' has not been started.');
    if (!has(run.sc.nodes, state.nodeId)) fail(state, 'there is no such node.');
    return { sc: run.sc, house: run.house, node: run.sc.nodes[state.nodeId] };
  }

  function make(scenarioId, nodeId, vars, path, from) {
    const run = started[scenarioId];
    if (!has(run.sc.nodes, nodeId)) fail(from, 'next points at "' + nodeId + '", which is not a node.');
    return Object.freeze({
      scenarioId: scenarioId,
      nodeId: nodeId,
      vars: Object.freeze(vars),
      path: Object.freeze(path),
      done: run.sc.nodes[nodeId].kind === 'ending'
    });
  }

  // Everything a placeholder can draw on at this state, in PACK-FORMAT 4 order.
  function context(state) {
    const c = load(state);
    const v = state.vars;
    const k = c.sc.k || {};
    const d = c.sc.derive ? c.sc.derive(v, k) : {};
    const settled = c.sc.settle(v, k);
    const where = 'Scenario ' + c.sc.id + ', node ' + state.nodeId;
    const sources = [d, settled, v, k, c.sc.skin || {}, c.house];
    c.v = v;
    c.k = k;
    c.d = d;
    c.settled = settled;
    // extra, when given, is searched first: a what-if's own {amount}.
    c.fill = function (text, extra) {
      return B2B.packs.fill(text, extra ? [extra].concat(sources) : sources, c.house.currency, where);
    };
    c.paragraphs = function (value) {
      const out = typeof value === 'function' ? value(v, k, d) : value;
      if (out == null) return [];
      return (Array.isArray(out) ? out : [out]).map(function (p) { return c.fill(p); });
    };
    c.line = function (value) { return value == null ? null : c.paragraphs(value).join(' '); };
    return c;
  }

  function start(scenario, house, options) {
    started[scenario.id] = { sc: scenario, house: house || {}, options: options || {} };
    return make(scenario.id, scenario.start, Object.assign({}, scenario.vars), [], { scenarioId: scenario.id, nodeId: '(start)' });
  }

  function advance(state) {
    const c = load(state);
    if (c.node.kind !== 'beat') fail(state, 'advance is only for a beat, and this is a ' + c.node.kind + '.');
    const next = typeof c.node.next === 'function' ? c.node.next(state.vars, c.sc.k || {}) : c.node.next;
    return make(state.scenarioId, next, Object.assign({}, state.vars), state.path.slice(), state);
  }

  function choose(state, optionId) {
    const c = load(state);
    if (c.node.kind !== 'choice') fail(state, 'choose is only for a choice, and this is a ' + c.node.kind + '.');
    const option = c.node.options.find(function (o) { return o.id === optionId; });
    if (!option) fail(state, 'there is no option "' + optionId + '".');
    const vars = Object.assign({}, state.vars, option.set);
    return make(state.scenarioId, option.next, vars, state.path.concat([optionId]), state);
  }

  function pick(state, optionIds) {
    const c = load(state);
    if (c.node.kind !== 'pick') fail(state, 'pick is only for a pick, and this is a ' + c.node.kind + '.');
    const ids = [].concat(optionIds);
    if (ids.length !== c.node.count) fail(state, 'pick exactly ' + c.node.count + ' options, not ' + ids.length + '.');
    ids.forEach(function (id) {
      if (!c.node.options.some(function (o) { return o.id === id; })) fail(state, 'there is no option "' + id + '".');
    });
    if (new Set(ids).size !== ids.length) fail(state, 'the same option was picked twice.');
    // Recorded in option order, so the same picks always make the same path.
    const chosen = c.node.options.filter(function (o) { return ids.indexOf(o.id) >= 0; });
    const vars = Object.assign.apply(null, [{}, state.vars].concat(chosen.map(function (o) { return o.set || {}; })));
    const next = typeof c.node.next === 'function' ? c.node.next(vars, c.sc.k || {}) : c.node.next;
    const step = Object.freeze(chosen.map(function (o) { return o.id; }));
    return make(state.scenarioId, next, vars, state.path.concat([step]), state);
  }

  // Mood and week stay until a node changes them, so they depend on the nodes passed on the
  // way here. A state holds only the decisions, so the walk is retraced from the start.
  function carried(state) {
    const run = started[state.scenarioId];
    let s = make(state.scenarioId, run.sc.start, Object.assign({}, run.sc.vars), [], state);
    let mood = null;
    let week = null;
    for (let steps = 0; steps < 1000; steps += 1) {
      const node = run.sc.nodes[s.nodeId];
      if (node.mood) mood = node.mood;
      if (node.week != null) week = Number(context(s).fill(node.week));
      if (s.nodeId === state.nodeId && s.path.length === state.path.length) return { mood: mood, week: week };
      const step = state.path[s.path.length];
      if (node.kind === 'beat') s = advance(s);
      else if (node.kind === 'choice') s = choose(s, step);
      else if (node.kind === 'pick') s = pick(s, step);
      else break;
    }
    fail(state, 'its path cannot be retraced from the start.');
  }

  function view(state) {
    const c = context(state);
    const node = c.node;
    const here = carried(state);
    return {
      kind: node.kind,
      at: node.at || null,
      show: node.show || null,
      text: c.paragraphs(node.text),
      lead: c.line(node.lead),
      foot: c.line(node.foot),
      from: c.line(node.from),
      to: c.line(node.to),
      who: node.who || null,
      title: c.line(node.title),
      headline: c.line(node.headline),
      stamp: c.line(node.stamp),
      small: c.line(node.small),
      face: node.face || null,
      mood: here.mood,
      week: here.week,
      event: node.event || null,
      prompt: c.line(node.prompt),
      hint: c.line(node.hint),
      options: (node.options || []).map(function (o) {
        return { id: o.id, label: c.fill(o.label), note: c.line(o.note), text: c.line(o.text) };
      }),
      count: node.count || null,
      result: node.result || null,
      // A wildcard's front page, shown before this node (SPEC 9).
      news: node.news ? { headline: c.line(node.news.headline), text: c.paragraphs(node.news.text) } : null
    };
  }

  // Lessons that bit come first, then the rest in order. On a lost deal none counts as
  // having bitten (SPEC 8.3).
  function result(state) {
    const c = context(state);
    if (c.node.kind !== 'ending') fail(state, 'result is only for an ending, and this is a ' + c.node.kind + '.');
    const s = c.settled;
    const lessons = (c.sc.lessons || []).map(function (l) {
      const bit = c.node.result !== 'lost' && typeof l.when === 'function' && Boolean(l.when(c.v));
      return { text: c.fill(l.text), small: l.small ? c.fill(l.small) : null, bit: bit };
    });
    const reallife = (c.house.reallife && c.house.reallife[c.sc.id]) || c.sc.reallife || '';
    const whatIfs = (c.sc.whatIfs ? c.sc.whatIfs(c.v, c.k) : []).map(function (w) {
      return { id: w.id, state: w.state, amount: w.amount, text: c.fill(w.text, { amount: w.amount }) };
    });
    return {
      lines: (s.lines || []).map(function (line) {
        return { id: line.id, label: c.fill(line.label), amount: line.amount, detail: c.line(line.detail) };
      }),
      net: s.net,
      tally: (s.tally || []).map(function (row) {
        return { label: c.fill(row.label), value: typeof row.value === 'number' ? row.value : c.fill(row.value) };
      }),
      note: c.line(s.note),
      whatIfs: whatIfs,
      whatIfNote: whatIfs.length ? c.line(c.sc.whatIfNote) : null,
      lessons: lessons.filter(function (l) { return l.bit; })
        .concat(lessons.filter(function (l) { return !l.bit; })).slice(0, 4),
      reallife: c.fill(reallife)
    };
  }

  function replay(scenario, house, path) {
    let state = start(scenario, house);
    let used = 0;
    for (let steps = 0; !state.done; steps += 1) {
      if (steps > 1000) fail(state, 'the path never reaches an ending.');
      const kind = scenario.nodes[state.nodeId].kind;
      if (kind === 'beat') {
        state = advance(state);
      } else {
        if (used >= path.length) fail(state, 'the path runs out at this ' + kind + '.');
        state = kind === 'choice' ? choose(state, path[used]) : pick(state, path[used]);
        used += 1;
      }
    }
    if (used < path.length) fail(state, 'the path has ' + (path.length - used) + ' steps left over at the ending.');
    return state;
  }

  B2B.engine = {
    start: start,
    view: view,
    advance: advance,
    choose: choose,
    pick: pick,
    result: result,
    replay: replay
  };
})();
