#!/usr/bin/env node
/*
 * Headless screenshots (SPEC 12.2). Drives the installed Chrome over its DevTools pipe from
 * plain Node, with no dependency (decided at check-in 0). Opens index.html from disk with
 * ?debug=1, puts the game in each named state through the debug hooks, and saves
 * shots/<name>-<width>x<height>.png at both sizes.
 *
 * Run: node tools/shots.js            every shot
 *      node tools/shots.js m4-choice  only the named ones
 *      node tools/shots.js --paths    only drive every s1 path through the real screen with
 *                                     B2B.debug.instant on, checking the ledger each time
 *      node tools/shots.js --keys     also play one path at full speed, keyboard only
 *      node tools/shots.js --frames   also measure the frame time of a walk
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn, spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'shots');
const BROWSERS = ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser', 'microsoft-edge'];
const SIZES = [[1280, 720], [1920, 1080]];

// Each shot: a debug call that puts the game in a state, and how long to let it settle.
// Each shot: an expression to run in the page, optional keys to press after it, and how long
// to wait before the picture. jump() replays a path and presents where it stops.
const J = (path, until) => "B2B.debug.jump('s1', " + JSON.stringify(path) + (until ? ", '" + until + "'" : '') + ')';
const J2 = (path, until) => J(path, until).replace("'s1'", "'s2'");
const SHOTS = [
  { name: 'm4-intro', run: "B2B.debug.session(['s1'])", wait: 900 },
  { name: 'm4-telegram', run: J([], 'po'), instant: true, wait: 700 },
  { name: 'm4-say-clerk', run: J([], 'clerk'), wait: 900 },
  { name: 'm4-ledger', run: J([], 'ledger'), wait: 1400 },
  { name: 'm4-choice', run: J([]), wait: 900 },
  { name: 'm4-train-note', run: J(['clone'], 'ship_clone'), wait: 1700 },
  { name: 'm4-runner', run: J(['pack'], 'pack_reply'), wait: 1000 },
  { name: 'm4-page-down', run: J(['pack'], 'their_terms'), wait: 900 },
  { name: 'm4-page-up', run: J(['pack', 'law'], 'law1'), wait: 1400 },
  { name: 'm4-storm-telegram', run: J(['pack', 'law'], 'redlines'), instant: true, wait: 900 },
  { name: 'm4-say-vance', run: J(['pack', 'law', 'law'], 'law2'), wait: 900 },
  { name: 'm4-outgoing', run: J(['pack', 'law', 'law'], 'fix_out'), instant: true, wait: 900 },
  { name: 'm4-paper', run: J(['clone'], 'later'), wait: 1400 },
  { name: 'm4-end-claim', run: J(['clone']), wait: 900 },
  { name: 'm4-end-lost', run: J(['pack', 'law', 'standfirm']), instant: true, wait: 900 },
  { name: 'm4-end-deal', run: J(['pack', 'law', 'law']), wait: 1500, both: true },
  { name: 'm4-ledger-deal', run: J(['pack', 'law', 'law']), instant: true, keys: [' '], wait: 1500 },
  { name: 'm4-ledger-claim', run: J(['clone']), instant: true, keys: [' '], wait: 1500 },
  { name: 'm4-whatif', run: J(['clone']), instant: true, keys: [' ', ' ', ' '], wait: 700 },
  { name: 'm4-debrief', run: J(['clone']), instant: true, keys: [' ', ' ', ' ', ' '], wait: 700 },
  { name: 'm4-ledger-lost', run: J(['pack', 'law', 'standfirm']), instant: true, keys: [' '], wait: 1500 },
  { name: 'm4-menu', run: J([], 'clerk'), instant: true, keys: ['Escape'], wait: 600 },
  { name: 'm4-mood-dawn', run: "B2B.debug.view('depot', 'dawn')", wait: 900 },
  { name: 'm4-mood-day', run: "B2B.debug.view('telegraph', 'day')", wait: 900 },
  { name: 'm4-mood-dusk', run: "B2B.debug.view('supply', 'dusk')", wait: 900 },
  { name: 'm4-mood-night', run: "B2B.debug.view('courthouse', 'night')", wait: 900 },
  { name: 'm4-mood-storm', run: "B2B.debug.view('law', 'storm')", wait: 900 },
  { name: 'm4-yard', run: "B2B.debug.view('yard', 'day')", wait: 900 },
  { name: 'm4-bank', run: "(B2B.debug.view('law', 'day'), B2B.stage.camera(3900))", wait: 900 },
  { name: 'm5-title', run: "B2B.debug.screen('title')", wait: 900, both: true },
  { name: 'm5-setup', run: "B2B.debug.screen('setup')", wait: 900, both: true },
  { name: 'm5-intro', run: "B2B.debug.session(['s1', 's2'])", wait: 900, both: true },
  { name: 'm5-card', run: J2(['law'], 'law_card'), wait: 900, both: true },
  { name: 'm5-pick', run: J2(['law'], 'pick'), keys: ['1'], wait: 900, both: true },
  { name: 'm5-week', run: J2(['law', ['cap', 'sole'], 'ask', 'quote14'], 'silence'), instant: true, wait: 900, both: true },
  { name: 'm5-yard-dade', run: J2(['law', ['cap', 'sole'], 'ask', 'quote14', 'formal'], 'd_formal'), wait: 900, both: true },
  { name: 'm5-train-in', run: J2(['law', ['cap', 'sole'], 'ask', 'quote14', 'formal', 'law'], 'delivered'), wait: 2200 },
  { name: 'm5-end-settled', run: J2(['law', ['cap', 'sole'], 'ask', 'quote14', 'formal', 'law']), wait: 900, both: true },
  { name: 'm5-ledger-count', run: J2(['law', ['cap', 'sole'], 'ask', 'quote14', 'formal', 'law']), instant: true, keys: [' '], wait: 1500, both: true },
  { name: 'm5-whatif-s2', run: J2(['law', ['cap', 'sole'], 'ask', 'quote14', 'formal', 'law']), instant: true, keys: [' ', ' ', ' '], wait: 700, both: true },
  { name: 'm5-debrief-bit', run: J2(['sign', 'quote12', 'verbal']), instant: true, keys: [' ', ' ', ' ', ' '], wait: 700, both: true },
  { name: 'm5-yearend', drive: [['clone'], ['sign', 'quote12', 'verbal']], wait: 900, both: true },
  { name: 'm5-menu', run: "B2B.debug.session(['s1', 's2'])", keys: ['Escape'], wait: 600, both: true },
  { name: 'm5-lost-s2', run: J2(['refuse', 'walk']), wait: 900 },
  { name: 'm6-setup', run: "B2B.debug.screen('setup')", wait: 900, both: true },
  { name: 'm6-skin-telegram', run: "B2B.debug.jump('s1', [], 'po', { seed: 1 })", wait: 3500 },
  { name: 'm6-skin-paper', run: "B2B.debug.jump('s1', ['clone'], 'later', { seed: 1 })", wait: 900 },
  { name: 'm6-skin-ledger', run: "B2B.debug.jump('s2', ['law', ['cap', 'sole'], 'ask', 'quote14', 'formal', 'law'], null, { seed: 1 })", instant: true, keys: [' '], wait: 1500 },
  { name: 'm6-yearend-seed', drive: [['clone'], ['sign', 'quote12', 'verbal']], options: { seed: 5 }, wait: 900, both: true },
  { name: 'm6p-setup', private: true, run: "B2B.debug.screen('setup')", wait: 900, both: true },
  { name: 'm6p-intro', private: true, run: "B2B.debug.session(['s1', 'p1'])", wait: 900 },
  { name: 'm6p-frontpage', private: true, run: "B2B.debug.session(['p1'], { seed: 5, wildcards: true })", keys: [' '], wait: 1800, both: true },
  { name: 'm6p-ledger', private: true, run: "B2B.debug.jump('p1', ['date'], null, { seed: 5, wildcards: true })", instant: true, keys: [' '], wait: 1500 },
  { name: 'm6p-debrief', private: true, run: "B2B.debug.jump('s1', ['ship'])", instant: true, keys: [' ', ' ', ' '], wait: 900 }
];

const KEYS = {
  ' ': { code: 'Space', text: ' ', vk: 32 },
  Enter: { code: 'Enter', text: '\r', vk: 13 },
  Escape: { code: 'Escape', vk: 27 },
  Tab: { code: 'Tab', vk: 9 }
};
for (let d = 1; d <= 9; d += 1) KEYS[String(d)] = { code: 'Digit' + d, text: String(d), vk: 48 + d };

// What the ledger shows for a net result: a sign, commas, a true minus.
function money(n) {
  const s = Math.abs(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return n < 0 ? '−' + s : n > 0 ? '+' + s : s;
}

function findBrowser() {
  for (const name of BROWSERS) {
    if (spawnSync(name, ['--version'], { encoding: 'utf8' }).status === 0) return name;
  }
  return null;
}

// A minimal DevTools client over --remote-debugging-pipe: JSON messages, each ended by \0,
// written to the browser's fd 3 and read from its fd 4.
function connect(browser, profile) {
  const child = spawn(browser, [
    '--headless=new', '--remote-debugging-pipe', '--user-data-dir=' + profile, '--no-first-run',
    '--no-default-browser-check', '--hide-scrollbars', '--allow-file-access-from-files', 'about:blank'
  ], { stdio: ['ignore', 'ignore', 'ignore', 'pipe', 'pipe'] });
  const out = child.stdio[3];
  const input = child.stdio[4];
  let next = 1;
  const waiting = new Map();
  const listeners = [];
  let buffer = '';
  input.on('data', (chunk) => {
    buffer += chunk.toString('utf8');
    let end;
    while ((end = buffer.indexOf('\0')) >= 0) {
      const msg = JSON.parse(buffer.slice(0, end));
      buffer = buffer.slice(end + 1);
      if (msg.id && waiting.has(msg.id)) {
        const { resolve, reject } = waiting.get(msg.id);
        waiting.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message));
        else resolve(msg.result);
      } else if (msg.method) {
        listeners.forEach((fn) => fn(msg));
      }
    }
  });
  const send = (method, params, sessionId) => new Promise((resolve, reject) => {
    const id = next++;
    waiting.set(id, { resolve, reject });
    out.write(JSON.stringify({ id, method, params: params || {}, sessionId }) + '\0');
  });
  return { child, send, on: (fn) => listeners.push(fn) };
}

const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// SPEC 13: the contrast of every piece of visible text against the paper or panel behind
// it, its opacity included. Text straight over the scene, with no panel, is listed apart.
const CONTRAST = `(() => {
  const parse = (c) => { const m = /rgba?\\(([^)]+)\\)/.exec(c); if (!m) return null; const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1]; };
  const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
  const ratio = (a, b) => { const x = Math.max(lum(a), lum(b)); const y = Math.min(lum(a), lum(b)); return (x + 0.05) / (y + 0.05); };
  const behind = (el) => { for (let e = el; e && e !== document.body; e = e.parentElement) { const c = parse(getComputedStyle(e).backgroundColor); if (c && c[3] > 0.9) return c; } return null; };
  const out = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const text = n.textContent.trim();
    const el = n.parentElement;
    if (!text || !el.closest('.props, .hud, .menu, .menu-button') || el.closest('[style*=absolute], [hidden], .debug')) continue;
    if (!el.getBoundingClientRect().width) continue;
    let alpha = 1;
    let moving = false;
    for (let e = el; e; e = e.parentElement) {
      alpha *= Number(getComputedStyle(e).opacity);
      if (e.getAnimations && e.getAnimations().some((a) => a.playState === 'running')) moving = true;
    }
    if (moving) continue;
    if (alpha < 0.05) continue;
    const fg = parse(getComputedStyle(el).color);
    const bg = behind(el);
    const what = (el.getAttribute('class') || el.tagName.toLowerCase()) + ': ' + text.slice(0, 32);
    if (!bg) { out.push({ what, ratio: null }); continue; }
    const a = fg[3] * alpha;
    out.push({ what, ratio: Math.round(ratio([0, 1, 2].map((i) => fg[i] * a + bg[i] * (1 - a)), bg) * 100) / 100 });
  }
  return out;
})()`;

async function main() {
  const args = process.argv.slice(2);
  const frames = args.includes('--frames');
  const keys = args.includes('--keys');
  const paths = args.includes('--paths');
  const audit = args.includes('--audit');
  const only = args.filter((a) => !a.startsWith('--'));
  // --private: the example private pack, copied to packs/private.js for this run only
  // (PLAN M6). An existing packs/private.js is somebody's real pack: never touch it.
  const privateRun = args.includes('--private');
  const PRIVATE = path.join(ROOT, 'packs', 'private.js');
  if (privateRun) {
    if (fs.existsSync(PRIVATE)) throw new Error('packs/private.js already exists; --private will not overwrite it.');
    fs.copyFileSync(path.join(ROOT, 'packs', 'private.example.js'), PRIVATE);
  }
  const browser = findBrowser();
  if (!browser) throw new Error('No Chrome, Chromium or Edge found. Tried: ' + BROWSERS.join(', '));
  fs.mkdirSync(OUT, { recursive: true });
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'b2b-shots-'));
  const cdp = connect(browser, profile);
  const errors = [];
  try {
    const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });
    const page = (method, params) => cdp.send(method, params, sessionId);
    cdp.on((msg) => {
      if (msg.sessionId !== sessionId) return;
      if (msg.method === 'Runtime.exceptionThrown') errors.push(msg.params.exceptionDetails.exception ? msg.params.exceptionDetails.exception.description : msg.params.exceptionDetails.text);
      if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') errors.push(msg.params.args.map((a) => a.value || a.description).join(' '));
    });
    await page('Runtime.enable');
    await page('Page.enable');
    const url = 'file://' + path.join(ROOT, 'index.html') + '?debug=1';
    const evaluate = async (expression) => {
      const r = await page('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
      if (r.exceptionDetails) throw new Error(expression + ': ' + (r.exceptionDetails.exception ? r.exceptionDetails.exception.description : r.exceptionDetails.text));
      return r.result.value;
    };
    const press = async (key) => {
      const k = KEYS[key];
      await page('Input.dispatchKeyEvent', { type: 'keyDown', key, code: k.code, text: k.text, windowsVirtualKeyCode: k.vk });
      await page('Input.dispatchKeyEvent', { type: 'keyUp', key, code: k.code, windowsVirtualKeyCode: k.vk });
    };
    const fresh = async () => {
      await page('Page.navigate', { url });
      await pause(900);
      await evaluate('document.fonts.ready.then(() => true)');
      await evaluate('B2B.debug.overlay(false)');
    };
    await page('Emulation.setDeviceMetricsOverride', { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false });

    // Plays deals with key presses only, from wherever the game stands (the title or an
    // intro card) to the year end. steps[i] is the path for deal i; a pick step is an array.
    // Returns, per deal, what the ledger said; and the year-end total.
    const drive = async (steps, gap) => {
      let keysUsed = 0;
      const deals = [];
      let i = 0;
      let deal = -1;
      let seen = null;
      let walked = false;
      let typed = false;
      for (let n = 0; n < 600; n += 1) {
        const at = await evaluate("(() => { const st = B2B.debug.state(); const live = (s) => document.querySelector(s + ':not([style*=absolute])'); return { walking: !!document.querySelector('.figure.player.walking'), typing: document.querySelectorAll('.telegram .later').length > 0, mode: B2B.debug.mode(), node: st && st.nodeId, pick: !!live('.pickpanel'), choice: !!live('.panel:not(.pickpanel)'), ledger: (document.querySelector('.ending .result:not(.later) td.amount') || {}).textContent || null, debrief: !!live('.debrief'), total: (document.querySelector('.yearend .result td.amount') || {}).textContent || null }; })()");
        if (at.walking) walked = true;
        if (at.typing) typed = true;
        if (at.mode === 'yearend') return { deals, keysUsed, total: at.total, walked, typed };
        if (at.mode === 'intro' && seen !== 'intro') {
          deal += 1;
          i = 0;
          deals[deal] = { ledger: null };
        }
        seen = at.mode;
        const d = deals[deal];
        if (at.ledger && d && !d.ledger) {
          d.ledger = at.ledger;
          d.node = at.node;
          d.lines = await evaluate("Array.from(document.querySelectorAll('.ending tr:not(.tally):not(.result) td.amount')).map((td) => td.textContent)");
          d.tally = await evaluate("Array.from(document.querySelectorAll('.ending tr.tally')).map((tr) => tr.textContent)");
        }
        if (d && !d.whatIfs) {
          const w = await evaluate("Array.from(document.querySelectorAll('.whatif')).map((p) => p.textContent)");
          if (w.length) d.whatIfs = w;
        }
        if (at.mode === 'deal' && (at.choice || at.pick)) {
          const ids = await evaluate('B2B.engine.view(B2B.debug.state()).options.map((o) => o.id)');
          const step = steps[deal][i];
          i += 1;
          for (const id of [].concat(step)) {
            const index = ids.indexOf(id);
            if (index < 0) throw new Error('No option ' + id + ' at ' + at.node);
            await press(String(index + 1));
            keysUsed += 1;
          }
          if (at.pick) {
            await pause(80);
            await press('Enter');
            keysUsed += 1;
          }
        } else {
          await press(at.debrief ? 'Enter' : ' ');
          keysUsed += 1;
        }
        await pause(gap);
      }
      throw new Error('Never reached the year end: ' + JSON.stringify(steps));
    };

    // One deal from its intro card, checked against its fixture entry.
    const check = async (scenario, entry, gap, instant) => {
      await fresh();
      if (instant) await evaluate('B2B.debug.instant = true');
      await evaluate("B2B.debug.session(['" + scenario + "'])");
      const run = await drive([entry.path], gap);
      const d = run.deals[0];
      const want = money(entry.expect.net);
      const whatIfs = d.whatIfs || [];
      const fail = [];
      if (d.ledger !== want) fail.push('result ' + d.ledger + ', expected ' + want);
      if (d.node !== entry.ending) fail.push('ending ' + d.node + ', expected ' + entry.ending);
      if (entry.expect.lines && JSON.stringify(d.lines) !== JSON.stringify(entry.expect.lines.map((l) => money(l.amount)))) fail.push('lines ' + d.lines.join(' '));
      if (whatIfs.length !== entry.whatIfs.length) fail.push(whatIfs.length + ' what-ifs, expected ' + entry.whatIfs.length);
      entry.whatIfs.forEach((w, k) => {
        if (w.amount && whatIfs[k] && !whatIfs[k].includes(money(w.amount).replace(/^[+−]/, ''))) fail.push('what-if ' + w.id + ': ' + whatIfs[k]);
      });
      return { d, run, want, fail };
    };

    if (privateRun) {
      // The game loads the private pack after the public one, and the replacement starts.
      await fresh();
      const p = await evaluate("(() => { B2B.debug.session(['s1']); return { packs: B2B.packs.loaded().map((x) => x.id), offered: B2B.packs.scenarios().map((x) => x.id), intro: document.querySelector('.intro h1').textContent, problems: B2B.packs.problems().length }; })()");
      const ok = p.packs.join() === 'public,example' && p.offered.join() === 's1,p1' && p.intro === 'The usual price' && p.problems === 0;
      if (!ok) errors.push('private pack: ' + JSON.stringify(p));
      console.log('private ' + (ok ? 'ok  ' : 'FAIL') + ' packs ' + p.packs.join(', ') + '; offered ' + p.offered.join(', ') + '; s1 starts as "' + p.intro + '"');
    }

    if (audit) {
      // SPEC 13, item by item. 1: contrast on every screen the shots visit.
      await page('Emulation.setDeviceMetricsOverride', { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false });
      let lowest = 99;
      let texts = 0;
      const low = new Set();
      const bare = new Set();
      for (const shot of SHOTS) {
        if (shot.private || (only.length && !only.includes(shot.name))) continue;
        await fresh();
        if (shot.instant || shot.drive) await evaluate('B2B.debug.instant = true');
        if (shot.drive) {
          await evaluate("B2B.debug.session(['s1', 's2'], " + JSON.stringify(shot.options || {}) + ')');
          await drive(shot.drive, 50);
        } else {
          await evaluate(shot.run);
        }
        await evaluate('B2B.debug.instant = false');
        for (const key of shot.keys || []) {
          await pause(120);
          await press(key);
        }
        await pause(Math.max(shot.wait, 1500));
        for (const t of await evaluate(CONTRAST)) {
          texts += 1;
          if (t.ratio === null) bare.add(t.what);
          else {
            lowest = Math.min(lowest, t.ratio);
            if (t.ratio < 4.5) low.add(shot.name + '  ' + t.what + '  ' + t.ratio);
          }
        }
      }
      low.forEach((l) => errors.push('contrast below 4.5: ' + l));
      console.log('contrast ' + (low.size ? 'FAIL' : 'ok  ') + ' ' + texts + ' pieces of text on ' + SHOTS.filter((x) => !x.private).length + ' screens; lowest ' + lowest + (low.size ? '; ' + low.size + ' below 4.5' : ''));
      bare.forEach((b) => console.log('         no panel behind: ' + b));

      // 2: focus is always visible. Tab through the set-up, a choice, the pick, the menu.
      const unseen = [];
      let stops = 0;
      const tabThrough = async (label, n) => {
        for (let i = 0; i < n; i += 1) {
          await press('Tab');
          await pause(60);
          const f = await evaluate("(() => { const e = document.activeElement; if (!e || e === document.body) return null; const cs = getComputedStyle(e); return { what: (e.getAttribute('class') || e.tagName) + ' ' + (e.textContent || e.type || '').trim().slice(0, 24), shown: cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) >= 2 }; })()");
          if (!f) continue;
          stops += 1;
          if (!f.shown) unseen.push(label + ': ' + f.what);
        }
      };
      await fresh();
      await evaluate("B2B.debug.screen('title')");
      await pause(500);
      await tabThrough('title', 3);
      await evaluate("B2B.debug.screen('setup')");
      await pause(500);
      await tabThrough('set up', 10);
      await evaluate(J(['pack'], 'c2'));
      await pause(900);
      await tabThrough('choice', 4);
      await evaluate(J2(['law'], 'pick'));
      await pause(900);
      await tabThrough('pick', 5);
      await press('Escape');
      await pause(300);
      await tabThrough('menu', 5);
      unseen.forEach((u) => errors.push('focus not visible: ' + u));
      console.log('focus   ' + (unseen.length ? 'FAIL' : 'ok  ') + ' ' + stops + ' Tab stops on the title, set-up, a choice, the pick and the menu; ' + (unseen.length ? unseen.length + ' without a visible focus' : 'every one shows its focus'));

      // 3: with reduced motion, nothing slides, walks or loops: cuts and fades only.
      await page('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
      await fresh();
      await evaluate("window.moves = new Set(); addEventListener('transitionrun', (e) => { if (!/opacity|color|visibility/.test(e.propertyName)) moves.add('transition ' + e.propertyName + ' on ' + e.target.getAttribute('class')); }, true); addEventListener('animationstart', (e) => moves.add('animation ' + e.animationName + ' on ' + e.target.getAttribute('class')), true); true");
      await press('Enter');
      await drive([['clone'], ['law', ['cap', 'sole'], 'ask', 'quote14', 'formal', 'law']], 300);
      const running = await evaluate("document.getAnimations().filter((a) => a.playState === 'running').map((a) => (a.animationName || a.transitionProperty) + ' on ' + a.effect.target.getAttribute('class'))");
      const moves = (await evaluate('Array.from(moves)')).concat(running);
      moves.forEach((m) => errors.push('moves with reduced motion: ' + m));
      console.log('motion  ' + (moves.length ? 'FAIL' : 'ok  ') + ' a full session with reduced motion: ' + (moves.length ? moves.length + ' things moved' : 'nothing slid, walked or looped'));
      await page('Emulation.setEmulatedMedia', { features: [] });
    }

    for (const [width, height] of SIZES) {
      if ((paths || keys || audit) && !only.length) break;
      await page('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
      for (const shot of SHOTS) {
        if (only.length && !only.includes(shot.name)) continue;
        if (Boolean(shot.private) !== privateRun) continue;
        // Shots marked both are taken again with large text.
        for (const large of shot.both ? [false, true] : [false]) {
          await fresh();
          if (large) await evaluate("B2B.session.options.large = true; B2B.stage.el.classList.add('large')");
          if (shot.instant || shot.drive) await evaluate('B2B.debug.instant = true');
          if (shot.drive) {
            await evaluate("B2B.debug.session(['s1', 's2'], " + JSON.stringify(shot.options || {}) + ')');
            await drive(shot.drive, 50);
          } else {
            await evaluate(shot.run);
          }
          await evaluate('B2B.debug.instant = false');
          for (const key of shot.keys || []) {
            await pause(120);
            await press(key);
          }
          await pause(shot.wait);
          const { data } = await page('Page.captureScreenshot', { format: 'png' });
          const file = path.join(OUT, shot.name + (large ? '-large' : '') + '-' + width + 'x' + height + '.png');
          fs.writeFileSync(file, Buffer.from(data, 'base64'));
          console.log('saved   ' + path.relative(ROOT, file));
        }
      }
    }
    await page('Emulation.setDeviceMetricsOverride', { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false });

    const label = (path) => path.map((s) => [].concat(s).join(',')).join(' ');
    if (paths) {
      const fixtures = {
        s1: JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/scenarios/fixtures/s1-paths.json'), 'utf8')).paths,
        s2: JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/scenarios/fixtures/s2-paths.json'), 'utf8')).paths
      };
      // Every s1 path, and the six s2 paths PLAN M5 names.
      const S2 = ['law cap,sole ask quote14 formal law', 'sign quote12 verbal', 'law cap,grace quote12 wire',
        'refuse walk', 'sign ask quote14 risk', 'refuse law sole,grace ask quote12 formal standfirm'];
      const runs = fixtures.s1.map((e) => ['s1', e]).concat(S2.map((name) => {
        const e = fixtures.s2.find((x) => label(x.path) === name);
        if (!e) throw new Error('No s2 fixture path ' + name);
        return ['s2', e];
      }));
      for (const [scenario, entry] of runs) {
        const r = await check(scenario, entry, 50, true);
        if (r.fail.length) errors.push(scenario + ' ' + label(entry.path) + ': ' + r.fail.join('; '));
        console.log('path    ' + (r.fail.length ? 'FAIL' : 'ok  ') + ' ' + scenario + ' ' + label(entry.path).padEnd(50) + ' ' + r.d.node.padEnd(12) + ' ' + r.d.ledger + (r.d.tally.length ? ' (' + r.d.tally.length + ' count lines)' : '') + ', what-ifs ' + (r.d.whatIfs || []).length + ', ' + r.run.keysUsed + ' keys');
      }
      // A two-deal session from the title screen, checked at the year end.
      await fresh();
      await evaluate('B2B.debug.instant = true');
      await evaluate("B2B.debug.screen('title')");
      await pause(100);
      await press('Enter');
      const session = await drive([['clone'], ['sign', 'quote12', 'verbal']], 50);
      const total = money(-19998500 - 1740000);
      const ok = session.total === total;
      if (!ok) errors.push('session total ' + session.total + ', expected ' + total);
      console.log('session ' + (ok ? 'ok  ' : 'FAIL') + ' Play, s1 clone, s2 sign quote12 verbal: year end ' + session.total + ' (expected ' + total + '), ' + session.keysUsed + ' keys');

      // The same seed, twice, through the screen: the same deals and the same record (SPEC 9).
      const seeded = [];
      for (let n = 0; n < 2; n += 1) {
        await fresh();
        await evaluate('B2B.debug.instant = true');
        await evaluate("B2B.debug.session(['s1', 's2'], { seed: 4471, wildcards: true })");
        const r = await drive([['pack', 'law', 'law'], ['sign', 'ask', 'quote14', 'risk']], 50);
        seeded.push({ total: r.total, record: await evaluate('JSON.stringify(B2B.debug.record())') });
      }
      const same = seeded[0].record === seeded[1].record && JSON.parse(seeded[0].record).seed === 4471;
      if (!same) errors.push('seed 4471 twice: ' + JSON.stringify(seeded));
      console.log('seed    ' + (same ? 'ok  ' : 'FAIL') + ' seed 4471 with wildcards on, played twice: the same record both times, year end ' + seeded[0].total);
    }

    if (keys) {
      // A full session at full speed, keyboard only, through the longest paths.
      await fresh();
      const t0 = Date.now();
      await press('Enter');
      const run = await drive([['pack', 'law', 'law'], ['law', ['cap', 'sole'], 'ask', 'quote14', 'formal', 'law']], 450);
      const total = money(26500 + 180000);
      const ok = run.total === total;
      if (!ok) errors.push('keyboard session: ' + run.total);
      console.log('keys    ' + (ok ? 'ok  ' : 'FAIL') + ' a full session at full speed, keyboard only: ' + run.keysUsed + ' keys, ' + Math.round((Date.now() - t0) / 1000) + ' s, year end ' + run.total + ' (expected ' + total + ')');
    }

    if (keys) {
      // The mouse, and the menu. One click does one thing; a click on the scene skips a walk;
      // Esc and the menu restart the deal.
      const click = async (x, y) => {
        for (const type of ['mousePressed', 'mouseReleased']) {
          await page('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1 });
        }
      };
      const centre = (selector) => evaluate("(() => { const r = document.querySelector('" + selector + "').getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; })()");
      const facts = () => evaluate("({ mode: B2B.debug.mode(), node: (B2B.debug.state() || {}).nodeId, typing: document.querySelectorAll('.telegram .later').length, walking: !!document.querySelector('.figure.player.walking'), intro: !!document.querySelector('.intro:not([style*=absolute])'), menu: !document.querySelector('.menu').hidden })");
      await fresh();
      await evaluate("B2B.debug.session(['s1'])");
      await click(...await centre('.intro'));
      await pause(1200);
      await click(...await centre('.telegram .message'));
      const a = await facts();
      await click(...await centre('.telegram .continue'));
      await pause(900);
      const b = await facts();
      await click(...await centre('.say'));
      await pause(400);
      await click(300, 200);
      await pause(100);
      const c = await facts();
      await press('Escape');
      const d = await facts();
      await press('Enter');
      await pause(400);
      const e = await facts();
      const ok = a.typing === 0 && a.node === 'po' && b.node === 'clerk' && !c.walking && c.node === 'ledger' && d.menu && e.intro && e.mode === 'intro';
      if (!ok) errors.push('mouse run: ' + JSON.stringify([a, b, c, d, e]));
      console.log('mouse   ' + (ok ? 'ok  ' : 'FAIL') + ' a click finishes the typing (still on ' + a.node + '), Continue moves on (' + b.node + '), a click on the scene ends the walk (walking ' + c.walking + ', at ' + c.node + '), Esc opens the menu (' + d.menu + '), Enter restarts (intro ' + e.intro + ')');
    }

    if (keys) {
      // A full session with reduced motion: cuts and fades only (SPEC 13).
      await page('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
      await fresh();
      const t0 = Date.now();
      await press('Enter');
      const run = await drive([['clone'], ['refuse', 'walk']], 300);
      const total = money(-19998500);
      const ok = run.total === total && !run.walked && !run.typed;
      if (!ok) errors.push('reduced motion session: ' + JSON.stringify(run));
      console.log('reduce  ' + (ok ? 'ok  ' : 'FAIL') + ' a full session with reduced motion: ' + run.keysUsed + ' keys, ' + Math.round((Date.now() - t0) / 1000) + ' s, year end ' + run.total + ' (expected ' + total + '), walked ' + run.walked + ', typed ' + run.typed);
      await page('Emulation.setEmulatedMedia', { features: [] });
    }

    if (frames) {
      await fresh();
      const f = await evaluate('B2B.debug.walkFrameTime()');
      console.log('walk    ' + f.frames + ' frames, average ' + f.averageMs + ' ms, worst ' + f.worstMs + ' ms (headless, 1920x1080)');
      // Standing still: what the moving scenery costs on its own, in a calm scene and in the
      // busiest one, and the floor with nothing moving at all.
      const idle = (place, mood) => "(B2B.debug.view('" + place + "', '" + mood + "'), new Promise((resolve) => { const t = []; let last = null; const tick = (now) => { if (last !== null) t.push(now - last); last = now; if (t.length < 120) requestAnimationFrame(tick); else resolve(Math.round(t.reduce((a, b) => a + b, 0) / t.length * 100) / 100); }; setTimeout(() => requestAnimationFrame(tick), 600); }))";
      await fresh();
      const calm = await evaluate(idle('telegraph', 'day'));
      await fresh();
      const storm = await evaluate(idle('yard', 'storm'));
      await page('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
      await fresh();
      const still = await evaluate(idle('yard', 'storm'));
      await page('Emulation.setEmulatedMedia', { features: [] });
      console.log('idle    standing still: ' + calm + ' ms a frame at the telegraph office by day, ' + storm + ' ms at the yard in a storm, ' + still + ' ms with nothing moving');
      // Time to first screen: from navigation to the title card in place, fonts loaded.
      await page('Page.navigate', { url: url.replace('?debug=1', '') });
      let first = null;
      for (let i = 0; i < 300 && first === null; i += 1) {
        first = await evaluate("document.querySelector('.titlecard') ? document.fonts.ready.then(() => Math.round(performance.now())) : null");
        if (first === null) await pause(10);
      }
      const bytes = ['index.html'].concat((fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8').match(/(?:src|href)="([^"]+)"/g) || []).map((m) => m.slice(m.indexOf('"') + 1, -1)))
        .filter((f) => fs.existsSync(path.join(ROOT, f))).reduce((sum, f) => sum + fs.statSync(path.join(ROOT, f)).size, 0);
      console.log('load    title card on screen ' + first + ' ms after navigation; the game loads ' + Math.round(bytes / 1024) + ' KB (limit 1,536 KB)');
      if (bytes > 1.5 * 1024 * 1024) errors.push('the game loads ' + bytes + ' bytes, over 1.5 MB');
    }

    if (privateRun && (!only.length || only.includes('m6p-broken'))) {
      // A private pack that fails validation: the game shows the problems and does not start.
      const text = fs.readFileSync(PRIVATE, 'utf8');
      fs.writeFileSync(PRIVATE, text.replace("next: 'ask'", "next: 'nowhere'"));
      await page('Emulation.setDeviceMetricsOverride', { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false });
      await page('Page.navigate', { url });
      await pause(1200);
      const shown = await evaluate("document.body.textContent.includes('The packs have problems') && document.body.textContent.includes('nowhere')");
      if (!shown) errors.push('broken private pack: no problem screen');
      const { data } = await page('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(OUT, 'm6p-broken-1280x720.png'), Buffer.from(data, 'base64'));
      console.log('broken  ' + (shown ? 'ok  ' : 'FAIL') + ' a private pack that fails validation shows the problem screen');
    }
  } finally {
    if (privateRun) fs.rmSync(PRIVATE, { force: true });
    cdp.child.kill();
    // Chrome may still be writing to its profile for a moment after it closes.
    await pause(500);
    try {
      fs.rmSync(profile, { recursive: true, force: true });
    } catch (err) {
      console.log('note    could not remove ' + profile + ': ' + err.message);
    }
  }
  if (errors.length) {
    console.log('ERRORS in the page:');
    errors.forEach((e) => console.log('  ' + e));
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exitCode = 1;
});
