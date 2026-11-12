#!/usr/bin/env node
/*
 * Stop hook: runs node tools/check.js at the end of a turn. If the check fails, it blocks
 * the stop once and hands the failure text back. Kept next to settings.json, so that the
 * hook works on any branch, with or without tools/.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

let input = {};
try {
  input = JSON.parse(fs.readFileSync(0, 'utf8') || '{}');
} catch (err) {
  // Unreadable input: treat it as a first stop.
}

// Already continuing because this hook blocked once: let the turn end.
if (input.stop_hook_active) process.exit(0);

const root = path.join(__dirname, '..', '..');
const check = path.join(root, 'tools', 'check.js');
if (!fs.existsSync(check)) process.exit(0);

// Under the ten seconds allowed for the whole hook.
const run = spawnSync(process.execPath, [check], { cwd: root, encoding: 'utf8', timeout: 9000 });
if (run.status === 0) process.exit(0);

const text = run.error
  ? 'tools/check.js did not finish: ' + run.error.message
  : (run.stdout + run.stderr).trim();
process.stdout.write(JSON.stringify({
  decision: 'block',
  reason: 'node tools/check.js failed. Fix it before stopping.\n' + text.slice(-4000),
}));
