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

  // Layer 1: the sun and a few long clouds.
  function sky(mood) {
    const w = 1920 + 0.02 * SPAN;
    let body = '';
    if (mood === 'dusk') {
      body += '<circle class="sun" cx="236" cy="640" r="74"/>';
    } else {
      body += '<circle class="sun" cx="1520" cy="175" r="44"/>';
    }
    let clouds = '';
    for (let i = 0; i < 7; i += 1) {
      const x = 120 + i * 300 + vary(i, 1) * 120;
      const y = 120 + vary(i, 2) * 260;
      const len = 260 + vary(i, 3) * 320;
      clouds += '<ellipse class="cloud" cx="' + n(x) + '" cy="' + n(y) + '" rx="' + n(len / 2) + '" ry="' + n(7 + vary(i, 4) * 7) + '"/>';
      clouds += '<ellipse class="cloud" cx="' + n(x + len * 0.18) + '" cy="' + n(y - 8) + '" rx="' + n(len / 4) + '" ry="' + n(6 + vary(i, 5) * 5) + '"/>';
    }
    body += '<g class="alive drift">' + clouds + '</g>';
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

  // Layer 5: the street. This milestone draws x 1,400 to 4,000: the telegraph office and the
  // supply company, the alley between them, and what stands in front.
  function street(house) {
    const w = 1920 + SPAN;
    let s = rect('ground', 0, GROUND, w, H - GROUND) + rect('ground2', 0, 1010, w, 70);
    for (let i = 0; i < 18; i += 1) {
      s += '<ellipse class="ground2" cx="' + n(i * 560 + vary(i, 30) * 200) + '" cy="' + n(930 + vary(i, 31) * 90) + '" rx="' + n(160 + vary(i, 32) * 200) + '" ry="4"/>';
    }

    // The telegraph office, with a stovepipe that smokes.
    const tg = { door: PLACES.telegraph, width: 460, top: 420, signY: 446, signH: 70, signSize: 40,
      sign: (house.telegraph || '').toUpperCase() };
    s += rect('wood2', tg.door - 158, 340, 14, 90) + rect('wood2', tg.door - 162, 336, 22, 8);
    s += '<g transform="translate(' + (tg.door - 151) + ' 330)">' + ['s1', 's2', 's3', 's4', 's5'].map(function (k) {
      return '<circle class="smokepuff alive smoke ' + k + '" r="11"/>';
    }).join('') + '</g>';
    s += falseFront(tg);
    s += rect('win', tg.door - 196, 722, 110, 76) + rect('wood2', tg.door - 143, 722, 4, 76);
    s += rect('win', tg.door + 86, 722, 110, 76) + rect('wood2', tg.door + 139, 722, 4, 76);

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

    // The alley: a water trough, a bench and a street lamp that glows after dusk.
    s += rect('wood2', 2420, 800, 150, 34) + rect('wood3', 2420, 800, 150, 6) + rect('wood2', 2428, 834, 10, 14) + rect('wood2', 2552, 834, 10, 14);
    s += rect('wood2', 2700, 600, 10, 230) + rect('wood2', 2686, 584, 38, 30);
    s += '<circle class="lampglow alive flicker" cx="2705" cy="600" r="120" fill="url(#lamp)"/>' + rect('win', 2694, 590, 22, 18);

    // The supply company: the biggest sign on the street, shutters, a counter in the window,
    // and a hanging shingle that swings.
    const sp = { door: PLACES.supply, width: 700, top: 360, signY: 392, signH: 96, signSize: 58,
      sign: (house.firm || '').toUpperCase(), upstairs: 3, shutters: true };
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
    // A hitching rail in front of the boardwalk.
    s += rect('wood2', sp.door - 250, 846, 12, 60) + rect('wood2', sp.door - 90, 846, 12, 60) + rect('wood2', sp.door - 258, 852, 180, 9);
    s += '<g transform="translate(' + (sp.door + 300) + ' 694)"><g class="alive swing">' + rect('wood2', -2, 0, 4, 26) +
      rect('wood2', -44, 24, 88, 58) + rect('signboard', -38, 30, 76, 46) +
      path('signink', 'M-26 46 L18 46 L26 40 L28 50 L14 52 L10 62 L16 70 L-16 70 L-10 62 L-14 52 L-26 52 Z') + '</g></g>';

    // The boardwalk, with steps, under both buildings.
    [[tg.door - 270, tg.door + 270], [sp.door - 390, sp.door + 390]].forEach(function (b) {
      s += rect('shade', b[0] - 20, GROUND + 22, b[1] - b[0] + 60, 26);
      s += rect('walk', b[0], GROUND - 2, b[1] - b[0], 22) + rect('wood2', b[0], GROUND + 18, b[1] - b[0], 6);
      for (let x = b[0] + 30; x < b[1]; x += 120) s += rect('wood2', x, GROUND + 24, 8, 14);
    });

    // West and east: a pump, a hitching rail and a fence trailing off.
    s += rect('wood2', 1560, 740, 14, 90) + rect('wood2', 1546, 740, 50, 14) + rect('wood2', 1574, 744, 30, 8);
    for (let x = 3820; x < 4700; x += 70) s += rect('wood2', x, 760, 10, 70);
    s += rect('wood2', 3820, 772, 880, 8) + rect('wood2', 3820, 800, 880, 8);
    const defs = '<radialGradient id="lamp"><stop offset="0" stop-color="#F2B25C" stop-opacity=".75"/><stop offset="1" stop-color="#F2B25C" stop-opacity="0"/></radialGradient>';
    return svg(w, s, defs);
  }

  // Layer 6: the foreground. Near-black, slightly soft, kept clear of the doors at the
  // two arrival views.
  function foreground() {
    const w = 1920 + 1.40 * SPAN;
    let s = '';
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
    s += post(1890) + post(2040) + rect('fore', 1880, 900, 200, 14);
    s += barrel(3560, 1080, 1.5) + barrel(3680, 1080, 1.3) + crate(3640, 1010, 70);
    s += cactus(4700);
    s += crate(3770, 1080, 120) + barrel(3880, 1080, 1.6);
    s += post(5480) + post(5640) + rect('fore', 5470, 900, 210, 14);
    s += barrel(2900, 1080, 1.4) + crate(2980, 1080, 90);
    s += path('fore', 'M0 1080 L0 1060 Q' + n(w / 2) + ' 1050 ' + w + ' 1062 L' + w + ' 1080 Z');
    const defs = '<filter id="soft"><feGaussianBlur stdDeviation="2.2"/></filter>';
    return svg(w, '<g filter="url(#soft)">' + s + '</g>', defs);
  }

  B2B.town = {
    LAYERS: LAYERS,
    PLACES: PLACES,
    SPAN: SPAN,
    GROUND: GROUND,
    // One SVG string per layer, for a mood.
    draw: function (mood, house) {
      return { l1: sky(mood), l2: mesas(mood), l3: hills(), l4: backRow(), l5: street(house), l6: foreground() };
    }
  };
})();
