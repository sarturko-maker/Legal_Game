// Starts everything. In M3 this is a fixed demonstration, not yet driven by the engine's
// choices: a telegram at the telegraph office, a walk to the supply company, the mood
// turning to dusk, and a two-option choice. The words come from scenario s1.
(function () {
  const B2B = globalThis.B2B;
  const debugOn = /[?&]debug=1\b/.test(location.search);
  // The debug hooks exist only with ?debug=1 (SPEC 12.3).
  if (debugOn) B2B.debug = { instant: false };
  const instant = function () { return Boolean(B2B.debug && B2B.debug.instant); };

  let stage;
  let player;
  let current = null;
  let place;
  let overlay;
  let timers = [];

  const later = function (fn, ms) { timers.push(setTimeout(fn, instant() ? 0 : ms)); };
  const clear = function () {
    timers.forEach(clearTimeout);
    timers = [];
  };

  function views() {
    const s1 = B2B.packs.scenarios().find(function (sc) { return sc.id === 's1'; });
    let state = B2B.engine.start(s1, B2B.packs.house());
    const po = { view: B2B.engine.view(state), state: state };
    while (state.nodeId !== 'c1') state = B2B.engine.advance(state);
    return { title: s1.title, po: po, c1: { view: B2B.engine.view(state), state: state } };
  }

  function show(step, state) {
    note(step + '\nscenario ' + state.scenarioId + ', node ' + state.nodeId + '\nvars ' + JSON.stringify(state.vars));
  }

  function showPlace(name) {
    place.textContent = name;
    place.classList.add('on');
    later(function () { place.classList.remove('on'); }, 2000);
  }

  function note(text) {
    if (overlay) overlay.textContent = text;
  }

  function clearProp() {
    if (current && current.leave) current.leave();
    current = null;
    stage.scrim.classList.remove('on');
  }

  const steps = {
    // The telegraph office in daylight, the player at its door.
    telegraphDay: function () {
      clear();
      clearProp();
      stage.setMood('day', true);
      player.facing = 1;
      player.el.classList.remove('walking');
      player.set(B2B.town.PLACES.telegraph);
      stage.camera(B2B.town.PLACES.telegraph - 640);
      showPlace((B2B.packs.house().telegraph || '').toUpperCase());
      note('demo: telegraph, day');
    },
    telegram: function () {
      const v = views();
      current = B2B.props.telegram(stage.props, v.po.view, B2B.packs.house(), function () {
        clearProp();
        steps.walk();
      });
      place.classList.remove('on');
      stage.scrim.classList.add('on');
      show('demo: telegram', v.po.state);
    },
    walk: function () {
      note('demo: walking to supply');
      current = { trip: B2B.figures.walk(player, stage, B2B.town.PLACES.supply, steps.arrive) };
    },
    arrive: function () {
      current = null;
      showPlace((B2B.packs.house().firm || '').toUpperCase());
      later(function () { stage.setMood('dusk'); note('demo: supply, dusk'); }, 400);
      later(steps.choice, 3200);
    },
    choice: function () {
      const v = views();
      place.classList.remove('on');
      stage.scrim.classList.add('on');
      current = B2B.props.choice(stage.props, v.c1.view, function (id) {
        note('demo: chose ' + id + '. Starting again.');
        clearProp();
        later(start, 1600);
      });
      show('demo: choice', v.c1.state);
    }
  };

  function start() {
    steps.telegraphDay();
    later(steps.telegram, 1600);
  }

  // Continue: Space, Enter, Right arrow, or a click (SPEC 6.4). 1 to 4 choose. Props take
  // their own clicks; a click on the stage only skips a walk.
  function onInput(e) {
    if (!current) return;
    if (current.trip) {
      current.trip.finish();
      return;
    }
    if (e.type === 'pointerdown') return;
    if (e.type === 'keydown' && /^[1-4]$/.test(e.key) && current.key) {
      current.key(Number(e.key) - 1);
      return;
    }
    const go = e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowRight';
    if (go && current.press) {
      e.preventDefault();
      current.press();
    }
  }

  // The debug hooks (SPEC 12.3). The M3 demonstration can be put in any of its states, so
  // that screenshots can be taken. jump() and record() arrive with the director in M4.
  function debugHooks() {
    overlay = document.createElement('div');
    overlay.className = 'debug';
    stage.el.appendChild(overlay);
    B2B.debug.overlay = function (on) { overlay.hidden = !on; };
    B2B.debug.scene = function (name) {
      B2B.debug.instant = true;
      start();
      clear();
      if (name === 'telegram') steps.telegram();
      if (name !== 'telegraph-day' && name !== 'supply-dusk') place.classList.remove('on');
      if (name === 'walk-mid') {
        player.set((B2B.town.PLACES.telegraph + B2B.town.PLACES.supply) / 2);
        player.el.classList.add('walking');
        stage.camera((B2B.town.PLACES.telegraph + B2B.town.PLACES.supply) / 2 - 700);
      }
      if (name === 'supply-dusk' || name === 'choice') {
        showPlace((B2B.packs.house().firm || '').toUpperCase());
        player.set(B2B.town.PLACES.supply);
        stage.camera(B2B.town.PLACES.supply - 640);
        stage.setMood('dusk', true);
      }
      if (name === 'choice') steps.choice();
      B2B.debug.instant = false;
      return name;
    };
    // Average frame time during a real walk, in milliseconds.
    B2B.debug.walkFrameTime = function () {
      return new Promise(function (resolve) {
        B2B.debug.scene('telegraph-day');
        const times = [];
        let last = null;
        let walking = true;
        const sample = function (t) {
          if (last !== null) times.push(t - last);
          last = t;
          if (walking) requestAnimationFrame(sample);
        };
        B2B.figures.walk(player, stage, B2B.town.PLACES.supply, function () {
          walking = false;
          const avg = times.reduce(function (a, b) { return a + b; }, 0) / times.length;
          resolve({ frames: times.length, averageMs: Math.round(avg * 100) / 100, worstMs: Math.round(Math.max.apply(null, times)) });
        });
        requestAnimationFrame(sample);
      });
    };
  }

  function boot() {
    document.body.textContent = '';
    stage = B2B.stage.mount(document.body, B2B.packs.house(), 'day');
    player = B2B.figures.make(stage.actors);
    const v = views();
    const title = document.createElement('div');
    title.className = 'title';
    title.textContent = v.title;
    stage.hud.appendChild(title);
    place = document.createElement('div');
    place.className = 'place';
    stage.hud.appendChild(place);
    if (debugOn) debugHooks();
    addEventListener('keydown', onInput);
    stage.el.addEventListener('pointerdown', onInput);
    start();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
