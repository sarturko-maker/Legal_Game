#!/usr/bin/env node
/*
 * Headless screenshots (SPEC 12.2). Drives the installed Chrome over its DevTools pipe from
 * plain Node, with no dependency (decided at check-in 0). Opens index.html from disk with
 * ?debug=1, puts the game in each named state through the debug hooks, and saves
 * shots/<name>-<width>x<height>.png at both sizes.
 *
 * Run: node tools/shots.js            every shot
 *      node tools/shots.js m3-choice  only the named ones
 *      node tools/shots.js --frames   also measure the frame time of a walk
 *      node tools/shots.js --keys     also play the demonstration with real key presses
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
const SHOTS = [
  { name: 'm3-telegraph-day', run: "B2B.debug.scene('telegraph-day')", wait: 600 },
  { name: 'm3-walk-mid', run: "B2B.debug.scene('walk-mid')", wait: 600 },
  { name: 'm3-supply-dusk', run: "B2B.debug.scene('supply-dusk')", wait: 600 },
  { name: 'm3-telegram', run: "B2B.debug.scene('telegram')", wait: 900 },
  { name: 'm3-choice', run: "B2B.debug.scene('choice')", wait: 900 }
];

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
    for (const [width, height] of SIZES) {
      await page('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
      await page('Page.navigate', { url });
      await pause(1200);
      await evaluate('document.fonts.ready.then(() => true)');
      await evaluate('B2B.debug.overlay(false)');
      for (const shot of SHOTS) {
        if (only.length && !only.includes(shot.name)) continue;
        await evaluate(shot.run);
        await pause(shot.wait);
        const { data } = await page('Page.captureScreenshot', { format: 'png' });
        const file = path.join(OUT, shot.name + '-' + width + 'x' + height + '.png');
        fs.writeFileSync(file, Buffer.from(data, 'base64'));
        console.log('saved   ' + path.relative(ROOT, file));
      }
      if (keys && width === 1920) {
        // Real key presses through the browser's input pipeline. Each answer is read straight
        // after the key, so a pass means the response came within the same frame or two.
        const press = async (key, code, text) => {
          await page('Input.dispatchKeyEvent', { type: 'keyDown', key, code, text, windowsVirtualKeyCode: text ? text.charCodeAt(0) : 32 });
          await page('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode: text ? text.charCodeAt(0) : 32 });
        };
        await page('Page.navigate', { url });
        await pause(2400);
        const typing = await evaluate("document.querySelectorAll('.telegram .later').length");
        const t0 = Date.now();
        await press(' ', 'Space', ' ');
        const typed = await evaluate("document.querySelectorAll('.telegram .later').length");
        console.log('keys    Space while typing: ' + typing + ' letters left, then ' + typed + ' (' + (Date.now() - t0) + ' ms round trip)');
        await press(' ', 'Space', ' ');
        await pause(150);
        const walking = await evaluate("!!document.querySelector('.figure.walking')");
        await press('Enter', 'Enter', '\r');
        const arrived = await evaluate("!document.querySelector('.figure.walking')");
        console.log('keys    Space continues: walking ' + walking + '; Enter skips the walk: arrived ' + arrived);
        await pause(3600);
        await press('2', 'Digit2', '2');
        const punched = await evaluate("document.querySelectorAll('.ticket.punched').length");
        console.log('keys    2 chooses the second ticket: punched ' + punched);
      }
      if (frames && width === 1920) {
        const result = await evaluate('B2B.debug.walkFrameTime()');
        console.log('walk    ' + result.frames + ' frames, average ' + result.averageMs + ' ms, worst ' + result.worstMs + ' ms (headless, ' + width + 'x' + height + ')');
      }
    }
    await cdp.send('Browser.close').catch(() => {});
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
