// The player, the cast, the runner and the train (ART 6, 7): flat silhouettes about 170
// logical pixels tall, told apart by outline, never by face. The walk is a two-pose leg
// swing with the opposite arm, and a slight bob; standing, a slow breath.
(function () {
  const B2B = globalThis.B2B;
  const FEET = 960;
  const SPEED = 320;
  const MAX_TRIP = 6;

  // The player: hat, coat, satchel. One accent: the hatband.
  const PLAYER =
    '<svg width="110" height="190" viewBox="-55 -180 110 190" aria-hidden="true">' +
    '<g class="body">' +
    '<g class="leg l1"><path fill="#241B16" d="M-12 -78 L2 -78 L-1 -4 L6 -4 L8 4 L-14 4 L-11 -4 Z"/></g>' +
    '<g class="leg l2"><path fill="#2B211C" d="M-6 -78 L10 -78 L8 -4 L15 -4 L17 4 L-5 4 L-2 -4 Z"/></g>' +
    '<g class="arm a1"><path fill="#241B16" d="M-24 -136 L-12 -136 L-14 -86 L-24 -86 Z"/></g>' +
    '<path fill="#2B211C" d="M-22 -140 Q0 -150 22 -140 L26 -70 Q0 -64 -26 -70 Z"/>' +
    '<path fill="#2B211C" d="M-26 -70 L-30 -60 L28 -60 L26 -70 Z"/>' +
    '<path fill="#1F1712" d="M14 -112 L32 -112 L34 -86 L12 -86 Z"/>' +
    '<path fill="#1F1712" d="M-18 -140 L14 -110 L10 -106 L-20 -134 Z"/>' +
    '<rect x="-6" y="-152" width="12" height="12" fill="#2B211C"/>' +
    '<ellipse cx="0" cy="-163" rx="13" ry="14" fill="#2B211C"/>' +
    '<path fill="#2B211C" d="M-30 -168 Q0 -174 30 -168 L30 -164 Q0 -168 -30 -164 Z"/>' +
    '<path fill="#2B211C" d="M-15 -168 Q-14 -186 0 -186 Q14 -186 15 -168 Z"/>' +
    '<rect x="-15" y="-172" width="30" height="4" fill="#A63A2B"/>' +
    '<g class="arm a2"><path fill="#33271F" d="M12 -136 L24 -136 L24 -86 L14 -86 Z"/></g>' +
    '</g></svg>';

  // The cast, told apart by outline (ART 6). Each faces right; scaleX(-1) turns it round.
  const LOOKS = {
    clerk:
      '<g class="leg l1"><path fill="#241B16" d="M-11 -78 L2 -78 L0 -4 L7 -4 L8 4 L-13 4 L-10 -4 Z"/></g>' +
      '<g class="leg l2"><path fill="#2B211C" d="M-4 -78 L10 -78 L9 -4 L16 -4 L17 4 L-3 4 L-1 -4 Z"/></g>' +
      '<g class="arm a1"><path fill="#3A2E27" d="M-23 -136 L-12 -136 L-13 -84 L-22 -84 Z"/><rect x="-23" y="-122" width="11" height="4" fill="#15100C"/></g>' +
      '<path fill="#3A2E27" d="M-19 -142 Q0 -150 19 -142 L21 -76 L-21 -76 Z"/>' +
      '<path fill="#1F1712" d="M-17 -140 L-4 -140 L0 -118 L4 -140 L17 -140 L20 -80 L-20 -80 Z"/>' +
      '<rect x="-21" y="-82" width="42" height="6" fill="#15100C"/>' +
      '<rect x="-5" y="-152" width="10" height="12" fill="#2B211C"/>' +
      '<ellipse cx="0" cy="-163" rx="12" ry="14" fill="#2B211C"/>' +
      '<rect x="-13" y="-174" width="26" height="5" fill="#15100C"/>' +
      '<path fill="#7A8B6A" d="M-2 -174 L14 -174 L32 -164 L30 -160 L4 -169 Z"/>' +
      '<g class="arm a2"><path fill="#3A2E27" d="M12 -136 L23 -136 L22 -84 L13 -84 Z"/><rect x="12" y="-122" width="11" height="4" fill="#15100C"/></g>',
    lawyer:
      '<g class="leg l1"><path fill="#241B16" d="M-9 -40 L1 -40 L0 -4 L7 -4 L8 4 L-11 4 L-8 -4 Z"/></g>' +
      '<g class="leg l2"><path fill="#2B211C" d="M-2 -40 L9 -40 L9 -4 L16 -4 L17 4 L-2 4 L0 -4 Z"/></g>' +
      '<g class="arm a1"><path fill="#241B16" d="M-24 -138 L-12 -138 L-14 -82 L-25 -82 Z"/></g>' +
      '<path fill="#2B211C" d="M-20 -142 Q0 -150 20 -142 L30 -34 Q0 -28 -30 -34 Z"/>' +
      '<path fill="#D9C7A3" d="M-6 -142 L6 -142 L0 -132 Z"/>' +
      '<rect x="-5" y="-152" width="10" height="12" fill="#2B211C"/>' +
      '<ellipse cx="0" cy="-163" rx="12" ry="14" fill="#2B211C"/>' +
      '<path fill="#2B211C" d="M-13 -166 Q-12 -180 2 -179 Q12 -178 13 -168 Q2 -172 -13 -166 Z"/>' +
      '<circle cx="-13" cy="-170" r="7" fill="#2B211C"/>' +
      '<g transform="rotate(-8 18 -110)"><rect x="6" y="-128" width="26" height="36" fill="#3A2420"/><rect x="6" y="-126" width="3" height="32" fill="#D9C7A3"/></g>' +
      '<g class="arm a2"><path fill="#33271F" d="M12 -138 L24 -138 L26 -86 L14 -86 Z"/></g>',
    runner:
      '<g transform="rotate(14 0 -80) scale(.8) translate(0 22)">' +
      '<g class="leg l1"><path fill="#241B16" d="M-10 -78 L2 -78 L-1 -4 L6 -4 L8 4 L-12 4 L-10 -4 Z"/></g>' +
      '<g class="leg l2"><path fill="#2B211C" d="M-4 -78 L9 -78 L8 -4 L15 -4 L17 4 L-3 4 L-1 -4 Z"/></g>' +
      '<g class="arm a1"><path fill="#241B16" d="M-20 -132 L-10 -132 L-12 -92 L-21 -92 Z"/></g>' +
      '<path fill="#2B211C" d="M-17 -136 Q0 -144 17 -136 L18 -76 L-18 -76 Z"/>' +
      '<rect x="-5" y="-148" width="10" height="12" fill="#2B211C"/>' +
      '<ellipse cx="0" cy="-158" rx="12" ry="13" fill="#2B211C"/>' +
      '<g class="cap"><path fill="#E0A63F" d="M-26 -178 Q-14 -190 -2 -180 L4 -176 L-24 -172 Z"/></g>' +
      '<rect class="slip" x="14" y="-118" width="20" height="14" fill="#F1E4C9"/>' +
      '<g class="arm a2"><path fill="#33271F" d="M10 -132 L20 -132 L22 -96 L12 -96 Z"/></g>' +
      '</g>'
  };

  function figure(parent, svg, cls) {
    const el = document.createElement('div');
    el.className = 'figure' + (cls ? ' ' + cls : '');
    el.innerHTML = svg;
    parent.appendChild(el);
    return el;
  }

  function wrap(body) {
    return '<svg width="110" height="190" viewBox="-55 -180 110 190" aria-hidden="true"><g class="body">' + body + '</g></svg>';
  }

  // A cast member standing by a door, facing the player.
  function cast(parent, look, x, facing) {
    const el = figure(parent, wrap(LOOKS[look] || LOOKS.clerk), 'cast');
    el.style.transform = 'translate3d(' + (x - 55) + 'px, ' + (FEET - 180) + 'px, 0) scaleX(' + (facing || 1) + ')';
    return el;
  }

  // The same silhouette cropped at the chest, for a speaker's portrait (ART 6).
  function portrait(look) {
    const body = LOOKS[look] || PLAYER.replace(/^.*?<g class="body">|<\/g><\/svg>$/g, '');
    return '<svg viewBox="-36 -194 72 92" aria-hidden="true">' + body + '</svg>';
  }

  const quick = function (stage) { return (B2B.debug && B2B.debug.instant) || stage.reduce; };

  // Moves an element along the street from one x to another. finish() ends it at once.
  function glide(el, y, from, to, ms, curve, done) {
    let start = null;
    let over = false;
    const set = function (x) { el.style.transform = 'translate3d(' + x + 'px, ' + y + 'px, 0)' + (el.dataset.flip ? ' scaleX(-1)' : ''); };
    const finish = function () {
      if (over) return;
      over = true;
      h.over = true;
      set(to);
      if (done) done();
    };
    const h = { finish: finish, over: false };
    const tick = function (t) {
      if (over) return;
      if (start === null) start = t;
      const p = Math.min(1, (t - start) / ms);
      set(from + (to - from) * curve(p));
      if (p >= 1) finish();
      else requestAnimationFrame(tick);
    };
    set(from);
    if (!ms) finish();
    else requestAnimationFrame(tick);
    return h;
  }
  const steady = function (p) { return p; };

  // The runner (SPEC 6.3): a boy who runs in from the telegraph office's side with a
  // telegram, and out again. With reduced motion he simply appears and goes.
  function runner(stage) {
    const el = figure(stage.actors, wrap(LOOKS.runner), 'runner');
    el.hidden = true;
    let side = -1;
    const r = {
      // Runs in to stand just short of the player, from the west (side -1) or the east (1).
      in: function (towards, fromSide, done) {
        side = fromSide;
        el.hidden = false;
        el.classList.add('running');
        el.dataset.flip = side > 0 ? '1' : '';
        const from = side < 0 ? stage.x - 140 : stage.x + 2060;
        const to = towards - side * -110;
        const stop = function () { el.classList.remove('running'); if (done) done(); };
        return glide(el, FEET - 180, from - 55, to - 55, quick(stage) ? 0 : Math.abs(to - from) / 1.3, steady, stop);
      },
      // Runs back the way he came, carrying a telegram if he has one.
      out: function (carrying, done) {
        el.classList.toggle('carrying', Boolean(carrying));
        el.classList.add('running');
        el.dataset.flip = side < 0 ? '1' : '';
        const from = parseFloat(el.style.transform.slice(12)) || stage.x;
        const to = side < 0 ? stage.x - 200 : stage.x + 2120;
        return glide(el, FEET - 180, from, to, quick(stage) ? 0 : Math.abs(to - from) / 1.3, steady, function () {
          el.hidden = true;
          el.classList.remove('running', 'carrying');
          if (done) done();
        });
      },
      remove: function () { el.remove(); }
    };
    return r;
  }

  // The train (ART 7): an engine and two flat cars of stock, steam in soft puffs, wheels
  // that turn while it moves. It runs on the track west of the depot.
  const TRAIN =
    '<svg width="1000" height="300" viewBox="0 0 1000 300" aria-hidden="true">' +
    '<g class="steam">' + [0, 1, 2, 3, 4].map(function (i) { return '<circle class="puff p' + i + '" cx="84" cy="34" r="18"/>'; }).join('') + '</g>' +
    '<path fill="#241B16" d="M0 250 L44 196 L50 250 Z"/>' +
    '<rect x="44" y="130" width="214" height="84" rx="38" fill="#2B211C"/>' +
    '<path fill="#241B16" d="M66 128 L70 64 L58 50 L110 50 L98 64 L102 128 Z"/>' +
    '<rect x="150" y="110" width="40" height="26" rx="12" fill="#241B16"/>' +
    '<path fill="#241B16" d="M250 70 L370 70 L370 236 L250 236 Z"/><rect x="240" y="60" width="140" height="14" fill="#1A1310"/>' +
    '<rect x="276" y="96" width="40" height="40" fill="#E0A63F" opacity=".55"/>' +
    '<rect x="40" y="214" width="340" height="20" fill="#1A1310"/>' +
    '<rect x="380" y="216" width="22" height="8" fill="#1A1310"/><rect x="680" y="216" width="22" height="8" fill="#1A1310"/>' +
    [[390, 680], [700, 1000]].map(function (c, i) {
      let car = '<rect x="' + c[0] + '" y="206" width="' + (c[1] - c[0]) + '" height="22" fill="#2B211C"/>';
      for (let k = 0; k < 4; k += 1) {
        const bx = c[0] + 18 + k * 68;
        car += i ? '<rect x="' + bx + '" y="' + (150 + (k % 2) * 14) + '" width="56" height="' + (56 - (k % 2) * 14) + '" fill="#3A2E27"/>' :
          '<path fill="#33271F" d="M' + bx + ' 206 Q' + (bx - 6) + ' 178 ' + bx + ' 150 L' + (bx + 50) + ' 150 Q' + (bx + 56) + ' 178 ' + (bx + 50) + ' 206 Z"/>';
      }
      return car;
    }).join('') +
    [[90, 22], [184, 40], [272, 40], [430, 20], [640, 20], [740, 20], [960, 20]].map(function (w) {
      return '<g transform="translate(' + w[0] + ' ' + (268 - w[1]) + ')"><g class="wheel"><circle r="' + w[1] + '" fill="#1A1310"/>' +
        '<path stroke="#3A2E27" stroke-width="3" d="M-' + w[1] + ' 0 L' + w[1] + ' 0 M0 -' + w[1] + ' L0 ' + w[1] + '"/></g></g>';
    }).join('') +
    '</svg>';
  const STANDING = 180;
  const AWAY = -1400;

  // trainOut pulls away west from the platform; trainIn arrives and stops there. About four
  // seconds either way. stand() puts it at the platform before the player arrives.
  function train(stage) {
    const el = figure(stage.actors, TRAIN, 'train');
    stage.actors.insertBefore(el, stage.actors.firstChild);
    el.hidden = true;
    return {
      el: el,
      stand: function () {
        el.hidden = false;
        el.style.transform = 'translate3d(' + STANDING + 'px, 600px, 0)';
      },
      run: function (event, done) {
        const out = event === 'trainOut';
        el.hidden = false;
        el.classList.add('moving');
        const stop = function () {
          el.classList.remove('moving');
          if (out) el.hidden = true;
          if (done) done();
        };
        return glide(el, 600, out ? STANDING : AWAY, out ? AWAY : STANDING, quick(stage) ? 0 : 4000,
          out ? function (p) { return p * p; } : function (p) { return 1 - (1 - p) * (1 - p); }, stop);
      },
      remove: function () { el.remove(); }
    };
  }

  function make(parent) {
    const f = { x: 0, el: figure(parent, PLAYER, 'player'), facing: 1, trip: null };
    f.set = function (x) {
      f.x = x;
      f.el.style.transform = 'translate3d(' + (x - 55) + 'px, ' + (FEET - 180) + 'px, 0) scaleX(' + f.facing + ')';
    };
    return f;
  }

  const ease = function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };

  // Walks the player to a door; the camera follows and leads a little, and settles with the
  // door a third of the way across (ART 7). Long trips hurry so that none takes over six
  // seconds. finish() ends the trip at once, as any input does.
  function walk(f, stage, to, done) {
    const from = f.x;
    const camFrom = stage.x;
    const camTo = to - 640;
    const distance = Math.abs(to - from);
    const speed = Math.max(SPEED, distance / MAX_TRIP);
    const duration = distance / speed * 1000;
    f.facing = to < from ? -1 : 1;
    f.el.style.setProperty('--stride', (64 / speed) + 's');
    f.el.style.setProperty('--step', (32 / speed) + 's');
    f.el.classList.add('walking');
    let start = null;
    let over = false;
    const finish = function () {
      if (over) return;
      over = true;
      trip.over = true;
      f.trip = null;
      f.el.classList.remove('walking');
      f.set(to);
      stage.camera(camTo);
      done();
    };
    const tick = function (t) {
      if (over) return;
      if (start === null) start = t;
      const p = Math.min(1, (t - start) / duration);
      // Walk at a steady pace with soft ends; the camera eases and runs slightly ahead.
      const walked = p < 0.08 ? p * p / 0.16 : p > 0.92 ? 1 - (1 - p) * (1 - p) / 0.16 : p;
      f.set(from + (to - from) * Math.min(1, walked));
      stage.camera(camFrom + (camTo - camFrom) * ease(Math.min(1, p * 1.06)));
      if (p >= 1) finish();
      else requestAnimationFrame(tick);
    };
    const trip = { finish: finish, over: false };
    f.trip = trip;
    if (!distance || (B2B.debug && B2B.debug.instant)) {
      finish();
    } else if (stage.reduce) {
      // Reduced motion: a short fade cut instead of a walk (SPEC 6.3, 13).
      stage.cover.classList.add('on');
      setTimeout(function () {
        finish();
        stage.cover.classList.remove('on');
      }, 220);
    } else {
      requestAnimationFrame(tick);
    }
    return trip;
  }

  B2B.figures = { make: make, walk: walk, cast: cast, portrait: portrait, runner: runner, train: train, FEET: FEET };
})();
