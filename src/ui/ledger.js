// After every ending (SPEC 8), each on its own screen over the dimmed town: the ledger, what
// each protection was worth (skipped when the scenario has nothing to say), and the debrief.
(function () {
  const B2B = globalThis.B2B;
  const P = function () { return B2B.props; };

  function el(tag, cls, parent, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    if (parent) parent.appendChild(e);
    return e;
  }

  const quick = function () { return Boolean(B2B.debug && B2B.debug.instant) || B2B.stage.reduce; };

  // An amount as the scripts' ledger tables write it: a sign, thousands commas, a true minus.
  function amount(n, currency) {
    const s = B2B.packs.number(n, currency);
    return n > 0 ? '+' + s : s;
  }

  function row(table, label, value, cls, minus) {
    const tr = el('tr', cls || '', table);
    el('td', '', tr, label);
    const td = el('td', 'amount', tr);
    el('span', minus ? 'minus' : '', td, value);
    return tr;
  }

  // One screen: a paper prop with a Continue button, unless it is the last (plain), which has
  // its own button. reveal, if given, is what the first press shows at once when it has not
  // appeared yet.
  function screen(parent, cls, seed, onNext, plain) {
    const prop = el('div', 'prop ' + cls, parent);
    prop.setAttribute('aria-live', 'polite');
    let reveal = null;
    let gone = false;
    const s = {
      el: prop,
      reveal: function (fn, ms) {
        let timer = null;
        reveal = function () {
          clearTimeout(timer);
          reveal = null;
          fn();
        };
        if (quick()) reveal();
        else timer = setTimeout(function () { if (reveal) reveal(); }, ms);
      },
      press: function () {
        if (reveal) return reveal();
        if (gone) return;
        gone = true;
        onNext();
      },
      leave: function () { P().leave(prop); }
    };
    if (!plain) {
      P().continueButton(prop, s.press).classList.add('ready');
      prop.addEventListener('click', s.press);
    }
    P().rise(prop, P().tilt(seed) / 2);
    return s;
  }

  // 1. The ledger: the scenario's count, the lines, then the result, which comes last.
  function ledger(parent, sc, result, house, onNext) {
    const s = screen(parent, 'book ending', sc.title, onNext);
    el('h2', '', s.el, sc.title);
    const table = el('table', 'accounts', s.el);
    (result.tally || []).forEach(function (t) { row(table, t.label, t.value, 'tally'); });
    result.lines.forEach(function (l) {
      const tr = row(table, l.label, amount(l.amount, house.currency), '', l.amount < 0);
      if (l.detail) el('div', 'small', tr.firstChild, l.detail);
    });
    const total = row(table, 'Result', amount(result.net, house.currency), 'result later', result.net < 0);
    const note = result.note ? el('p', 'aside', s.el, result.note) : null;
    if (note) note.hidden = true;
    s.reveal(function () {
      total.classList.remove('later');
      if (note) note.hidden = false;
    }, 900);
    return s;
  }

  // 2. What each protection was worth.
  function whatIfs(parent, sc, result, house, onNext) {
    const s = screen(parent, 'book ending', 'whatif' + sc.id, onNext);
    el('h2', '', s.el, 'What each protection was worth');
    result.whatIfs.forEach(function (w) { el('p', 'entry whatif', s.el, w.text); });
    if (result.whatIfNote) el('p', 'small', s.el, result.whatIfNote);
    return s;
  }

  // 3. The debrief: up to four lessons, those that bit on this run first and marked in the
  // margin, then "In real life", then Play again.
  function debrief(parent, sc, result, house, onNext) {
    const s = screen(parent, 'debrief', 'debrief' + sc.id, onNext, true);
    el('h2', '', s.el, 'Debrief');
    const list = el('ol', '', s.el);
    result.lessons.forEach(function (l) {
      const li = el('li', l.bit ? 'bit' : '', list);
      el('span', '', li, l.text);
      if (l.bit) el('span', 'bitnote', li, 'bit you on this run');
      if (l.small) el('div', 'small', li, l.small);
    });
    if (result.reallife) {
      const box = el('div', 'real', s.el);
      el('h3', '', box, 'In real life');
      el('p', '', box, result.reallife);
    }
    const again = el('button', 'again', s.el, 'Play again');
    again.type = 'button';
    again.addEventListener('click', function (e) {
      e.stopPropagation();
      s.press();
    });
    setTimeout(function () { again.focus({ preventScroll: true }); }, 0);
    return s;
  }

  // Shows the screens in turn; onDone runs when the player leaves the debrief.
  function show(parent, sc, result, house, onDone) {
    const screens = [ledger, result.whatIfs.length ? whatIfs : null, debrief].filter(Boolean);
    let i = 0;
    let current = null;
    const next = function () {
      if (current) current.leave();
      if (i < screens.length) current = screens[i++](parent, sc, result, house, next);
      else {
        current = null;
        onDone();
      }
    };
    next();
    return {
      press: function () { if (current) current.press(); },
      stop: function () { if (current) current.leave(); current = null; }
    };
  }

  B2B.ledger = { show: show, amount: amount };
})();
