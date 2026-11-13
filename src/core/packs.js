// The pack registry (SPEC 5.2), placeholders (PACK-FORMAT 4) and validation (PACK-FORMAT 6).
// Validation runs when a pack registers, so the game and the checker see the same problems.
(function () {
  const B2B = globalThis.B2B;
  const registered = [];
  const found = [];

  const PLACES = ['telegraph', 'supply', 'law', 'depot', 'yard', 'courthouse'];
  const SHOWS = ['telegram', 'page', 'ledger', 'card', 'poster', 'paper', 'say', 'note'];
  const MOODS = ['dawn', 'day', 'dusk', 'night', 'storm'];
  const EVENTS = ['trainOut', 'trainIn'];
  const RESULTS = ['deal', 'claim', 'lost', 'settled'];
  const FACES = ['up', 'down'];
  const PROP = ['at', 'show', 'text', 'lead', 'foot', 'from', 'to', 'who', 'title', 'headline',
    'stamp', 'small', 'face', 'mood'];
  const FIELDS = {
    beat: ['kind'].concat(PROP, ['event', 'week', 'next']),
    ending: ['kind'].concat(PROP, ['result']),
    choice: ['kind', 'at', 'prompt', 'options', 'week'],
    pick: ['kind', 'at', 'prompt', 'hint', 'who', 'options', 'count', 'next']
  };
  const OPTION_FIELDS = {
    choice: ['id', 'label', 'note', 'set', 'next'],
    pick: ['id', 'label', 'text', 'set']
  };
  const SHOW_LIMITS = { telegram: 320, say: 400, note: 400, page: 600, card: 700 };
  const MAX_STEPS = 80;

  // Thousands separators, a true minus sign, and the house currency after the sign.
  function number(n, currency) {
    const parts = String(Math.abs(n)).split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return (n < 0 ? '−' : '') + (currency || '') + parts.join('.');
  }

  // sources is in PACK-FORMAT 4 order: derive, settle, vars, k, skin, house.
  // A value that is null or missing does not match, so the search goes on to the next source.
  // A name that ends in a full stop ("Co.") absorbs the full stop that follows it in the text,
  // so "{entity}. No account." never prints "Co.. No account."
  function fill(text, sources, currency, where) {
    const all = String(text);
    return all.replace(/\{(\w+)\}/g, function (whole, name, at) {
      for (const source of sources) {
        if (source && Object.prototype.hasOwnProperty.call(source, name) && source[name] != null) {
          const value = typeof source[name] === 'number' ? number(source[name], currency) : String(source[name]);
          const stopFollows = all.charAt(at + whole.length) === '.';
          return stopFollows && value.slice(-1) === '.' ? value.slice(0, -1) : value;
        }
      }
      throw new Error(where + ': placeholder ' + whole + ' does not resolve.');
    });
  }

  function house() {
    const out = { reallife: {} };
    registered.forEach(function (pack) {
      const h = pack.house || {};
      Object.assign(out, h, { reallife: Object.assign({}, out.reallife, h.reallife) });
    });
    return out;
  }

  function cast() {
    return Object.assign.apply(null, [{}].concat(registered.map(function (pack) { return pack.cast || {}; })));
  }

  // A later scenario with the same id replaces the earlier one in its place in the list.
  function scenarios() {
    const byId = new Map();
    let hidden = [];
    registered.forEach(function (pack) {
      (pack.scenarios || []).forEach(function (sc) { byId.set(sc.id, sc); });
      hidden = hidden.concat(pack.hide || []);
    });
    return Array.from(byId.values()).filter(function (sc) { return hidden.indexOf(sc.id) < 0; });
  }

  function checkNode(sc, id, node, castList, say) {
    const where = 'Scenario ' + sc.id + ', node ' + id;
    const allowed = FIELDS[node.kind];
    if (!allowed) return say(where, 'unknown kind "' + node.kind + '".');
    Object.keys(node).forEach(function (field) {
      if (allowed.indexOf(field) < 0) say(where, 'a ' + node.kind + ' may not have "' + field + '".');
    });
    const known = function (field, list) {
      if (node[field] != null && list.indexOf(node[field]) < 0) say(where, 'unknown ' + field + ' "' + node[field] + '".');
    };
    known('at', PLACES);
    known('show', SHOWS);
    known('mood', MOODS);
    known('event', EVENTS);
    known('result', RESULTS);
    known('face', FACES);
    known('who', castList);
    if (node.event && node.at !== 'depot') say(where, 'event "' + node.event + '" happens only at the depot.');
    if (node.kind === 'ending' && !node.result) say(where, 'an ending needs a result.');
    const target = function (next, what) {
      if (typeof next === 'string' && !Object.prototype.hasOwnProperty.call(sc.nodes, next)) {
        say(where, what + ' points at "' + next + '", which is not a node.');
      } else if (typeof next !== 'string' && typeof next !== 'function') {
        say(where, what + ' is missing.');
      }
    };
    if (node.kind === 'beat' || node.kind === 'pick') target(node.next, 'next');
    if (node.kind === 'choice' || node.kind === 'pick') {
      const options = node.options || [];
      if (node.kind === 'choice' && (options.length < 2 || options.length > 4)) {
        say(where, 'a choice needs 2 to 4 options; it has ' + options.length + '.');
      }
      if (node.kind === 'pick' && options.length < 3) say(where, 'a pick needs 3 or more options.');
      if (node.kind === 'pick' && !(node.count >= 1 && node.count < options.length)) {
        say(where, 'count must be at least 1 and below the number of options.');
      }
      const ids = [];
      options.forEach(function (o) {
        if (ids.indexOf(o.id) >= 0) say(where, 'option id "' + o.id + '" is used twice.');
        ids.push(o.id);
        Object.keys(o).forEach(function (field) {
          if (OPTION_FIELDS[node.kind].indexOf(field) < 0) say(where, 'option "' + o.id + '" may not have "' + field + '".');
        });
        if (!o.id || !o.label) say(where, 'every option needs an id and a label.');
        if (node.kind === 'choice') target(o.next, 'option "' + o.id + '" next');
      });
    }
  }

  function checkLengths(view, where, say) {
    const over = function (what, text, max) {
      if (text && text.length > max) say(where, what + ' is ' + text.length + ' characters; the limit is ' + max + '.');
    };
    view.options.forEach(function (o) {
      over('option "' + o.id + '" label', o.label, 80);
      over('option "' + o.id + '" note', o.note, 80);
    });
    over('lead', view.lead, 220);
    over('foot', view.foot, 220);
    over('headline', view.headline, 48);
    if (SHOW_LIMITS[view.show]) over('the ' + view.show + ' text', view.text.join(' '), SHOW_LIMITS[view.show]);
  }

  function checkSettle(sc, state, where, say) {
    const s = sc.settle(state.vars, sc.k || {});
    const amounts = (s.lines || []).map(function (line) { return line.amount; });
    if (!amounts.concat([s.net]).every(Number.isFinite)) say(where, 'settle returned an amount that is not a finite number.');
    const sum = amounts.reduce(function (a, b) { return a + b; }, 0);
    if (Math.abs(sum - s.net) > 1e-6) say(where, 'settle returned net ' + s.net + ', but its lines add up to ' + sum + '.');
  }

  // Every combination of `count` option ids, in option order.
  function combinations(ids, count) {
    if (count === 0) return [[]];
    const out = [];
    ids.forEach(function (id, i) {
      combinations(ids.slice(i + 1), count - 1).forEach(function (rest) { out.push([id].concat(rest)); });
    });
    return out;
  }

  // Walks every path through the scenario with the real engine. Placeholders that do not
  // resolve, and nexts that point nowhere, show up as errors thrown by the engine.
  function explore(sc, houseNow, say) {
    const engine = B2B.engine;
    const reached = new Set();
    const visit = function (state, steps) {
      const node = sc.nodes[state.nodeId];
      const where = 'Scenario ' + sc.id + ', path "' + state.path.join(' ') + '", node ' + state.nodeId;
      reached.add(state.nodeId);
      if (steps > MAX_STEPS) return say(where, 'the path does not reach an ending within ' + MAX_STEPS + ' steps.');
      try {
        checkLengths(engine.view(state), where, say);
        if (node.kind === 'ending') {
          checkSettle(sc, state, where, say);
          engine.result(state);
          return;
        }
        if (node.kind === 'beat') return visit(engine.advance(state), steps + 1);
        if (node.kind === 'choice') {
          return node.options.forEach(function (o) { visit(engine.choose(state, o.id), steps + 1); });
        }
        const ids = node.options.map(function (o) { return o.id; });
        combinations(ids, node.count).forEach(function (combo) { visit(engine.pick(state, combo), steps + 1); });
      } catch (err) {
        say(where, err.message);
      }
    };
    try {
      visit(engine.start(sc, houseNow), 1);
    } catch (err) {
      say('Scenario ' + sc.id, err.message);
    }
    return reached;
  }

  function checkScenario(sc, houseNow, castNow, say) {
    const where = 'Scenario ' + sc.id;
    if (!sc.nodes || typeof sc.nodes !== 'object') return say(where, 'has no nodes.');
    if (typeof sc.settle !== 'function') return say(where, 'has no settle function.');
    if (!Object.prototype.hasOwnProperty.call(sc.nodes, sc.start)) return say(where, 'start "' + sc.start + '" is not a node.');
    const castList = Object.keys(castNow);
    Object.keys(sc.nodes).forEach(function (id) { checkNode(sc, id, sc.nodes[id], castList, say); });
    const reached = explore(sc, houseNow, say);
    Object.keys(sc.nodes).forEach(function (id) {
      if (!reached.has(id)) say(where + ', node ' + id, 'can never be reached.');
    });
  }

  // Returns the problems with one pack, checked against the given house and cast.
  function validate(pack, houseNow, castNow) {
    const out = [];
    const say = function (where, problem) {
      const line = 'Pack ' + (pack.id || '(no id)') + '. ' + where + ': ' + problem;
      if (out.indexOf(line) < 0) out.push(line);
    };
    if (!pack.id) say('The pack', 'has no id.');
    const ids = [];
    (pack.scenarios || []).forEach(function (sc) {
      if (ids.indexOf(sc.id) >= 0) say('Scenario ' + sc.id, 'the id is used twice.');
      ids.push(sc.id);
      checkScenario(sc, houseNow, castNow, say);
    });
    return out;
  }

  B2B.registerPack = function (pack) {
    registered.push(pack);
    validate(pack, house(), cast()).forEach(function (p) { found.push(p); });
  };

  B2B.packs = {
    scenarios: scenarios,
    house: house,
    cast: cast,
    problems: function () { return found.slice(); },
    // The packs loaded, for the result record (SPEC 5.3).
    loaded: function () { return registered.map(function (pack) { return { id: pack.id, version: pack.version }; }); },
    validate: validate,
    fill: fill,
    number: number
  };
})();
