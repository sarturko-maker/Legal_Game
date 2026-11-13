// The props (SPEC 7, ART 9). Each one is HTML and CSS, so the type is crisp and the text
// is real, in reading order. Every prop answers press(): the first press finishes whatever
// it is still doing (typing, turning over, a stamp landing), the next one continues.
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

  const instant = function () { return Boolean(B2B.debug && B2B.debug.instant); };
  const quick = function () { return instant() || B2B.stage.reduce; };
  const later = function (fn, ms) { return setTimeout(fn, quick() ? 0 : ms); };

  // Brings a prop up from the bottom of the screen in about 300 ms. With reduced motion it
  // fades in where it stands (SPEC 13).
  const travel = function () { return B2B.stage.reduce ? 0 : 260; };
  function rise(prop, turn) {
    prop.style.transform = 'translateY(' + travel() + 'px) rotate(' + turn + 'deg)';
    if (instant()) {
      prop.classList.add('in', 'now');
      prop.style.transform = 'rotate(' + turn + 'deg)';
      return;
    }
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        prop.classList.add('in');
        prop.style.transform = 'translateY(0) rotate(' + turn + 'deg)';
      });
    });
  }

  // Leaves the same way. It is taken out of the column first, where it stands, so that the
  // next prop does not jump.
  function leave(prop) {
    if (prop.parentNode && getComputedStyle(prop).position !== 'absolute') {
      const at = { top: prop.offsetTop, left: prop.offsetLeft, width: prop.offsetWidth };
      prop.style.position = 'absolute';
      prop.style.top = at.top + 'px';
      prop.style.left = at.left + 'px';
      prop.style.width = at.width + 'px';
      prop.style.margin = '0';
    }
    prop.classList.remove('in');
    prop.style.transform = 'translateY(' + travel() + 'px)';
    setTimeout(function () { prop.remove(); }, quick() ? 0 : 320);
  }

  function continueButton(prop, onPress) {
    const b = el('button', 'continue', prop);
    b.type = 'button';
    b.textContent = 'Continue';
    el('kbd', '', b, 'Space');
    b.addEventListener('click', function (e) { e.stopPropagation(); onPress(); });
    return b;
  }

  // The part every prop shares: a click or the Continue button presses it; the first press
  // finishes its effect, if it has one, and the next continues, once only.
  function handle(prop, turn, onContinue, onComplete) {
    let done = false;
    let left = false;
    let effect = null;
    const button = continueButton(prop, function () { h.press(); });
    const h = {
      el: prop,
      // An effect is something the prop does on its own, with a finish().
      effect: function (e) { effect = e; done = false; },
      complete: function () {
        if (done) return;
        done = true;
        if (effect) effect.finish();
        button.classList.add('ready');
        if (onComplete) onComplete();
      },
      press: function () {
        if (!done) {
          h.complete();
        } else if (!left) {
          left = true;
          onContinue();
        }
      },
      leave: function () { leave(prop); }
    };
    prop.addEventListener('click', h.press);
    rise(prop, turn);
    return h;
  }

  // Paragraphs of text, one <p> each.
  function paragraphs(parent, text, cls) {
    (text || []).forEach(function (t) { el('p', cls || '', parent, t); });
  }

  function stamp(parent, text, turn) {
    const s = el('div', 'stamp', parent, text);
    s.style.setProperty('--turn', turn + 'deg');
    return s;
  }

  // Lands a stamp after a short pause, with a small overshoot (ART 7).
  function landing(s, h, ms) {
    let timer = null;
    const finish = function () {
      clearTimeout(timer);
      s.classList.add('landed');
    };
    h.effect({ finish: finish });
    timer = later(function () { finish(); h.complete(); }, ms);
  }

  // The telegram form. Its text types out at about 45 characters a second; any input
  // finishes it at once, and the next input continues. Outgoing telegrams are typed too:
  // that is them being written.
  function telegram(parent, view, ctx, onContinue) {
    const prop = el('div', 'prop telegram', parent);
    const turn = tilt(view.text.join(' '));
    el('div', 'company', prop, (ctx.house.telegraph || '').toUpperCase());
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
    const s = stamp(prop, view.stamp || (view.to ? 'SENT' : 'RECEIVED'), -6 - Number(turn) * 3);
    el('small', '', s, (ctx.house.town || '').toUpperCase());
    const h = handle(prop, turn, onContinue, ctx.onComplete);
    let shown = 0;
    let stop = false;
    h.effect({
      finish: function () {
        stop = true;
        chars.forEach(function (c) { c.classList.remove('later'); });
        s.classList.add('landed');
      }
    });
    if (quick()) {
      h.complete();
    } else {
      let start = null;
      const type = function (t) {
        if (stop) return;
        if (start === null) start = t + 300;
        const due = Math.max(0, Math.floor((t - start) / 1000 * TYPE_RATE));
        while (shown < Math.min(due, chars.length)) chars[shown++].classList.remove('later');
        if (shown >= chars.length) h.complete();
        else requestAnimationFrame(type);
      };
      requestAnimationFrame(type);
    }
    return h;
  }

  // A page of a contract or letter. Face down it shows its back: a backing sheet with the
  // title and the edge of a red seal. With ctx.turn it arrives face down and turns over on
  // its vertical axis (ART 7). A page someone has read for you has their pencil in the
  // margin, one line per clause.
  function page(parent, view, ctx, onContinue) {
    const prop = el('div', 'prop page' + (view.face === 'down' ? ' down' : ''), parent);
    const turn = tilt((view.title || '') + view.text.join(' '));
    el('div', 'sheet under two', prop);
    el('div', 'sheet under one', prop);
    const card = el('div', 'card', prop);
    const back = el('div', 'side back', card);
    el('div', 'seal', back);
    const front = el('div', 'side front', card);
    if (view.face === 'down') {
      if (view.title) el('div', 'backing', back, view.title);
    } else {
      if (view.who && ctx.cast[view.who]) {
        const c = ctx.cast[view.who];
        el('div', 'byline', front, c.name + (c.title ? ', ' + c.title : ''));
      }
      if (view.title) el('h2', '', front, view.title);
      paragraphs(front, view.text, view.who ? 'marked' : '');
      if (view.stamp) stamp(front, view.stamp, -7 - Number(turn) * 2).classList.add('landed');
    }
    const h = handle(prop, turn, onContinue, ctx.onComplete);
    if (view.face !== 'down' && ctx.turn && !quick()) {
      card.classList.add('turned');
      let timer = null;
      h.effect({
        finish: function () {
          clearTimeout(timer);
          card.classList.remove('turned');
        }
      });
      timer = later(function () { h.complete(); }, 700);
    } else {
      h.complete();
    }
    return h;
  }

  // A ruled account-book page: one entry per ruled line.
  function ledger(parent, view, ctx, onContinue) {
    const prop = el('div', 'prop book', parent);
    if (view.headline) el('h2', '', prop, view.headline);
    if (view.title) el('h2', '', prop, view.title);
    paragraphs(prop, view.text, 'entry');
    const h = handle(prop, tilt(view.text.join(' ')), onContinue, ctx.onComplete);
    h.complete();
    return h;
  }

  // A wood-type poster: a huge headline, nail holes, uneven inking, and a stamp that may
  // land across it.
  function poster(parent, view, ctx, onContinue) {
    const prop = el('div', 'prop poster', parent);
    ['tl', 'tr', 'bl', 'br'].forEach(function (k) { el('i', 'nail ' + k, prop); });
    const head = el('h2', '', prop, view.headline || '');
    head.insertAdjacentHTML('beforeend', '<svg class="inking" aria-hidden="true"><filter id="ink"><feTurbulence type="fractalNoise" baseFrequency=".06 .5" numOctaves="2" seed="3"/>' +
      '<feColorMatrix values="0 0 0 0 .945  0 0 0 0 .894  0 0 0 0 .788  0 0 0 -2.6 1.25"/></filter><rect width="100%" height="100%" filter="url(#ink)"/></svg>');
    paragraphs(prop, view.text);
    const turn = tilt(view.headline || '');
    const h = handle(prop, turn, onContinue, ctx.onComplete);
    if (view.stamp) {
      const s = stamp(prop, view.stamp, -9 + Number(turn) * 2);
      s.classList.add('across');
      prop.classList.add('stamped');
      landing(s, h, 650);
    } else {
      h.complete();
    }
    return h;
  }

  // The front page of the town newspaper: masthead, a rule, the date line, the headline and
  // a few lines of body.
  function paper(parent, view, ctx, onContinue) {
    const prop = el('div', 'prop news', parent);
    el('div', 'masthead', prop, ctx.house.paper || '');
    el('div', 'dateline', prop, (ctx.house.town || '').toUpperCase());
    el('h2', '', prop, view.headline || '');
    paragraphs(prop, view.text);
    const h = handle(prop, tilt(view.headline || ''), onContinue, ctx.onComplete);
    h.complete();
    return h;
  }

  // A character speaking: the portrait oval with the name and title beneath, the words in a
  // panel to the right.
  function say(parent, view, ctx, onContinue) {
    const prop = el('div', 'prop say', parent);
    const c = ctx.cast[view.who] || {};
    const who = el('div', 'speaker', prop);
    const oval = el('div', 'oval', who);
    oval.innerHTML = B2B.figures.portrait(c.look);
    if (c.name) el('div', 'name', who, c.name);
    if (c.title) el('div', 'role', who, c.title);
    const words = el('div', 'words', prop);
    paragraphs(words, view.text);
    const h = handle(prop, tilt(view.text.join(' ')), onContinue, ctx.onComplete);
    h.complete();
    return h;
  }

  // A plain caption low over the scene, on a strip of paper. The scene is not dimmed.
  function note(parent, view, ctx, onContinue) {
    const prop = el('div', 'prop strip note', parent);
    paragraphs(prop, view.text);
    const h = handle(prop, tilt(view.text.join(' ')), onContinue, ctx.onComplete);
    h.complete();
    return h;
  }

  // Lead and foot: a line of narration on its own strip, above or below the prop.
  function strip(parent, text, cls, before) {
    const s = el('div', 'strip ' + cls);
    el('p', '', s, text);
    parent.insertBefore(s, before || null);
    rise(s, tilt(text) / 2);
    return { el: s, leave: function () { leave(s); } };
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
      later(function () { onChoose(view.options[i].id); }, 450);
    };
    rise(prop, 0);
    return { el: prop, key: pick, leave: function () { leave(prop); } };
  }

  const SHOWS = { telegram: telegram, page: page, ledger: ledger, poster: poster, paper: paper, say: say, note: note };

  B2B.props = {
    // Builds the prop for a view. ctx is { house, cast, turn, onComplete }: turn means a face-up
    // page arrives face down and turns over; onComplete runs once the prop has finished.
    show: function (parent, view, ctx, onContinue) { return SHOWS[view.show](parent, view, ctx, onContinue); },
    choice: choice,
    strip: strip,
    stamp: stamp,
    tilt: tilt,
    rise: rise,
    leave: leave,
    continueButton: continueButton
  };
})();
