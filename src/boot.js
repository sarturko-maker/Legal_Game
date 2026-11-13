// Starts everything: the stage, the player, the director, the screens around a deal, input,
// and with ?debug=1 the debug hooks (SPEC 12.3). In M4 the session is one deal, scenario 1.
(function () {
  const B2B = globalThis.B2B;
  const debugOn = /[?&]debug=1\b/.test(location.search);
  // The debug hooks exist only with ?debug=1.
  if (debugOn) B2B.debug = { instant: false };

  let stage;
  let player;
  let director;
  let menu;
  let overlay = null;
  let house;
  let sc;
  let mode = null;
  let screen = null;
  const hud = {};
  let placeTimer = null;

  // The result record (SPEC 5.3). Version 1 shows it only in the debug overlay.
  B2B.session = {
    deals: [],
    record: function () {
      const deals = B2B.session.deals.map(function (d) { return Object.assign({}, d, { path: d.path.slice() }); });
      return {
        packs: B2B.packs.loaded(),
        seed: null,
        deals: deals,
        total: deals.reduce(function (sum, d) { return sum + d.net; }, 0)
      };
    }
  };

  function note(text) {
    if (overlay) overlay.textContent = text;
  }

  // The name of the location, bottom centre, for two seconds on arrival (SPEC 6.5).
  function showPlace(id) {
    hud.place.textContent = B2B.town.sign(id, house);
    hud.place.classList.add('on');
    clearTimeout(placeTimer);
    placeTimer = setTimeout(function () { hud.place.classList.remove('on'); }, 2000);
  }

  function week(n) {
    hud.week.hidden = n == null;
    if (n != null) hud.week.textContent = 'Week ' + n;
  }

  function stopScreen() {
    if (screen && screen.stop) screen.stop();
    screen = null;
  }

  // The intro card, over the town where the deal begins.
  function intro() {
    stopScreen();
    director.stop();
    B2B.session.deals = [];
    const first = B2B.engine.view(B2B.engine.start(sc, house));
    stage.setMood(first.mood || 'day', true);
    player.facing = 1;
    player.set(B2B.town.PLACES[first.at]);
    stage.camera(B2B.town.PLACES[first.at] - 640);
    hud.title.hidden = true;
    week(null);
    stage.scrim.classList.add('on');
    mode = 'intro';
    note('intro card: ' + sc.id);
    screen = B2B.screens.intro(stage.props, 1, 1, sc.title, play);
  }

  function play() {
    screen = null;
    mode = 'deal';
    hud.title.textContent = sc.title;
    hud.title.hidden = false;
    director.play(sc);
  }

  // Endings hold until the player continues, then the ledger, the what-ifs and the debrief.
  function ending(state, view) {
    const result = B2B.engine.result(state);
    B2B.session.deals.push({ id: sc.id, path: state.path, result: view.result, net: result.net });
    mode = 'ledger';
    stage.scrim.classList.add('on');
    note('ledger: ' + sc.id + ', ' + state.nodeId + '\nrecord ' + JSON.stringify(B2B.session.record()));
    screen = B2B.ledger.show(stage.props, sc, result, house, intro);
  }

  function onView(state, view) {
    note('scenario ' + state.scenarioId + ', node ' + state.nodeId + '\nvars ' + JSON.stringify(state.vars));
  }

  // Input (SPEC 6.4). Continue: Space, Enter, Right arrow, or a click on the prop. 1 to 9
  // choose. Esc opens the menu. A focused button keeps Space and Enter for itself.
  function onKey(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      menu.toggle();
      return;
    }
    if (menu.open) return;
    const go = e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowRight';
    if (go && e.key !== 'ArrowRight' && e.target.closest && e.target.closest('button')) return;
    if (mode === 'deal' && /^[1-9]$/.test(e.key)) {
      director.key(Number(e.key) - 1);
      return;
    }
    if (!go) return;
    e.preventDefault();
    if (mode === 'deal') director.press();
    else if (screen) screen.press();
  }

  // A click on the scene itself skips a walk, a run or the train.
  function onPointer(e) {
    if (menu.open && !e.target.closest('.menu, .menu-button')) menu.toggle(false);
    if (mode === 'deal' && !e.target.closest('.prop, .strip, button, .menu')) director.click();
  }

  function debugHooks() {
    overlay = document.createElement('div');
    overlay.className = 'debug';
    stage.el.appendChild(overlay);
    B2B.debug.overlay = function (on) { overlay.hidden = !on; };
    B2B.debug.player = player;
    // Replays a path instantly and shows where it ends (SPEC 12.3). until stops at a node.
    B2B.debug.jump = function (scenarioId, path, until) {
      menu.toggle(false);
      stopScreen();
      sc = B2B.packs.scenarios().find(function (s) { return s.id === scenarioId; });
      mode = 'deal';
      hud.title.textContent = sc.title;
      hud.title.hidden = false;
      director.jump(sc, path || [], until);
      return director.state().nodeId;
    };
    B2B.debug.state = function () { return director.state(); };
    // The town with nothing in front of it, at a place and in a mood, for screenshots.
    B2B.debug.view = function (place, mood) {
      stopScreen();
      director.stop();
      mode = null;
      stage.scrim.classList.remove('on');
      hud.place.classList.remove('on');
      player.set(B2B.town.PLACES[place]);
      stage.camera(B2B.town.PLACES[place] - 640);
      stage.setMood(mood, true);
    };
    B2B.debug.record = function () { return B2B.session.record(); };
    B2B.debug.mode = function () { return mode; };
    // Average frame time during a real walk, in milliseconds.
    B2B.debug.walkFrameTime = function () {
      return new Promise(function (resolve) {
        B2B.debug.jump('s1', [], 'po');
        director.stop();
        hud.place.classList.remove('on');
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
    const problems = B2B.packs.problems();
    if (problems.length) return B2B.screens.problems(problems);
    document.body.textContent = '';
    house = B2B.packs.house();
    sc = B2B.packs.scenarios().find(function (s) { return s.id === 's1'; });
    stage = B2B.stage.mount(document.body, house, 'day');
    player = B2B.figures.make(stage.actors);
    ['title', 'week', 'place'].forEach(function (k) {
      hud[k] = document.createElement('div');
      hud[k].className = k;
      stage.hud.appendChild(hud[k]);
    });
    director = B2B.director.make(stage, player, { onView: onView, onEnding: ending, showPlace: showPlace, week: week });
    menu = B2B.screens.menu(stage, [{ label: 'Restart this deal', run: intro }]);
    if (debugOn) debugHooks();
    addEventListener('keydown', onKey);
    stage.el.addEventListener('pointerdown', onPointer);
    intro();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
