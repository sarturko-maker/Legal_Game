// The stage (SPEC 6.1, ART 3): scaling to the window, the eight layers, the camera and the
// moods. A mood change builds the new world over the old one and fades it in, so only
// opacity is animated (ART 7).
(function () {
  const B2B = globalThis.B2B;
  const reduce = globalThis.matchMedia && globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const stage = { el: null, x: 0, mood: null, reduce: reduce };
  let skyWrap;
  let backs = [];
  let fronts = [];
  let actors;
  let house;

  function el(tag, cls, parent) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (parent) parent.appendChild(e);
    return e;
  }

  function fit() {
    const s = Math.min(innerWidth / 1920, innerHeight / 1080);
    const left = (innerWidth - 1920 * s) / 2;
    const top = (innerHeight - 1080 * s) / 2;
    stage.el.style.transform = 'translate(' + left + 'px, ' + top + 'px) scale(' + s + ')';
    stage.scale = s;
  }

  // One world is layers 1 to 5 (behind the figures) or layer 6 (in front), in one mood.
  function world(mood, ids, svgs) {
    const w = el('div', 'world mood-' + mood);
    // Keeps the gentle animations of two cross-fading worlds in step.
    w.style.setProperty('--phase', (-performance.now() / 1000) + 's');
    B2B.town.LAYERS.forEach(function (layer) {
      if (ids.indexOf(layer.id) < 0) return;
      const l = el('div', 'layer ' + layer.id, w);
      l.dataset.factor = layer.factor;
      l.style.width = (1920 + layer.factor * B2B.town.SPAN) + 'px';
      l.innerHTML = svgs[layer.id];
    });
    return w;
  }

  function place(layerEl) {
    layerEl.style.transform = 'translate3d(' + (-stage.x * Number(layerEl.dataset.factor)) + 'px, 0, 0)';
  }

  // Moves the camera: x is the left edge of the view on the street layer.
  stage.camera = function (x) {
    stage.x = Math.max(0, Math.min(B2B.town.SPAN, x));
    stage.el.querySelectorAll('.layer').forEach(place);
  };

  // Changes the mood. The sky and both world groups fade across in about 2.5 seconds.
  stage.setMood = function (mood, instant) {
    if (mood === stage.mood) return;
    stage.mood = mood;
    const svgs = B2B.town.draw(mood, house);
    const sky = el('div', 'sky-' + mood);
    const back = world(mood, ['l1', 'l2', 'l3', 'l4', 'l5'], svgs);
    const front = world(mood, ['l6'], svgs);
    const swap = function (list, fresh, before) {
      const old = list.slice();
      before.parentNode.insertBefore(fresh, before);
      list.push(fresh);
      return old;
    };
    const oldSky = Array.from(skyWrap.children);
    skyWrap.appendChild(sky);
    const oldBacks = swap(backs, back, actors);
    const oldFronts = swap(fronts, front, stage.atmos);
    [back, front].forEach(function (w) { w.querySelectorAll('.layer').forEach(place); });
    const gone = oldSky.concat(oldBacks, oldFronts);
    const finish = function () {
      gone.forEach(function (g) { g.remove(); });
      backs = backs.filter(function (b) { return gone.indexOf(b) < 0; });
      fronts = fronts.filter(function (f) { return gone.indexOf(f) < 0; });
    };
    if (instant || reduce || (B2B.debug && B2B.debug.instant) || !gone.length) {
      finish();
      return;
    }
    [sky, back, front].forEach(function (f) { f.style.opacity = 0; });
    void sky.offsetWidth;
    [sky, back, front].forEach(function (f) { f.style.opacity = 1; });
    setTimeout(finish, 2600);
  };

  // Dust motes: one small canvas, scaled up, so the motes are soft (ART 3, layer 7).
  function dust(canvas) {
    const ctx = canvas.getContext('2d');
    const motes = [];
    for (let i = 0; i < 46; i += 1) {
      motes.push({ x: (i * 97) % 480, y: 120 + (i * 53) % 150, r: 0.5 + (i % 3) * 0.35, v: 0.05 + (i % 5) * 0.02, p: i });
    }
    let last = 0;
    const draw = function (t) {
      ctx.clearRect(0, 0, 480, 270);
      motes.forEach(function (m) {
        const x = (m.x + t * m.v * 0.02) % 500 - 10;
        const y = m.y + Math.sin(t / 2400 + m.p) * 6;
        ctx.globalAlpha = 0.22 + 0.18 * Math.sin(t / 1700 + m.p);
        ctx.fillStyle = '#FFF2D6';
        ctx.beginPath();
        ctx.arc(x, y, m.r, 0, Math.PI * 2);
        ctx.fill();
      });
    };
    const loop = function (t) {
      // About 30 frames a second is plenty for dust.
      if (t - last > 33) {
        draw(t);
        last = t;
      }
      requestAnimationFrame(loop);
    };
    if (reduce) draw(0);
    else requestAnimationFrame(loop);
  }

  // The paper grain: one static SVG turbulence texture over the whole stage, never animated.
  function grain(parent) {
    parent.insertAdjacentHTML('beforeend',
      '<svg class="grain" xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" aria-hidden="true">' +
      '<filter id="grain"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" stitchTiles="stitch"/>' +
      '<feColorMatrix values="0 0 0 0 .2  0 0 0 0 .15  0 0 0 0 .1  0 0 0 1.6 -.3"/></filter>' +
      '<rect width="1920" height="1080" filter="url(#grain)"/></svg>');
  }

  stage.mount = function (parent, houseSettings, mood) {
    house = houseSettings;
    stage.el = el('div', '', parent);
    stage.el.id = 'stage';
    skyWrap = el('div', 'sky', stage.el);
    actors = el('div', 'actors', stage.el);
    stage.actors = el('div', 'layer actors-layer', actors);
    stage.actors.dataset.factor = 1;
    stage.actors.style.width = (1920 + B2B.town.SPAN) + 'px';
    stage.atmos = el('div', 'atmos', stage.el);
    const canvas = el('canvas', '', stage.atmos);
    canvas.width = 480;
    canvas.height = 270;
    el('div', 'vignette', stage.atmos);
    grain(stage.atmos);
    stage.scrim = el('div', 'scrim', stage.el);
    stage.hud = el('div', 'hud', stage.el);
    stage.props = el('div', 'props', stage.el);
    stage.cover = el('div', 'cover', stage.el);
    stage.setMood(mood || 'day', true);
    dust(canvas);
    fit();
    addEventListener('resize', fit);
    return stage;
  };

  B2B.stage = stage;
})();
