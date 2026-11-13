// The player and the cast (ART 6): flat silhouettes about 170 logical pixels tall, told
// apart by outline, never by face. The walk is a two-pose leg swing with the opposite arm,
// and a slight bob; standing, a slow breath.
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

  function figure(parent, svg) {
    const el = document.createElement('div');
    el.className = 'figure';
    el.innerHTML = svg;
    parent.appendChild(el);
    return el;
  }

  function make(parent) {
    const f = { x: 0, el: figure(parent, PLAYER), facing: 1, trip: null };
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
    f.trip = { finish: finish };
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
    return f.trip;
  }

  B2B.figures = { make: make, walk: walk, FEET: FEET };
})();
