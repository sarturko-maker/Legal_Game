// Screens around the deals (SPEC 4, 6.4): the intro card, the facilitator menu, and the
// plain error screen for pack problems. The title, set-up and year end come in M5.
(function () {
  const B2B = globalThis.B2B;

  function el(tag, cls, parent, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
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

  // The facilitator menu: a corner button, or Esc. Version 1 at M4 offers restarting the
  // deal; the other entries in SPEC 6.4 arrive with the session in M5.
  function menu(stage, actions) {
    const button = el('button', 'menu-button', stage.el, 'Menu');
    button.type = 'button';
    el('kbd', '', button, 'Esc');
    const panel = el('div', 'menu', stage.el);
    panel.hidden = true;
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Menu');
    el('h2', '', panel, 'Menu');
    const m = {
      open: false,
      toggle: function (on) {
        m.open = on === undefined ? !m.open : on;
        panel.hidden = !m.open;
        if (m.open) panel.querySelector('button').focus();
        else button.blur();
      }
    };
    actions.concat([{ label: 'Close', run: function () {} }]).forEach(function (a) {
      const b = el('button', '', panel, a.label);
      b.type = 'button';
      b.addEventListener('click', function () {
        m.toggle(false);
        a.run();
      });
    });
    button.addEventListener('click', function () { m.toggle(); });
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

  B2B.screens = { intro: intro, menu: menu, problems: problems };
})();
