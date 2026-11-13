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
const SHOTS = [
  { name: 'm4-intro', run: "location.reload()", wait: 1800 },
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
  { name: 'm4-end-deal', run: J(['pack', 'law', 'law']), wait: 1500 },
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
  { name: 'm4-bank', run: "(B2B.debug.view('law', 'day'), B2B.stage.camera(3900))", wait: 900 }
];

const KEYS = {
  ' ': { code: 'Space', text: ' ', vk: 32 },
  Enter: { code: 'Enter', text: '\r', vk: 13 },
  Escape: { code: 'Escape', vk: 27 }
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

async function main() {
  const args = process.argv.slice(2);
  const frames = args.includes('--frames');
  const keys = args.includes('--keys');
  const paths = args.includes('--paths');
  const only = args.filter((a) => !a.startsWith('--'));
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
    for (const [width, height] of SIZES) {
      if (paths && !only.length) break;
      await page('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
      for (const shot of SHOTS) {
        if (only.length && !only.includes(shot.name)) continue;
        await fresh();
        if (shot.instant) await evaluate('B2B.debug.instant = true');
        if (shot.run !== 'location.reload()') await evaluate(shot.run);
        if (shot.instant) await evaluate('B2B.debug.instant = false');
        for (const key of shot.keys || []) {
          await pause(120);
          await press(key);
        }
        await pause(shot.wait);
        const { data } = await page('Page.captureScreenshot', { format: 'png' });
        const file = path.join(OUT, shot.name + '-' + width + 'x' + height + '.png');
        fs.writeFileSync(file, Buffer.from(data, 'base64'));
        console.log('saved   ' + path.relative(ROOT, file));
      }
    }
    await page('Emulation.setDeviceMetricsOverride', { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false });

    // Plays a path from the intro card with key presses only, to the debrief. Returns what
    // the ledger said, the ending, and how many keys it took.
    const playPath = async (steps, gap, instant) => {
      await fresh();
      if (instant) await evaluate('B2B.debug.instant = true');
      let keysUsed = 0;
      let i = 0;
      let ledger = null;
      for (let n = 0; n < 200; n += 1) {
        const at = await evaluate("(() => { const m = B2B.debug.mode(); const st = B2B.debug.state(); return { mode: m, node: st && st.nodeId, choice: !!document.querySelector('.panel:not([style*=absolute])'), ledger: (document.querySelector('.ending .result td.amount') || {}).textContent || null, resultShown: !!document.querySelector('.ending .result:not(.later)'), debrief: !!document.querySelector('.debrief') }; })()");
        if (at.ledger && at.resultShown && !ledger) {
          ledger = { node: at.node, text: at.ledger };
          ledger.lines = await evaluate("Array.from(document.querySelectorAll('.ending tr:not(.tally):not(.result) td.amount')).map((td) => td.textContent)");
        }
        if (ledger && !ledger.whatIfs) {
          const w = await evaluate("Array.from(document.querySelectorAll('.whatif')).map((p) => p.textContent)");
          if (w.length) ledger.whatIfs = w;
        }
        if (at.debrief) return { ledger, keysUsed };
        if (at.mode === 'deal' && at.choice) {
          const view = await evaluate('B2B.engine.view(B2B.debug.state()).options.map((o) => o.id)');
          const index = view.indexOf(steps[i]);
          if (index < 0) throw new Error('No option ' + steps[i] + ' at ' + at.node);
          i += 1;
          await press(String(index + 1));
        } else {
          await press(' ');
        }
        keysUsed += 1;
        await pause(gap);
      }
      throw new Error('Path ' + steps.join(' ') + ' never reached the debrief');
    };

    if (paths) {
      const fixture = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/scenarios/fixtures/s1-paths.json'), 'utf8'));
      for (const p of fixture.paths) {
        const run = await playPath(p.path, 60, true);
        const want = money(p.expect.net);
        const lines = p.expect.lines.map((l) => money(l.amount));
        // Every what-if line on screen names its amount, as the fixture has it.
        const whatIfs = (run.ledger && run.ledger.whatIfs) || [];
        const ok = run.ledger && run.ledger.text === want && run.ledger.node === p.ending &&
          JSON.stringify(run.ledger.lines) === JSON.stringify(lines) &&
          whatIfs.length === p.whatIfs.length &&
          p.whatIfs.every((w, k) => whatIfs[k].includes(Math.abs(w.amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')));
        if (!ok) errors.push('path ' + p.path.join(' ') + ': ledger ' + JSON.stringify(run.ledger) + ', expected ' + want + ' at ' + p.ending);
        console.log('path    ' + (ok ? 'ok  ' : 'FAIL') + ' ' + p.path.join(' ').padEnd(20) + ' ' + p.ending.padEnd(12) + ' ledger ' + (run.ledger ? run.ledger.text : 'none') + ' (expected ' + want + '), lines ' + (run.ledger ? run.ledger.lines.join(' ') || 'none' : '?') + ', what-ifs ' + whatIfs.length + ', ' + run.keysUsed + ' keys');
      }
    }

    if (keys) {
      // One path at full speed, keyboard only: the longest one, through both visits to legal.
      const t0 = Date.now();
      const run = await playPath(['pack', 'law', 'law'], 450);
      const ok = run.ledger && run.ledger.text === money(26500);
      if (!ok) errors.push('keyboard run: ledger ' + JSON.stringify(run.ledger));
      console.log('keys    ' + (ok ? 'ok  ' : 'FAIL') + ' pack law law at full speed, keyboard only: ' + run.keysUsed + ' keys, ' + Math.round((Date.now() - t0) / 1000) + ' s, ledger ' + (run.ledger ? run.ledger.text : 'none'));
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
      // Reduced motion: the same game with cuts and fades only (SPEC 13).
      await page('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
      const t0 = Date.now();
      const run = await playPath(['pack', 'law', 'law'], 300);
      const ok = run.ledger && run.ledger.text === money(26500);
      if (!ok) errors.push('reduced motion run: ' + JSON.stringify(run.ledger));
      console.log('reduce  ' + (ok ? 'ok  ' : 'FAIL') + ' pack law law with reduced motion: ' + run.keysUsed + ' keys, ' + Math.round((Date.now() - t0) / 1000) + ' s, ledger ' + (run.ledger ? run.ledger.text : 'none'));
      await page('Emulation.setEmulatedMedia', { features: [] });
    }

    if (frames) {
      await fresh();
      const f = await evaluate('B2B.debug.walkFrameTime()');
      console.log('walk    ' + f.frames + ' frames, average ' + f.averageMs + ' ms, worst ' + f.worstMs + ' ms (headless, 1920x1080)');
    }
  } finally {
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
