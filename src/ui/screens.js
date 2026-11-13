// Screens around the deals (SPEC 4, 6.4): the title, set-up, the intro card, the year end,
// the facilitator menu, and the plain error screen for pack problems.
(function () {
  const B2B = globalThis.B2B;

  function el(tag, cls, parent, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = B2B.props.typeset(text);
    if (parent) parent.appendChild(e);
    return e;
  }

  // "Deal 1 of 2", the title. Continue starts the deal.
  function intro(parent, n, of, title, onGo) {
    const prop = el('div', 'prop intro', parent);
    el('div', 'count', prop, 'Deal ' + n + ' of ' + of);
    el('h1', '', prop, title);
    let gone = false;
    const press = function () {
      if (gone) return;
      gone = true;
      B2B.props.leave(prop);
      onGo();
    };
    B2B.props.continueButton(prop, press).classList.add('ready');
    prop.addEventListener('click', press);
    B2B.props.rise(prop, B2B.props.tilt(title) / 2);
    return { press: press, stop: function () { B2B.props.leave(prop); } };
  }

  function button(parent, cls, text, run) {
    const b = el('button', cls, parent, text);
    b.type = 'button';
    b.addEventListener('click', function (e) {
      e.stopPropagation();
      run();
    });
    return b;
  }

  // A paper sheet that rises, with leave() and no Continue button of its own.
  function sheet(parent, cls, seed) {
    const prop = el('div', 'prop ' + cls, parent);
    B2B.props.rise(prop, B2B.props.tilt(seed) / 3);
    return prop;
  }

  // The title: the name, one line of pitch, Play and Set up (SPEC 4).
  function title(parent, onPlay, onSetup) {
    const prop = sheet(parent, 'titlecard', 'title');
    el('h1', '', prop, 'Back to Back');
    el('p', 'pitch', prop, 'What contract terms can cost.');
    const row = el('div', 'buttons', prop);
    const play = button(row, 'big', 'Play', onPlay);
    button(row, 'big quiet', 'Set up', onSetup);
    setTimeout(function () { play.focus({ preventScroll: true }); }, 0);
    return { stop: function () { B2B.props.leave(prop); } };
  }

  // Set up: every scenario with its title, blurb, tags, minutes and a tick box, then the
  // options. Start plays the ticked scenarios in the order listed.
  function setup(parent, scenarios, options, onStart) {
    const prop = sheet(parent, 'setup', 'setup');
    el('h2', '', prop, 'Set up');
    const list = el('div', 'deals', prop);
    const boxes = scenarios.map(function (sc) {
      const row = el('label', 'deal', list);
      const box = el('input', '', row);
      box.type = 'checkbox';
      box.checked = options.ticked.indexOf(sc.id) >= 0;
      const words = el('span', 'words', row);
      el('span', 'name', words, sc.title);
      if (sc.blurb) el('span', 'blurb', words, sc.blurb);
      el('span', 'meta', words, (sc.tags || []).join(' \u00b7 ') + (sc.minutes ? ' \u00b7 ' + sc.minutes + ' minutes' : ''));
      return { id: sc.id, box: box };
    });
    const opts = el('div', 'options', prop);
    const choose = function (name, legend, values, current) {
      const set = el('fieldset', '', opts);
      el('legend', '', set, legend);
      return values.map(function (v) {
        const l = el('label', '', set);
        const r = el('input', '', l);
        r.type = 'radio';
        r.name = name;
        r.checked = v[0] === current;
        el('span', '', l, v[1]);
        return { value: v[0], input: r };
      });
    };
    const size = choose('size', 'Text size', [[false, 'Normal'], [true, 'Large']], options.large);
    const walk = choose('walking', 'Walking', [[true, 'On'], [false, 'Off']], options.walking);
    const start = button(prop, 'big start', 'Start', function () {
      const ticked = boxes.filter(function (b) { return b.box.checked; }).map(function (b) { return b.id; });
      if (!ticked.length) {
        start.textContent = 'Tick at least one deal';
        return;
      }
      const picked = function (group) { return group.filter(function (g) { return g.input.checked; })[0].value; };
      onStart({ ticked: ticked, large: picked(size), walking: picked(walk) });
    });
    setTimeout(function () { boxes[0].box.focus({ preventScroll: true }); }, 0);
    return { stop: function () { B2B.props.leave(prop); } };
  }

  // The year end: one row per deal, the total, Play again and Back to set up (SPEC 4).
  function yearEnd(parent, rows, total, house, onAgain, onSetup) {
    const prop = sheet(parent, 'book yearend', 'year');
    el('h2', '', prop, 'Year end');
    const table = el('table', 'accounts', prop);
    const OUTCOMES = { deal: 'Deal', claim: 'Claim', lost: 'Lost', settled: 'Settled' };
    const amount = function (tr, n) {
      const td = el('td', 'amount', tr);
      el('span', n < 0 ? 'minus' : '', td, B2B.ledger.amount(n, house.currency));
    };
    rows.forEach(function (r) {
      const tr = el('tr', '', table);
      el('td', '', tr, r.title);
      el('td', 'outcome', tr, OUTCOMES[r.result] || r.result);
      amount(tr, r.net);
    });
    const tr = el('tr', 'result', table);
    el('td', '', tr, 'Total');
    el('td', '', tr, '');
    amount(tr, total);
    const row = el('div', 'buttons', prop);
    const again = button(row, 'big', 'Play again', onAgain);
    button(row, 'big quiet', 'Back to set up', onSetup);
    setTimeout(function () { again.focus({ preventScroll: true }); }, 0);
    return { stop: function () { B2B.props.leave(prop); } };
  }

  // The facilitator menu: a corner button, or Esc (SPEC 6.4). actions() gives the entries
  // that make sense at the moment it opens.
  function menu(stage, actions) {
    const corner = el('button', 'menu-button', stage.el, 'Menu');
    corner.type = 'button';
    el('kbd', '', corner, 'Esc');
    const panel = el('div', 'menu', stage.el);
    panel.hidden = true;
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Menu');
    const m = {
      open: false,
      toggle: function (on) {
        m.open = on === undefined ? !m.open : on;
        panel.hidden = !m.open;
        if (!m.open) {
          corner.blur();
          return;
        }
        panel.textContent = '';
        el('h2', '', panel, 'Menu');
        actions().concat([{ label: 'Close', run: function () {} }]).forEach(function (a) {
          button(panel, '', a.label, function () {
            m.toggle(false);
            a.run();
          });
        });
        panel.querySelector('button').focus();
      }
    };
    corner.addEventListener('click', function () { m.toggle(); });
    return m;
  }

  // If the packs have problems, the game does not start (SPEC 5.2).
  function problems(list) {
    document.body.textContent = '';
    const box = el('div', 'problems', document.body);
    el('h1', '', box, 'The packs have problems');
    const ul = el('ul', '', box);
    list.forEach(function (p) { el('li', '', ul, p); });
  }

  B2B.screens = { title: title, setup: setup, intro: intro, yearEnd: yearEnd, menu: menu, problems: problems };
})();
