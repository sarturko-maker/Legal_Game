#!/usr/bin/env node
/*
 * Headless screenshots of the game opened from disk: docs/SPEC.md section 12.2.
 * Uses a Chrome, Chromium or Edge already installed on this machine, through the
 * browser's own --screenshot option. No dependency (decision log, M0).
 *
 * Run: node tools/shots.js      Writes shots/<name>-<width>x<height>.png
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { pathToFileURL } = require('url');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'shots');
const SIZES = [[1280, 720], [1920, 1080]];
const SHOTS = [{ name: 'm0-title', page: 'index.html' }];
const BROWSERS = ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser', 'microsoft-edge'];

function findBrowser() {
  return BROWSERS.find((b) => spawnSync(b, ['--version']).status === 0);
}

// Width and height from the PNG header, to prove the shot is the size asked for.
function pngSize(file) {
  const head = fs.readFileSync(file).subarray(16, 24);
  return [head.readUInt32BE(0), head.readUInt32BE(4)];
}

function shoot(browser, page, file, width, height) {
  // A throwaway profile, so that the user's own browser profile is never touched.
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'b2b-shots-'));
  try {
    fs.rmSync(file, { force: true });
    const run = spawnSync(browser, [
      '--headless=new',
      '--disable-gpu',
      '--hide-scrollbars',
      '--no-first-run',
      '--no-default-browser-check',
      '--user-data-dir=' + profile,
      '--window-size=' + width + ',' + height,
      '--screenshot=' + file,
      pathToFileURL(path.join(ROOT, page)).href,
    ], { encoding: 'utf8', timeout: 60000 });
    if (!fs.existsSync(file)) {
      throw new Error('no screenshot from ' + browser + ': ' + (run.error ? run.error.message : run.stderr.trim()));
    }
    const [w, h] = pngSize(file);
    if (w !== width || h !== height) throw new Error(file + ' is ' + w + 'x' + h + ', expected ' + width + 'x' + height);
  } finally {
    fs.rmSync(profile, { recursive: true, force: true });
  }
}

function main() {
  const browser = findBrowser();
  if (!browser) {
    console.error('No headless browser found. Looked for: ' + BROWSERS.join(', '));
    process.exit(1);
  }
  fs.mkdirSync(OUT, { recursive: true });
  for (const shot of SHOTS) {
    for (const [width, height] of SIZES) {
      const file = path.join(OUT, shot.name + '-' + width + 'x' + height + '.png');
      shoot(browser, shot.page, file, width, height);
      console.log('wrote ' + path.relative(ROOT, file));
    }
  }
}

main();
