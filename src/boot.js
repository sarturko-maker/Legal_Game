// Starts everything and runs the session (SPEC 4): title, set-up, each deal (intro card,
// the deal, the ledger screens), the year end. Also input, the menu, and with ?debug=1 the
// debug hooks (SPEC 12.3).
(function () {
  const B2B = globalThis.B2B;
  const debugOn = /[?&]debug=1\b/.test(location.search);
  // The debug hooks exist only with ?debug=1.
  if (debugOn) B2B.debug = { instant: false };
  const SAVED = 'back-to-back-setup';

  let stage;
  let player;
  let director;
  let menu;
  let overlay = null;
  let house;
  let all;
  let mode = null;
  let screen = null;
  const hud = {};
  let placeTimer = null;

  // The session (SPEC 5.3): the chosen scenarios, the options, the results so far. Only the
  // set-up options are remembered between visits (D8).
  const session = {
    scenarios: [],
    options: { ticked: [], large: false, walking: true },
    index: 0,
    deals: [],
    record: function () {
      const deals = session.deals.map(function (d) { return { id: d.id, path: d.path.slice(), result: d.result, net: d.net }; });
      return {
        packs: B2B.packs.loaded(),
        seed: null,
        deals: deals,
        total: deals.reduce(function (sum, d) { return sum + d.net; }, 0)
      };
    }
  };
  B2B.session = session;

  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(SAVED) || 'null');
      if (saved) Object.assign(session.options, saved);
    } catch (e) {
      // No storage (a private window, or blocked): the defaults stand.
    }
    session.options.ticked = session.options.ticked.filter(function (id) { return all.some(function (sc) { return sc.id === id; }); });
    if (!session.options.ticked.length) session.options.ticked = all.map(function (sc) { return sc.id; });
  }

  function save() {
    try {
      localStorage.setItem(SAVED, JSON.stringify(session.options));
    } catch (e) {
      // Not remembered this time; nothing else depends on it.
    }
  }

  function apply() {
    stage.el.classList.toggle('large', session.options.large);
    stage.walking = session.options.walking;
  }

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

  // Clears whatever is in front of the town, and puts the town behind the next screen.
  function backdrop(place, mood) {
    if (screen && screen.stop) screen.stop();
    screen = null;
    director.stop();
    hud.title.hidden = true;
    hud.place.classList.remove('on');
    week(null);
    player.facing = 1;
    player.set(B2B.town.PLACES[place]);
    stage.camera(B2B.town.PLACES[place] - 640);
    stage.setMood(mood, true);
    stage.scrim.classList.add('on');
  }

  function title() {
    backdrop('supply', 'dusk');
    mode = 'title';
    note('title');
    // Play: every scenario, with the default options (SPEC 4).
    screen = B2B.screens.title(stage.props, function () {
      startSession(all, { ticked: all.map(function (sc) { return sc.id; }), large: false, walking: true });
    }, setup);
  }

  function setup() {
    backdrop('supply', 'dusk');
    mode = 'setup';
    note('set up');
    screen = B2B.screens.setup(stage.props, all, session.options, function (options) {
      session.options = options;
      save();
      startSession(all.filter(function (sc) { return options.ticked.indexOf(sc.id) >= 0; }), options);
    });
  }

  function startSession(scenarios, options) {
    session.scenarios = scenarios;
    session.options = options;
    session.index = 0;
    session.deals = [];
    apply();
    intro();
  }

  // The intro card, over the town where the deal begins.
  function intro() {
    const sc = session.scenarios[session.index];
    const first = B2B.engine.view(B2B.engine.start(sc, house));
    backdrop(first.at, first.mood || 'day');
    mode = 'intro';
    note('intro card: ' + sc.id);
    screen = B2B.screens.intro(stage.props, session.index + 1, session.scenarios.length, sc.title, play);
  }

  function play() {
    const sc = session.scenarios[session.index];
    screen = null;
    mode = 'deal';
    hud.title.textContent = sc.title;
    hud.title.hidden = false;
    director.play(sc);
  }

  // Endings hold until the player continues, then the ledger, the what-ifs and the debrief.
  function ending(state, view) {
    const sc = session.scenarios[session.index];
    const result = B2B.engine.result(state);
    session.deals.push({ id: sc.id, title: sc.title, path: state.path, result: view.result, net: result.net });
    mode = 'ledger';
    // The deal is over: its title and week give way to the ledger's own heading.
    hud.title.hidden = true;
    week(null);
    stage.scrim.classList.add('on');
    note('ledger: ' + sc.id + ', ' + state.nodeId + '\nrecord ' + JSON.stringify(session.record()));
    const last = session.index + 1 >= session.scenarios.length;
    screen = B2B.ledger.show(stage.props, sc, result, house, nextDeal, last ? 'Year end' : 'Next deal');
  }

  function nextDeal() {
    session.index += 1;
    if (session.index < session.scenarios.length) intro();
    else yearEnd();
  }

  function yearEnd() {
    backdrop('supply', 'night');
    mode = 'yearend';
    const record = session.record();
    note('year end\nrecord ' + JSON.stringify(record));
    screen = B2B.screens.yearEnd(stage.props, session.deals, record.total, house, function () {
      startSession(session.scenarios, session.options);
    }, setup);
  }

  // Restart this deal: back to its intro card, forgetting its result if it had one.
  function restart() {
    session.deals = session.deals.slice(0, session.index);
    intro();
  }

  function skip() {
    session.deals = session.deals.slice(0, session.index);
    nextDeal();
  }

  // The menu's entries (SPEC 6.4). Those about a deal appear only during one.
  function actions() {
    const list = [];
    if (mode === 'intro' || mode === 'deal' || mode === 'ledger') {
      list.push({ label: 'Restart this deal', run: restart });
      list.push({ label: session.index + 1 < session.scenarios.length ? 'Skip to the next deal' : 'Skip to the year end', run: skip });
    }
    list.push({ label: 'Back to set up', run: setup });
    list.push({
      label: 'Text size: ' + (session.options.large ? 'large' : 'normal'),
      run: function () {
        session.options.large = !session.options.large;
        save();
        apply();
      }
    });
    return list;
  }

  function onView(state) {
    note('scenario ' + state.scenarioId + ', node ' + state.nodeId + '\nvars ' + JSON.stringify(state.vars));
  }

  // Input (SPEC 6.4). Continue: Space, Enter, Right arrow, or a click on the prop. 1 to 9
  // choose or toggle. Esc opens the menu. A focused control keeps Space and Enter for itself.
  function onKey(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      menu.toggle();
      return;
    }
    if (menu.open) return;
    const go = e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowRight';
    if (go && e.key !== 'ArrowRight' && e.target.closest && e.target.closest('button, input, label')) return;
    if (mode === 'deal' && /^[1-9]$/.test(e.key)) {
      director.key(Number(e.key) - 1);
      return;
    }
    if (!go) return;
    e.preventDefault();
    if (mode === 'deal') director.press();
    else if (screen && screen.press) screen.press();
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
    const find = function (id) { return all.find(function (s) { return s.id === id; }); };
    B2B.debug.overlay = function (on) { overlay.hidden = !on; };
    B2B.debug.player = player;
    // Replays a path instantly and shows where it ends (SPEC 12.3). until stops at a node.
    B2B.debug.jump = function (scenarioId, path, until) {
      menu.toggle(false);
      startSession([find(scenarioId)], session.options);
      screen.stop();
      screen = null;
      mode = 'deal';
      hud.title.textContent = find(scenarioId).title;
      hud.title.hidden = false;
      director.jump(find(scenarioId), path || [], until);
      return director.state().nodeId;
    };
    // Starts a session of the given scenarios at the first intro card.
    B2B.debug.session = function (ids, options) {
      startSession(ids.map(find), Object.assign({}, session.options, options || {}));
    };
    B2B.debug.screen = function (name) {
      if (name === 'title') title();
      if (name === 'setup') setup();
    };
    B2B.debug.record = function () { return session.record(); };
    B2B.debug.state = function () { return director.state(); };
    B2B.debug.mode = function () { return mode; };
    // The town with nothing in front of it, at a place and in a mood, for screenshots.
    B2B.debug.view = function (place, mood) {
      backdrop(place, mood);
      mode = null;
      stage.scrim.classList.remove('on');
    };
    // Average frame time during a real walk, in milliseconds.
    B2B.debug.walkFrameTime = function () {
      return new Promise(function (resolve) {
        B2B.debug.view('telegraph', 'day');
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
    all = B2B.packs.scenarios();
    stage = B2B.stage.mount(document.body, house, 'dusk');
    player = B2B.figures.make(stage.actors);
    ['title', 'week', 'place'].forEach(function (k) {
      hud[k] = document.createElement('div');
      hud[k].className = k;
      stage.hud.appendChild(hud[k]);
    });
    director = B2B.director.make(stage, player, { onView: onView, onEnding: ending, showPlace: showPlace, week: week });
    menu = B2B.screens.menu(stage, actions);
    load();
    apply();
    if (debugOn) debugHooks();
    addEventListener('keydown', onKey);
    stage.el.addEventListener('pointerdown', onPointer);
    title();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
