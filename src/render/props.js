// The props (SPEC 7, ART 9). Each one is HTML and CSS, so the type is crisp and the text
// is real, in reading order. M3 has the telegram and the choice panel.
(function () {
  const B2B = globalThis.B2B;
  const TYPE_RATE = 45;

  function el(tag, cls, parent, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    if (parent) parent.appendChild(e);
    return e;
  }

  // A slight rotation, under one degree, fixed for the life of the prop and different from
  // one prop to the next. Worked out from the text, so it is the same on every replay.
  function tilt(seed) {
    let h = 0;
    for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) % 1000;
    return ((h / 1000) * 1.6 - 0.8).toFixed(2);
  }

  const quick = function () { return (B2B.debug && B2B.debug.instant) || B2B.stage.reduce; };

  // Brings a prop up from the bottom of the screen in about 300 ms.
  function rise(prop, turn) {
    prop.style.transform = 'translateY(260px) rotate(' + turn + 'deg)';
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        prop.classList.add('in');
        prop.style.transform = 'translateY(0) rotate(' + turn + 'deg)';
      });
    });
  }

  function leave(prop) {
    prop.classList.remove('in');
    prop.style.transform = 'translateY(260px)';
    setTimeout(function () { prop.remove(); }, quick() ? 0 : 320);
  }

  function continueButton(prop, onContinue) {
    const b = el('button', 'continue', prop);
    b.type = 'button';
    b.textContent = 'Continue';
    el('kbd', '', b, 'Space');
    b.addEventListener('click', function (e) { e.stopPropagation(); onContinue(); });
    return b;
  }

  // The telegram form. Its text types out at about 45 characters a second; any input
  // finishes it at once, and the next input continues.
  function telegram(parent, view, house, onContinue) {
    const prop = el('div', 'prop telegram', parent);
    const turn = tilt(view.text.join(' '));
    el('div', 'company', prop, (house.telegraph || '').toUpperCase());
    el('div', 'kind', prop, 'TELEGRAM');
    const who = el('div', 'who', prop, view.to ? 'To' : 'From');
    el('b', '', who, view.to || view.from || '');
    const message = el('div', 'message', prop);
    message.setAttribute('aria-label', view.text.join(' '));
    // One span per character, so typing reveals letters without moving the layout.
    const chars = [];
    view.text.join(' ').split(/(\bSTOP\b)/i).forEach(function (part) {
      const holder = /^STOP$/i.test(part) ? el('span', 'stop', message) : message;
      Array.from(part).forEach(function (c) { chars.push(el('span', 'later', holder, c)); });
    });
    const stamp = el('div', 'stamp', prop);
    stamp.style.setProperty('--turn', (-6 - Number(turn) * 3) + 'deg');
    stamp.textContent = view.to ? 'SENT' : 'RECEIVED';
    el('small', '', stamp, (house.town || '').toUpperCase());
    const button = continueButton(prop, function () { handle.press(); });

    let shown = 0;
    let done = false;
    const complete = function () {
      if (done) return;
      done = true;
      chars.forEach(function (c) { c.classList.remove('later'); });
      stamp.classList.add('landed');
      button.classList.add('ready');
    };
    const handle = {
      el: prop,
      // Any input: finish the typing, or continue when it is finished.
      press: function () {
        if (!done) complete();
        else onContinue();
      },
      finish: complete,
      leave: function () { leave(prop); }
    };
    prop.addEventListener('click', handle.press);
    rise(prop, turn);
    if (quick()) {
      complete();
    } else {
      let start = null;
      const type = function (t) {
        if (done) return;
        if (start === null) start = t + 300;
        const due = Math.max(0, Math.floor((t - start) / 1000 * TYPE_RATE));
        while (shown < Math.min(due, chars.length)) chars[shown++].classList.remove('later');
        if (shown >= chars.length) complete();
        else requestAnimationFrame(type);
      };
      requestAnimationFrame(type);
    }
    return handle;
  }

  // The choice panel: the prompt on a strip of paper, then one ticket per option, numbered
  // for the keys 1 to 4. The chosen ticket is punched at once, as feedback.
  function choice(parent, view, onChoose) {
    const prop = el('div', 'prop panel', parent);
    el('div', 'prompt', prop, view.prompt);
    let chosen = false;
    const tickets = view.options.map(function (o, i) {
      const t = el('button', 'ticket', prop);
      t.type = 'button';
      el('span', 'key', t, String(i + 1));
      const words = el('span', '', t);
      el('span', 'label', words, o.label);
      if (o.note) el('span', 'note', words, o.note);
      t.addEventListener('click', function () { pick(i); });
      return t;
    });
    const pick = function (i) {
      if (chosen || !tickets[i]) return;
      chosen = true;
      tickets[i].classList.add('punched');
      setTimeout(function () { onChoose(view.options[i].id); }, quick() ? 0 : 450);
    };
    rise(prop, 0);
    setTimeout(function () { tickets[0].focus({ preventScroll: true }); }, 0);
    return { el: prop, key: pick, leave: function () { leave(prop); } };
  }

  B2B.props = { telegram: telegram, choice: choice };
})();
