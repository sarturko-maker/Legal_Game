// The director (SPEC 6.3): the only code that knows both the engine and the stage. For each
// view: travel, set the scene, present (lead, the runner if a telegram is brought, the prop,
// foot), wait, tell the engine, repeat.
(function () {
  const B2B = globalThis.B2B;
  // Where a cast member stands, by look: at the door of the place they belong to.
  const HOMES = { clerk: 'telegraph', lawyer: 'law', foreman: 'yard', engineer: 'yard', official: 'courthouse' };

  // hooks: onView(state, view) after each step; onEnding(state) when the player continues
  // past an ending; showPlace(id) on arrival.
  function make(stage, player, hooks) {
    const house = B2B.packs.house();
    const cast = B2B.packs.cast();
    const places = B2B.town.PLACES;
    let scenario = null;
    let state = null;
    let here = null;
    let faceDown = false;
    let token = 0;
    let busy = null;
    let extra = null;
    let current = null;
    let shown = [];
    let runner = null;
    let train = null;
    let figures = [];
    let fresh = true;

    const instant = function () { return Boolean(B2B.debug && B2B.debug.instant); };
    const quick = function () { return instant() || stage.reduce; };

    // Runs fn after ms, unless the deal has been restarted since.
    function later(fn, ms) {
      const t = token;
      const go = function () { if (t === token) fn(); };
      if (quick() || !ms) go();
      else setTimeout(go, ms);
    }

    function clearProps() {
      shown.forEach(function (p) { p.leave(); });
      shown = [];
      current = null;
      stage.scrim.classList.remove('on');
    }

    function show() {
      const view = B2B.engine.view(state);
      hooks.onView(state, view);
      const t = token;
      const steps = [travel, scene, event, lead, runIn, present];
      let i = 0;
      const next = function () {
        if (t !== token) return;
        busy = null;
        if (i < steps.length) steps[i++](view, next);
      };
      next();
    }

    // 1. Travel: walk to the place, or appear there at the start of a deal.
    function travel(view, next) {
      if (view.at === here) return next();
      if (here === 'depot') train.el.hidden = true;
      if (view.event === 'trainOut') train.stand();
      const x = places[view.at];
      const arrive = function () {
        here = view.at;
        hooks.showPlace(view.at);
        next();
      };
      if (here === null) {
        player.facing = 1;
        player.set(x);
        stage.camera(x - 640);
        return arrive();
      }
      // A moment on arrival to see where you are before the prop comes up.
      const t = token;
      busy = B2B.figures.walk(player, stage, x, function () {
        if (t !== token) return;
        here = view.at;
        hooks.showPlace(view.at);
        later(next, 700);
      });
    }

    // 2. Set the scene: the mood (instant at the start of a deal) and the week.
    function scene(view, next) {
      if (view.mood) stage.setMood(view.mood, fresh);
      fresh = false;
      hooks.week(view.week);
      next();
    }

    // The train leaves or arrives while the beat's prop is up. Input finishes it first.
    function event(view, next) {
      if (view.event) {
        if (view.event === 'trainOut' && train.el.hidden) train.stand();
        extra = train.run(view.event);
      }
      next();
    }

    // The lead comes first: it often says how long the answer took to come.
    function lead(view, next) {
      if (!view.lead || view.kind === 'choice' || view.kind === 'pick') return next();
      stage.scrim.classList.toggle('on', view.show !== 'note');
      shown.push(B2B.props.strip(stage.props, view.lead, 'lead'));
      later(next, 600);
    }

    // A telegram away from the telegraph office is brought by the runner (SPEC 6.3).
    function runIn(view, next) {
      if (view.show !== 'telegram' || view.to || view.at === 'telegraph') return next();
      const side = places[view.at] > places.telegraph ? -1 : 1;
      runner.waiting = true;
      busy = runner.in(player.x, side, next);
    }

    // 3 and 4. Present the prop between its lead and foot, and wait.
    function present(view, next) {
      stage.scrim.classList.toggle('on', view.show !== 'note');
      const t = token;
      if (view.kind === 'choice') {
        current = B2B.props.choice(stage.props, view, function (id) {
          if (t !== token) return;
          clearProps();
          state = B2B.engine.choose(state, id);
          show();
        });
        shown.push(current);
        return;
      }
      if (view.kind === 'pick') {
        current = B2B.props.pick(stage.props, view, { cast: cast }, function (ids) {
          if (t !== token) return;
          clearProps();
          state = B2B.engine.pick(state, ids);
          show();
        });
        shown.push(current);
        return;
      }
      const ctx = {
        house: house,
        cast: cast,
        turn: view.show === 'page' && view.face !== 'down' && faceDown,
        onComplete: function () {
          if (view.foot) shown.push(B2B.props.strip(stage.props, view.foot, 'foot'));
        }
      };
      if (view.show === 'page') faceDown = view.face === 'down' || (faceDown && !ctx.turn);
      current = B2B.props.show(stage.props, view, ctx, function () { done(view); });
      shown.push(current);
      next();
    }

    // 5. Tell the engine. An outgoing telegram is handed to the runner first; a runner who
    // brought one runs off again.
    function done(view) {
      const t = token;
      clearProps();
      const go = function () {
        if (t !== token) return;
        busy = null;
        if (view.kind === 'ending') hooks.onEnding(state, view);
        else {
          state = B2B.engine.advance(state);
          show();
        }
      };
      if (view.show === 'telegram' && view.to) {
        const side = places[view.at] > places.telegraph ? -1 : 1;
        let away = null;
        const coming = runner.in(player.x, side, function () { away = runner.out(true, go); });
        busy = {
          over: false,
          finish: function () {
            busy.over = true;
            coming.finish();
            if (away) away.finish();
          }
        };
        return;
      }
      if (runner.waiting) {
        runner.waiting = false;
        runner.out(false);
      }
      go();
    }

    function reset(sc) {
      token += 1;
      // A walk or a run still going ends now, so nothing moves after a restart.
      [player.trip, busy, extra].forEach(function (h) { if (h && !h.over) h.finish(); });
      clearProps();
      hooks.week(null);
      [runner, train].forEach(function (f) { if (f) f.remove(); });
      figures.forEach(function (f) { f.remove(); });
      figures = [];
      scenario = sc;
      here = null;
      faceDown = false;
      busy = null;
      extra = null;
      fresh = true;
      runner = B2B.figures.runner(stage);
      train = B2B.figures.train(stage);
      // The cast members this scenario uses stand at their doors, facing the player.
      const looks = {};
      Object.keys(sc.nodes).forEach(function (id) {
        const c = cast[sc.nodes[id].who];
        if (c && HOMES[c.look]) looks[c.look] = HOMES[c.look];
      });
      Object.keys(looks).forEach(function (look) {
        figures.push(B2B.figures.cast(stage.actors, look, places[looks[look]] + 150, -1));
      });
    }

    return {
      // Plays a scenario from its start.
      play: function (sc) {
        reset(sc);
        state = B2B.engine.start(sc, house);
        show();
      },
      // Plays a path instantly and shows where it ends: at a choice whose step the path does
      // not have, at an ending, or at the node until, if given (SPEC 12.3).
      jump: function (sc, path, until) {
        reset(sc);
        let st = B2B.engine.start(sc, house);
        let i = 0;
        for (;;) {
          const kind = B2B.engine.view(st).kind;
          if (st.nodeId === until || kind === 'ending') break;
          if (kind === 'beat') st = B2B.engine.advance(st);
          else if (i >= path.length) break;
          else if (kind === 'choice') st = B2B.engine.choose(st, path[i++]);
          else st = B2B.engine.pick(st, path[i++]);
        }
        state = st;
        show();
      },
      // Clears the stage: no prop, no runner, no train. Pending steps are dropped.
      stop: function () { reset(scenario || { nodes: {} }); },
      state: function () { return state; },
      // Input. Continue skips an animation first, then presses the prop.
      press: function () {
        if (busy && !busy.over) return busy.finish();
        if (extra && !extra.over) return extra.finish();
        if (current && current.press) current.press();
      },
      key: function (i) {
        if (current && current.key) current.key(i);
      },
      // A click on the stage itself skips a walk or a run; props take their own clicks.
      click: function () {
        if (busy && !busy.over) busy.finish();
        else if (extra && !extra.over) extra.finish();
      }
    };
  }

  B2B.director = { make: make };
})();
