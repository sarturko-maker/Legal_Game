// Builds the street from data (ART 3 and 5). Each layer is one SVG string, coloured only
// through classes, so that the same drawing serves every mood: the mood is a class on the
// world that holds the layers.
(function () {
  const B2B = globalThis.B2B;
  const SPAN = 7680;
  const H = 1080;
  const GROUND = 830;

  // Parallax factors (ART 3). The width of a layer is 1920 + factor x 7,680.
  const LAYERS = [
    { id: 'l1', factor: 0.02 },
    { id: 'l2', factor: 0.08 },
    { id: 'l3', factor: 0.20 },
    { id: 'l4', factor: 0.45 },
    { id: 'l5', factor: 1.00 },
    { id: 'l6', factor: 1.40 }
  ];

  // Positions are the x of each door on the street layer (ART 5).
  const PLACES = { depot: 700, telegraph: 2000, supply: 3300, bank: 4300, law: 5200, courthouse: 6500, saloon: 7400, yard: 8700 };

  // Small, repeatable variety: the same street every time, without randomness.
  function vary(i, salt) {
    const s = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
    return s - Math.floor(s);
  }

  const n = function (v) { return Math.round(v * 10) / 10; };
  function rect(cls, x, y, w, h, extra) {
    return '<rect class="' + cls + '" x="' + n(x) + '" y="' + n(y) + '" width="' + n(w) + '" height="' + n(h) + '"' + (extra || '') + '/>';
  }
  function path(cls, d, extra) {
    return '<path class="' + cls + '" d="' + d + '"' + (extra || '') + '/>';
  }
  function svg(width, body, defs) {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + width + '" height="' + H + '" viewBox="0 0 ' + width +
      ' ' + H + '" aria-hidden="true"><defs>' + (defs || '') + '</defs>' + body + '</svg>';
  }
  function escape(text) {
    return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  }
  // Sign text in the display face, squeezed to fit its board when it is too long.
  function sign(text, cx, y, size, maxWidth) {
    const guess = text.length * size * 0.68;
    const fit = guess > maxWidth ? ' textLength="' + maxWidth + '" lengthAdjust="spacingAndGlyphs"' : '';
    return '<text class="signink" x="' + cx + '" y="' + y + '" font-size="' + size + '" text-anchor="middle"' + fit + '>' + escape(text) + '</text>';
  }

  // Layer 1: the sun or the moon, and a few long clouds. Low, fast cloud in a storm.
  function sky(mood) {
    const w = 1920 + 0.02 * SPAN;
    let body = '';
    if (mood === 'day') body += '<circle class="sun" cx="1520" cy="175" r="44"/>';
    if (mood === 'dusk') body += '<circle class="sun" cx="236" cy="640" r="74"/>';
    if (mood === 'dawn') body += '<circle class="sun" cx="1660" cy="560" r="64"/>';
    if (mood === 'night') {
      for (let i = 0; i < 90; i += 1) {
        body += '<circle class="star" cx="' + n(vary(i, 40) * w) + '" cy="' + n(vary(i, 41) * 520) + '" r="' + n(0.8 + vary(i, 42) * 1.6) + '"/>';
      }
      body += '<circle class="halo" cx="1540" cy="190" r="110"/><circle class="sun" cx="1540" cy="190" r="40"/>';
    }
    let clouds = '';
    const count = mood === 'storm' ? 12 : 7;
    for (let i = 0; i < count; i += 1) {
      const x = 120 + i * (mood === 'storm' ? 190 : 300) + vary(i, 1) * 120;
      const y = mood === 'storm' ? 160 + vary(i, 2) * 300 : 120 + vary(i, 2) * 260;
      const len = (mood === 'storm' ? 520 : 260) + vary(i, 3) * 320;
      const thick = mood === 'storm' ? 26 : 7;
      clouds += '<ellipse class="cloud" cx="' + n(x) + '" cy="' + n(y) + '" rx="' + n(len / 2) + '" ry="' + n(thick + vary(i, 4) * thick) + '"/>';
      clouds += '<ellipse class="cloud" cx="' + n(x + len * 0.18) + '" cy="' + n(y - thick) + '" rx="' + n(len / 4) + '" ry="' + n(thick * 0.8 + vary(i, 5) * 5) + '"/>';
    }
    body += '<g class="alive drift' + (mood === 'storm' ? ' fast' : '') + '">' + clouds + '</g>';
    return svg(w, body);
  }

  // Layer 2: a flat, pale range of mesas. One tone, with a slightly darker far shelf.
  function mesas(mood) {
    const w = 1920 + 0.08 * SPAN;
    let far = 'M0 700 ';
    let near = 'M0 720 ';
    let x = 0;
    for (let i = 0; x < w; i += 1) {
      const top = 560 + vary(i, 7) * 70;
      const width = 180 + vary(i, 8) * 260;
      far += 'L' + n(x + 40) + ' ' + n(top + 30) + ' L' + n(x + 70) + ' ' + n(top + 30) + ' L' + n(x + 90) + ' ' + n(top) +
        ' L' + n(x + width - 60) + ' ' + n(top) + ' L' + n(x + width - 30) + ' ' + n(top + 60) + ' L' + n(x + width) + ' 700 ';
      x += width + vary(i, 9) * 160;
    }
    x = 120;
    for (let i = 0; x < w; i += 1) {
      const top = 615 + vary(i, 10) * 50;
      const width = 220 + vary(i, 11) * 300;
      near += 'L' + n(x + 50) + ' ' + n(top) + ' L' + n(x + width - 50) + ' ' + n(top) + ' L' + n(x + width) + ' 720 ';
      x += width + 140 + vary(i, 12) * 260;
    }
    far += 'L' + w + ' 700 L' + w + ' 760 L0 760 Z';
    near += 'L' + w + ' 720 L' + w + ' 760 L0 760 Z';
    let shimmer = '';
    if (mood === 'day') {
      // Heat shimmer low on the horizon (ART 4, day).
      for (let i = 0; i < 9; i += 1) {
        shimmer += '<ellipse class="cloud alive shimmer" cx="' + n(140 + i * 270 + vary(i, 13) * 90) + '" cy="' + n(728 + vary(i, 14) * 18) +
          '" rx="' + n(90 + vary(i, 15) * 80) + '" ry="1.6" style="animation-delay: calc(var(--phase, 0s) - ' + (i * 0.7).toFixed(1) + 's)"/>';
      }
    }
    return svg(w, path('mesa2', far) + path('mesa', near) + shimmer);
  }

  // Layer 3: rolling hills, a windmill, the railway line and telegraph poles running east.
  function hills() {
    const w = 1920 + 0.20 * SPAN;
    let d = 'M0 760 ';
    for (let x = 0; x <= w; x += 120) {
      d += 'L' + x + ' ' + n(708 + Math.sin(x / 410) * 22 + Math.sin(x / 157) * 7) + ' ';
    }
    d += 'L' + w + ' 900 L0 900 Z';
    let body = path('hill', d);
    // The railway: an embankment line with poles beside it, running off to the east.
    body += path('hill2-line', 'M0 744 L' + w + ' 732', ' stroke-width="4"');
    let wire = 'M0 708 ';
    for (let x = 40; x < w; x += 170) {
      body += rect('hill2', x, 704, 3, 40) + rect('hill2', x - 7, 708, 17, 2);
      wire += 'Q' + (x - 85) + ' 716 ' + x + ' 708 ';
    }
    body += path('hill2-line', wire, ' stroke-width="1.2"');
    // The windmill, with turning blades.
    const wx = 1372;
    body += path('hill2', 'M' + (wx - 22) + ' 735 L' + (wx - 4) + ' 610 L' + (wx + 4) + ' 610 L' + (wx + 22) + ' 735 Z');
    body += rect('hill2', wx - 2, 600, 30, 8) + path('hill2', 'M' + (wx + 26) + ' 596 L' + (wx + 46) + ' 588 L' + (wx + 46) + ' 618 L' + (wx + 26) + ' 610 Z');
    let blades = '';
    for (let i = 0; i < 12; i += 1) {
      blades += '<rect class="hill2" x="-2" y="-38" width="5" height="34" transform="rotate(' + i * 30 + ')"/>';
    }
    body += '<g transform="translate(' + wx + ' 604)"><g class="alive blades">' + blades + '<circle class="hill2" r="6"/></g></g>';
    return svg(w, body);
  }

  // Layer 4: the back row. Rooftops, a church spire, the water tower, washing lines. Two tones.
  function backRow() {
    const w = 1920 + 0.45 * SPAN;
    let body = '';
    let x = 0;
    const tops = [];
    for (let i = 0; x < w; i += 1) {
      const width = 120 + vary(i, 20) * 150;
      const top = 600 + vary(i, 21) * 90;
      if (vary(i, 22) < 0.5) {
        body += path('back', 'M' + n(x) + ' ' + GROUND + ' L' + n(x) + ' ' + n(top + 30) + ' L' + n(x + width / 2) + ' ' + n(top - 25) +
          ' L' + n(x + width) + ' ' + n(top + 30) + ' L' + n(x + width) + ' ' + GROUND + ' Z');
      } else {
        body += rect('back', x, top, width, GROUND - top) + rect('back2', x - 4, top, width + 8, 8);
      }
      for (let k = 0; k < 2; k += 1) {
        body += rect('back2', x + 22 + k * (width - 64), top + 52, 20, 30);
      }
      tops.push([x, width, top]);
      x += width + 8 + vary(i, 23) * 60;
    }
    // The church spire, behind the telegraph office.
    const cx = 1380;
    body += rect('back', cx - 50, 560, 100, 270) + path('back', 'M' + (cx - 50) + ' 560 L' + cx + ' 520 L' + (cx + 50) + ' 560 Z');
    body += rect('back', cx - 20, 450, 40, 80) + path('back', 'M' + (cx - 24) + ' 452 L' + cx + ' 330 L' + (cx + 24) + ' 452 Z');
    body += rect('back2', cx - 2, 300, 4, 34) + rect('back2', cx - 12, 310, 24, 4) + rect('back2', cx - 9, 470, 18, 30);
    // The water tower.
    const tx = 2500;
    body += rect('back2', tx - 70, 470, 140, 110) + path('back2', 'M' + (tx - 80) + ' 472 L' + tx + ' 430 L' + (tx + 80) + ' 472 Z');
    body += path('back2-line', 'M' + (tx - 60) + ' 580 L' + (tx - 70) + ' 830 M' + (tx + 60) + ' 580 L' + (tx + 70) + ' 830 M' + (tx - 64) + ' 640 L' + (tx + 64) + ' 700 M' + (tx + 64) + ' 640 L' + (tx - 64) + ' 700', ' stroke-width="7"');
    // Washing lines between two roofs, with a few things pegged out.
    [[900, 1080], [3150, 3330]].forEach(function (span, i) {
      const y = 640 + i * 20;
      body += path('back2-line', 'M' + span[0] + ' ' + y + ' Q' + (span[0] + span[1]) / 2 + ' ' + (y + 26) + ' ' + span[1] + ' ' + y, ' stroke-width="2"');
      for (let k = 1; k < 5; k += 1) {
        const px = span[0] + k * (span[1] - span[0]) / 5;
        const sag = y + Math.sin(Math.PI * k / 5) * 22;
        body += rect('back2', px - 12, sag, 24, 22 + (k % 2) * 12);
      }
    });
    return svg(w, body);
  }

  // A Western false front: tall flat facade with a sign, a porch roof on posts, a door.
  function falseFront(o) {
    const x0 = o.door - o.width / 2;
    const x1 = o.door + o.width / 2;
    let s = '';
    // The side of the building behind the false front, lower, with a pitched roof.
    s += path('wood2', 'M' + (x1 - 20) + ' ' + (o.top + 90) + ' L' + (x1 + 70) + ' ' + (o.top + 130) + ' L' + (x1 + 70) + ' ' + GROUND + ' L' + (x1 - 20) + ' ' + GROUND + ' Z');
    s += rect('wood', x0, o.top, o.width, GROUND - o.top);
    // Clapboard: a few darker lines, and the rim light of a low western sun at dusk.
    for (let y = o.top + 26; y < GROUND - 160; y += 26) s += rect('wood3', x0, y, o.width, 3);
    s += rect('rim', x0, o.top, 6, GROUND - o.top);
    // Cornice and the stepped parapet.
    s += rect('wood2', x0 - 12, o.top - 4, o.width + 24, 16);
    s += rect('wood2', o.door - o.width * 0.22, o.top - 34, o.width * 0.44, 34);
    s += rect('wood2', o.door - o.width * 0.12, o.top - 52, o.width * 0.24, 20);
    // The sign board.
    s += rect('wood2', x0 + 26, o.signY - 6, o.width - 52, o.signH + 12);
    s += rect('signboard', x0 + 32, o.signY, o.width - 64, o.signH);
    s += sign(o.sign, o.door, o.signY + o.signH * 0.72, o.signSize, o.width - 100);
    // Upstairs windows.
    const up = o.upstairs || 2;
    for (let i = 0; i < up; i += 1) {
      const wx = x0 + (i + 0.5) * o.width / up - 34;
      s += rect('wood2', wx - 6, 556, 80, 108) + rect('win', wx, 562, 68, 96) + rect('wood2', wx + 32, 562, 4, 96) + rect('wood2', wx, 606, 68, 4);
      if (o.shutters) s += rect('sage', wx - 30, 558, 22, 104) + rect('sage', wx + 76, 558, 22, 104);
    }
    // The porch roof and its posts.
    s += path('wood2', 'M' + (x0 - 30) + ' 676 L' + (x1 + 30) + ' 676 L' + (x1 + 30) + ' 694 L' + (x0 - 30) + ' 694 Z');
    s += rect('wood2', x0 - 18, 694, 12, GROUND - 694) + rect('wood2', x1 + 6, 694, 12, GROUND - 694);
    // The door, and the ground-floor windows either side.
    s += rect('wood2', o.door - 46, 714, 92, GROUND - 714) + rect('win', o.door - 38, 722, 76, 50) + rect('wood3', o.door - 38, 778, 76, GROUND - 778);
    return s;
  }

  // A boardwalk under a run of fronts, with its shadow and steps.
  function boardwalk(x0, x1) {
    let t = rect('shade', x0 - 20, GROUND + 22, x1 - x0 + 60, 26);
    t += rect('walk', x0, GROUND - 2, x1 - x0, 22) + rect('wood2', x0, GROUND + 18, x1 - x0, 6);
    for (let x = x0 + 30; x < x1; x += 120) t += rect('wood2', x, GROUND + 24, 8, 14);
    return t;
  }

  // At dawn the low sun in the east throws long shadows west across the street.
  function longShadow(x0, x1) {
    return path('longshadow', 'M' + x0 + ' ' + GROUND + ' L' + x1 + ' ' + GROUND + ' L' + (x1 - 300) + ' 905 L' + (x0 - 300) + ' 905 Z');
  }

  // A hanging sign on a bracket that swings a little (hard, in a storm).
  function shingle(x, y, emblem) {
    return rect('wood2', x - 30, y - 6, 60, 6) + '<g transform="translate(' + x + ' ' + y + ')"><g class="alive swing">' +
      rect('wood2', -2, 0, 4, 22) + rect('wood2', -42, 20, 84, 56) + rect('signboard', -36, 26, 72, 44) +
      path('signink', emblem) + '</g></g>';
  }
  const EMBLEMS = {
    anvil: 'M-26 42 L18 42 L26 36 L28 46 L14 48 L10 58 L16 66 L-16 66 L-10 58 L-14 48 L-26 48 Z',
    scales: 'M-1 32 L1 32 L1 62 L10 62 L10 66 L-10 66 L-10 62 L-1 62 Z M-24 38 L24 38 L24 40 L-24 40 Z M-30 52 Q-22 60 -14 52 Z M14 52 Q22 60 30 52 Z M-23 40 L-29 52 L-28 52 L-22 41 L-16 52 L-15 52 Z M23 40 L17 52 L18 52 L23 42 L28 52 L30 52 Z',
    lantern: 'M-8 34 L8 34 L10 40 L10 60 L8 66 L-8 66 L-10 60 L-10 40 Z'
  };

  function streetLamp(x) {
    return rect('wood2', x, 600, 10, 230) + rect('wood2', x - 14, 584, 38, 30) +
      '<circle class="lampglow alive flicker" cx="' + (x + 5) + '" cy="600" r="120" fill="url(#lamp)"/>' + rect('win', x - 6, 590, 22, 18);
  }

  function fence(x0, x1) {
    let t = '';
    for (let x = x0; x < x1; x += 70) t += rect('wood2', x, 760, 10, 70);
    return t + rect('wood2', x0, 772, x1 - x0, 8) + rect('wood2', x0, 800, x1 - x0, 8);
  }

  function track(x0, x1) {
    let t = rect('wood2', x0, 858, x1 - x0, 5) + rect('wood2', x0, 872, x1 - x0, 5);
    for (let x = x0 + 6; x < x1; x += 34) t += rect('wood2', x, 855, 10, 26);
    return t;
  }

  // Stone fronts, for the bank and the courthouse.
  function stoneFront(x0, x1, top) {
    let t = rect('stone', x0, top, x1 - x0, GROUND - top) + rect('rim', x0, top, 6, GROUND - top);
    for (let y = top + 40; y < GROUND; y += 40) t += rect('stone2', x0, y, x1 - x0, 2);
    t += rect('stone2', x0 - 14, top - 18, x1 - x0 + 28, 20);
    for (let x = x0 - 10; x < x1 + 10; x += 22) t += rect('stone2', x, top + 2, 12, 10);
    return t;
  }

  // Layer 5: the street, west to east (ART 5): depot, telegraph office, supply company,
  // bank, law office, courthouse, saloon and stable, and the site office at the yard.
  function street(house, mood) {
    const w = 1920 + SPAN;
    let s = rect('ground', 0, GROUND, w, H - GROUND) + rect('ground2', 0, 1010, w, 70);
    for (let i = 0; i < 18; i += 1) {
      s += '<ellipse class="ground2" cx="' + n(i * 560 + vary(i, 30) * 200) + '" cy="' + n(930 + vary(i, 31) * 90) + '" rx="' + n(160 + vary(i, 32) * 200) + '" ry="4"/>';
    }

    // The town's name on a post at the west end, by the track.
    s += rect('wood2', 236, 700, 12, 130) + rect('wood2', 150, 690, 190, 54) + rect('signboard', 156, 696, 178, 42) +
      sign((house.town || '').toUpperCase(), 245, 727, 24, 160);

    // The depot: a low station with a deep canopy over the platform, a signal, and the track
    // running off to the west. A pennant on the roof moves in the wind.
    const dp = PLACES.depot;
    s += longShadow(dp - 240, dp + 240);
    s += track(0, 1500);
    s += path('wood2', 'M' + (dp - 270) + ' 604 L' + dp + ' 520 L' + (dp + 270) + ' 604 Z');
    s += rect('wood', dp - 240, 600, 480, 230);
    for (let y = 626; y < 830; y += 26) s += rect('wood3', dp - 240, y, 480, 3);
    s += rect('rim', dp - 240, 600, 6, 230);
    s += rect('wood2', dp - 2, 456, 4, 70);
    s += '<g transform="translate(' + (dp + 2) + ' 458)"><path class="flag alive wave" d="M0 0 L46 9 L0 20 Z"/></g>';
    s += rect('wood2', dp - 120, 714, 86, 116) + rect('win', dp - 112, 722, 70, 50);
    s += rect('wood2', dp + 30, 714, 86, 116) + rect('win', dp + 38, 722, 70, 50);
    s += rect('win', dp - 210, 712, 70, 70) + rect('win', dp + 150, 712, 70, 70);
    s += path('wood2', 'M' + (dp - 360) + ' 662 L' + (dp + 360) + ' 662 L' + (dp + 380) + ' 686 L' + (dp - 380) + ' 686 Z');
    [-340, -110, 110, 340].forEach(function (dx) { s += rect('wood2', dp + dx - 6, 686, 12, GROUND - 686); });
    s += rect('wood2', dp - 100, 610, 200, 52) + rect('signboard', dp - 94, 616, 188, 40) + sign(signFor('depot', house), dp, 648, 34, 170);
    s += boardwalk(dp - 420, dp + 440);
    s += rect('wood2', dp + 470, 500, 12, 330) + rect('wood2', dp + 482, 506, 70, 12) + rect('win', dp + 460, 530, 32, 32);
    s += '<circle class="lampglow" cx="' + (dp + 476) + '" cy="546" r="70" fill="url(#lamp)"/>';

    // The telegraph office, with a stovepipe that smokes.
    const tg = { door: PLACES.telegraph, width: 460, top: 420, signY: 446, signH: 70, signSize: 40,
      sign: signFor('telegraph', house) };
    s += longShadow(tg.door - 230, tg.door + 230);
    s += rect('wood2', tg.door - 158, 340, 14, 90) + rect('wood2', tg.door - 162, 336, 22, 8);
    s += '<g transform="translate(' + (tg.door - 151) + ' 330)">' + ['s1', 's2', 's3', 's4', 's5'].map(function (k) {
      return '<circle class="smokepuff alive smoke ' + k + '" r="11"/>';
    }).join('') + '</g>';
    s += falseFront(tg);
    s += rect('win', tg.door - 196, 722, 110, 76) + rect('wood2', tg.door - 143, 722, 4, 76);
    s += rect('win', tg.door + 86, 722, 110, 76) + rect('wood2', tg.door + 139, 722, 4, 76);
    s += boardwalk(tg.door - 270, tg.door + 270);

    // Telegraph poles and the wire running east past the supply company, with birds on it.
    const poles = [tg.door + 270, 2880, 3900];
    poles.forEach(function (px) {
      s += rect('wood2', px - 7, 360, 14, GROUND - 360) + rect('wood2', px - 46, 384, 92, 10) + rect('wood2', px - 40, 376, 6, 10) + rect('wood2', px + 34, 376, 6, 10);
    });
    let wire = 'M' + (tg.door + 230) + ' 378 ';
    poles.slice(1).forEach(function (px, i) {
      wire += 'Q' + ((poles[i] + px) / 2) + ' 430 ' + (px - 40) + ' 378 ';
    });
    s += path('wire', wire) + path('wire', wire.replace(/M(\d+) 378/, function (m, x) { return 'M' + (Number(x) + 74) + ' 378'; }));
    [[2480, 0], [2530, 1], [2610, 2]].forEach(function (b) {
      const y = 407 - Math.abs(2575 - b[0]) * 0.05 - 8;
      s += '<g transform="translate(' + b[0] + ' ' + n(y) + ')"><g class="' + (b[1] === 1 ? 'alive hop' : '') + '">' +
        path('wood2', 'M0 0 C4 -10 14 -10 16 -2 L22 -6 L20 2 C14 8 4 8 0 0 Z') + '</g></g>';
    });

    // The alley: a water trough and a street lamp.
    s += rect('wood2', 2420, 800, 150, 34) + rect('wood3', 2420, 800, 150, 6) + rect('wood2', 2428, 834, 10, 14) + rect('wood2', 2552, 834, 10, 14);
    s += streetLamp(2700);
    s += rect('wood2', 1560, 740, 14, 90) + rect('wood2', 1546, 740, 50, 14) + rect('wood2', 1574, 744, 30, 8);

    // The supply company: the biggest sign on the street, shutters, a counter in the window,
    // and a hanging shingle that swings.
    const sp = { door: PLACES.supply, width: 700, top: 360, signY: 392, signH: 96, signSize: 58,
      sign: signFor('supply', house), upstairs: 3, shutters: true };
    s += longShadow(sp.door - 350, sp.door + 350);
    s += falseFront(sp);
    const win = function (x0, counter) {
      let t = rect('wood2', x0 - 8, 708, 236, 104) + rect('win', x0, 716, 220, 88);
      t += '<circle class="lampglow" cx="' + (x0 + 110) + '" cy="744" r="70" fill="url(#lamp)"/>';
      // Shelves of stock behind, and the counter in front.
      for (let k = 0; k < 2; k += 1) {
        const y = 736 + k * 22;
        t += rect('wood2', x0 + 8, y, 204, 3);
        for (let j = 0; j < 9; j += 1) t += rect('wood2', x0 + 14 + j * 22, y - 10 - (j % 3) * 2, 10, 10 + (j % 3) * 2);
      }
      t += counter ? rect('wood2', x0, 778, 220, 26) + rect('wood3', x0 - 4, 774, 228, 5) : rect('wood2', x0 + 20, 776, 40, 28) + rect('wood2', x0 + 150, 770, 50, 34);
      t += rect('wood2', x0 + 108, 716, 4, 88) + rect('wood2', x0, 758, 220, 3);
      return t;
    };
    s += win(sp.door - 330, true) + win(sp.door + 110, false);
    s += boardwalk(sp.door - 390, sp.door + 390);
    s += rect('wood2', sp.door - 250, 846, 12, 60) + rect('wood2', sp.door - 90, 846, 12, 60) + rect('wood2', sp.door - 258, 852, 180, 9);
    s += shingle(sp.door + 300, 700, EMBLEMS.anvil);
    s += fence(3820, 4080);

    // The bank: scenery in version 1, placed for a later scenario. Stone, barred windows, and
    // a lantern on a bracket.
    const bk = PLACES.bank;
    s += longShadow(bk - 190, bk + 190);
    s += stoneFront(bk - 190, bk + 190, 470);
    s += rect('stone2', bk - 120, 496, 240, 62) + rect('signboard', bk - 112, 502, 224, 50) + sign('BANK', bk, 541, 40, 200);
    s += path('wood2', 'M' + (bk - 44) + ' ' + GROUND + ' L' + (bk - 44) + ' 720 Q' + bk + ' 676 ' + (bk + 44) + ' 720 L' + (bk + 44) + ' ' + GROUND + ' Z');
    [-150, 70].forEach(function (dx) {
      s += rect('win', bk + dx, 600, 80, 130);
      for (let k = 1; k < 4; k += 1) s += rect('stone2', bk + dx + k * 20 - 2, 600, 4, 130);
    });
    s += rect('stone2', bk - 200, 790, 400, 40);
    s += shingle(bk + 150, 744, EMBLEMS.lantern);
    s += rect('wood2', 4560, 760, 60, 70) + path('wood2', 'M4550 760 L4590 730 L4630 760 Z');
    s += streetLamp(4820);

    // The law office: a narrow two-storey front, shelves of books in the window.
    const lw = { door: PLACES.law, width: 330, top: 440, signY: 464, signH: 64, signSize: 34, sign: signFor('law', house), upstairs: 1 };
    s += longShadow(lw.door - 165, lw.door + 165);
    s += falseFront(lw);
    s += rect('wood2', lw.door - 156, 712, 92, 92) + rect('win', lw.door - 150, 718, 80, 80);
    s += '<circle class="lampglow" cx="' + (lw.door - 110) + '" cy="752" r="64" fill="url(#lamp)"/>';
    for (let k = 0; k < 3; k += 1) {
      const y = 738 + k * 24;
      s += rect('wood2', lw.door - 150, y, 80, 3);
      for (let j = 0; j < 9; j += 1) s += rect(j % 2 ? 'wood2' : 'wood3', lw.door - 148 + j * 8.6, y - 16 + (j % 3) * 2, 6, 16 - (j % 3) * 2);
    }
    s += boardwalk(lw.door - 200, lw.door + 200);
    s += shingle(lw.door + 128, 700, EMBLEMS.scales);
    s += rect('wood2', 5560, 800, 150, 34) + rect('wood3', 5560, 800, 150, 6);
    s += streetLamp(5900);

    // The courthouse: the only building with columns and a flag.
    const ch = PLACES.courthouse;
    s += longShadow(ch - 330, ch + 330);
    s += stoneFront(ch - 330, ch + 330, 470);
    s += path('stone', 'M' + (ch - 350) + ' 452 L' + ch + ' 360 L' + (ch + 350) + ' 452 Z') + rect('stone2', ch - 350, 450, 700, 10);
    s += rect('stone2', ch - 2, 250, 4, 120);
    s += '<g transform="translate(' + (ch + 2) + ' 254)"><path class="flag alive wave" d="M0 0 L72 4 L70 44 L0 40 Z"/></g>';
    s += rect('stone2', ch - 200, 484, 400, 56) + rect('signboard', ch - 192, 490, 384, 44) + sign(signFor('courthouse', house), ch, 524, 34, 350);
    [-250, -120, 120, 250].forEach(function (dx) {
      s += rect('stone3', ch + dx - 22, 560, 44, 226) + rect('stone2', ch + dx - 30, 552, 60, 12) + rect('stone2', ch + dx - 30, 782, 60, 10);
    });
    s += rect('win', ch - 52, 640, 104, 150) + rect('stone2', ch - 2, 640, 4, 150);
    [0, 1, 2].forEach(function (k) { s += rect('stone2', ch - 300 + k * 14, 792 + k * 13, 600 - k * 28, 13); });
    s += rect('wood2', ch + 360, 690, 140, 110) + rect('signboard', ch + 366, 696, 128, 98);
    for (let k = 0; k < 4; k += 1) s += rect('paperbit', ch + 376 + (k % 2) * 58, 704 + Math.floor(k / 2) * 44, 48, 36);
    s += rect('wood2', ch + 380, 800, 10, 30) + rect('wood2', ch + 470, 800, 10, 30);

    // The saloon and the stable: scenery. A lantern flickers; the stable's hoist swings.
    const sl = { door: 7280, width: 360, top: 450, signY: 474, signH: 64, signSize: 40, sign: 'SALOON', upstairs: 2 };
    s += longShadow(sl.door - 180, sl.door + 180);
    s += falseFront(sl);
    s += rect('wood2', sl.door - 200, 650, 400, 6);
    for (let x = sl.door - 196; x < sl.door + 200; x += 26) s += rect('wood2', x, 626, 5, 28);
    s += rect('wood3', sl.door - 40, 740, 38, 54) + rect('wood3', sl.door + 2, 740, 38, 54);
    s += rect('win', sl.door - 160, 724, 90, 70) + rect('win', sl.door + 70, 724, 90, 70);
    s += '<circle class="lampglow alive flicker" cx="' + sl.door + '" cy="760" r="90" fill="url(#lamp)"/>';
    s += boardwalk(sl.door - 200, sl.door + 200);
    const st = 7700;
    s += longShadow(st - 170, st + 170);
    s += path('wood', 'M' + (st - 170) + ' ' + GROUND + ' L' + (st - 170) + ' 600 L' + (st - 120) + ' 520 L' + st + ' 480 L' + (st + 120) + ' 520 L' + (st + 170) + ' 600 L' + (st + 170) + ' ' + GROUND + ' Z');
    s += rect('wood2', st - 70, 660, 140, 170) + path('wood3', 'M' + (st - 66) + ' 664 L' + (st + 66) + ' 826 L' + (st + 60) + ' 826 L' + (st - 66) + ' 672 Z');
    s += path('wood3', 'M' + (st + 66) + ' 664 L' + (st - 66) + ' 826 L' + (st - 60) + ' 826 L' + (st + 66) + ' 672 Z');
    s += rect('win', st - 34, 540, 68, 70) + rect('wood2', st - 4, 500, 8, 30);
    s += '<g transform="translate(' + st + ' 528)"><g class="alive swing">' + rect('wood2', -1, 0, 2, 70) + rect('wood2', -8, 68, 16, 12) + '</g></g>';
    s += rect('wood2', st - 120, 610, 240, 34) + rect('signboard', st - 114, 614, 228, 26) + sign('LIVERY', st, 636, 22, 200);
    s += fence(7900, 8480);

    // The yard: the site office, a derrick whose boom turns a little, cable drums, and track
    // being laid east.
    const yd = PLACES.yard;
    s += track(8300, 9300);
    for (let x = 9310; x < 9560; x += 34) s += rect('wood2', x, 855, 10, 26);
    s += rect('wood2', 9380, 818, 160, 10) + rect('wood2', 9392, 806, 140, 10);
    s += longShadow(yd - 130, yd + 130);
    s += path('wood2', 'M' + (yd - 140) + ' 630 L' + (yd + 150) + ' 600 L' + (yd + 150) + ' 620 L' + (yd - 140) + ' 650 Z');
    s += rect('wood', yd - 130, 636, 260, 194);
    for (let y = 660; y < 830; y += 24) s += rect('wood3', yd - 130, y, 260, 3);
    s += rect('wood2', yd - 116, 664, 232, 46) + rect('signboard', yd - 110, 670, 220, 34) + sign(signFor('yard', house), yd, 696, 26, 200);
    s += rect('wood2', yd - 40, 724, 80, 106) + rect('win', yd + 64, 730, 50, 46);
    s += rect('wood2', yd - 150, 826, 300, 10);
    const dx = 9080;
    s += path('wood2', 'M' + (dx - 70) + ' 830 L' + (dx - 6) + ' 520 L' + (dx + 6) + ' 520 L' + (dx + 70) + ' 830 L' + (dx + 56) + ' 830 L' + dx + ' 560 L' + (dx - 56) + ' 830 Z');
    s += rect('wood2', dx - 50, 700, 100, 8);
    s += '<g transform="translate(' + dx + ' 540)"><g class="alive boom">' + rect('wood2', -10, -6, 190, 12) + rect('wood2', 172, 0, 2, 110) +
      path('wood2', 'M166 110 L180 110 L180 122 Q173 132 166 122 Z') + '</g></g>';
    [[8880, 790], [8964, 790], [8922, 718]].forEach(function (d) {
      s += '<circle class="wood2" cx="' + d[0] + '" cy="' + d[1] + '" r="40"/><circle class="wood3" cx="' + d[0] + '" cy="' + d[1] + '" r="16"/>';
    });
    // A storm: dust gusts low over the street, and a tumbleweed rolling past each stop.
    if (mood === 'storm') {
      for (let i = 0; i < 16; i += 1) {
        s += '<ellipse class="gustband alive gust" cx="' + n(300 + i * 620 + vary(i, 60) * 200) + '" cy="' + n(880 + vary(i, 61) * 110) +
          '" rx="' + n(260 + vary(i, 62) * 200) + '" ry="' + n(10 + vary(i, 63) * 12) + '" style="animation-delay: calc(var(--phase, 0s) - ' + (vary(i, 64) * 5).toFixed(1) + 's)"/>';
      }
      Object.keys(PLACES).forEach(function (k, i) {
        // A scribble of loops, so it reads as dry brush and not as a wheel.
        let weed = '';
        for (let j = 0; j < 6; j += 1) {
          weed += '<ellipse class="weed" rx="' + n(18 + vary(j, 70) * 14) + '" ry="' + n(10 + vary(j, 71) * 14) + '" transform="rotate(' + (j * 31) + ') translate(' + n(vary(j, 72) * 8 - 4) + ' ' + n(vary(j, 73) * 8 - 4) + ')"/>';
        }
        s += '<g transform="translate(' + (PLACES[k] - 900) + ' 916)"><g class="alive tumble" style="animation-delay: calc(var(--phase, 0s) - ' + (i * 1.3).toFixed(1) + 's)">' +
          '<g class="alive roll">' + weed + '</g></g></g>';
      });
    }
    const defs = '<radialGradient id="lamp"><stop offset="0" stop-color="#F2B25C" stop-opacity=".75"/><stop offset="1" stop-color="#F2B25C" stop-opacity="0"/></radialGradient>';
    return svg(w, s, defs);
  }

  // Layer 6: the foreground. Near-black and slightly soft. A piece is placed only where it
  // stays clear of the middle of the screen at every arrival, so it never hides a door.
  function foreground() {
    const w = 1920 + 1.40 * SPAN;
    const barrel = function (x, y, scale) {
      const bw = 70 * scale;
      const bh = 96 * scale;
      return path('fore', 'M' + n(x) + ' ' + n(y) + ' Q' + n(x - 10 * scale) + ' ' + n(y - bh / 2) + ' ' + n(x) + ' ' + n(y - bh) +
        ' L' + n(x + bw) + ' ' + n(y - bh) + ' Q' + n(x + bw + 10 * scale) + ' ' + n(y - bh / 2) + ' ' + n(x + bw) + ' ' + n(y) + ' Z');
    };
    const crate = function (x, y, size) { return rect('fore', x, y - size, size, size); };
    const post = function (x) { return rect('fore', x, 870, 22, 230) + rect('fore', x - 10, 880, 42, 12); };
    const cactus = function (x) {
      return path('fore', 'M' + x + ' 1080 L' + x + ' 900 Q' + (x + 18) + ' 870 ' + (x + 36) + ' 900 L' + (x + 36) + ' 1080 Z') +
        path('fore', 'M' + (x + 36) + ' 990 L' + (x + 70) + ' 990 L' + (x + 70) + ' 940 Q' + (x + 82) + ' 924 ' + (x + 94) + ' 940 L' + (x + 94) + ' 1010 L' + (x + 36) + ' 1010 Z');
    };
    const pieces = [
      { width: 200, draw: function (x) { return post(x) + post(x + 150) + rect('fore', x - 10, 900, 200, 14); } },
      { width: 230, draw: function (x) { return barrel(x, 1080, 1.5) + barrel(x + 120, 1080, 1.3) + crate(x + 80, 1010, 70); } },
      { width: 100, draw: cactus },
      { width: 260, draw: function (x) { return crate(x, 1080, 120) + barrel(x + 110, 1080, 1.6); } }
    ];
    const doors = Object.keys(PLACES).map(function (k) { return 1.4 * (PLACES[k] - 640); });
    const clear = function (x, width) {
      return doors.every(function (offset) { return x + width - offset < 360 || x - offset > 1240; });
    };
    let s = '';
    let i = 0;
    for (let x = 200; x < w - 300; x += 230 + vary(i, 50) * 260) {
      const piece = pieces[i % pieces.length];
      if (clear(x, piece.width) && vary(i, 51) < 0.7) s += piece.draw(n(x));
      i += 1;
    }
    s += path('fore', 'M0 1080 L0 1060 Q' + n(w / 2) + ' 1050 ' + w + ' 1062 L' + w + ' 1080 Z');
    const defs = '<filter id="soft"><feGaussianBlur stdDeviation="2.2"/></filter>';
    return svg(w, '<g filter="url(#soft)">' + s + '</g>', defs);
  }

  // The words on each location's sign (SPEC 6.2), also shown on arrival.
  function signFor(id, house) {
    const SIGNS = { depot: 'DEPOT', law: 'LAW OFFICE', courthouse: 'COURTHOUSE', yard: 'SITE OFFICE' };
    if (id === 'telegraph') return (house.telegraph || '').toUpperCase();
    if (id === 'supply') return (house.firm || '').toUpperCase();
    return SIGNS[id] || '';
  }

  B2B.town = {
    LAYERS: LAYERS,
    PLACES: PLACES,
    sign: signFor,
    SPAN: SPAN,
    // One SVG string per layer, for a mood.
    draw: function (mood, house) {
      return { l1: sky(mood), l2: mesas(mood), l3: hills(), l4: backRow(), l5: street(house, mood), l6: foreground() };
    }
  };
})();
