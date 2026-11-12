#!/usr/bin/env node
/*
 * The machine check: docs/SPEC.md section 12.1. Exits non-zero on any failure.
 * The Stop hook runs it at the end of every turn, so it has to stay fast.
 *
 * Run: node tools/check.js
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');

// What the game loads. Only .html, .css and .js are read by the browser, so licence
// texts kept beside the fonts are not scanned.
const GAME_PATHS = ['index.html', 'text.html', 'css', 'src', 'packs'];
const LOADED = /\.(html|css|js)$/;

const CODE_RULES = [
  ['import or export statement', /^\s*(import|export)\b\s*[\w{*'"]|\bimport\s*\(/],
  ['type="module"', /type\s*=\s*["']?module\b/i],
  ['fetch(', /\bfetch\s*\(/],
  ['XMLHttpRequest', /XMLHttpRequest/],
  ['WebSocket', /WebSocket/],
];
const CORE_RULES = [
  ['Math.random', /\bMath\.random\b/],
  ['Date', /\bDate\b/],
  ['window', /\bwindow\b/],
  ['document', /\bdocument\b/],
];
const ADDRESS = /https?:\/\/[^\s'"<>)]*/g;
const SVG_NAMESPACE = 'http://www.w3.org/';
const BLOCK_COMMENT = /\/\*[\s\S]*?\*\/|<!--[\s\S]*?-->/g;

function gameFiles() {
  const files = [];
  const walk = (rel) => {
    const abs = path.join(ROOT, rel);
    if (!fs.existsSync(abs)) return;
    if (fs.statSync(abs).isDirectory()) {
      for (const name of fs.readdirSync(abs).sort()) walk(rel + '/' + name);
    } else if (LOADED.test(rel)) {
      files.push(rel);
    }
  };
  GAME_PATHS.forEach(walk);
  return files;
}

// Code patterns are looked for in code only, so that a comment may name what the code
// avoids. Comments are blanked rather than removed, to keep line numbers right.
function codeOnly(text, isJs) {
  const blank = (m) => m.replace(/[^\n]/g, ' ');
  const out = text.replace(BLOCK_COMMENT, blank);
  return isJs ? out.replace(/\/\/.*$/gm, blank) : out;
}

function lineAt(text, index) {
  return text.slice(0, index).split('\n').length;
}

function scanFile(rel) {
  const text = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  const problems = [];
  const rules = rel.startsWith('src/core/') ? CODE_RULES.concat(CORE_RULES) : CODE_RULES;

  codeOnly(text, rel.endsWith('.js')).split('\n').forEach((line, i) => {
    for (const [name, re] of rules) {
      if (re.test(line)) problems.push(rel + ':' + (i + 1) + '  ' + name);
    }
  });

  // Addresses are looked for everywhere, comments included. The exceptions are the SVG
  // namespace and licence text inside a comment.
  const licences = [];
  for (const m of text.matchAll(BLOCK_COMMENT)) {
    if (/licen[cs]e/i.test(m[0])) licences.push([m.index, m.index + m[0].length]);
  }
  for (const m of text.matchAll(ADDRESS)) {
    if (m[0].startsWith(SVG_NAMESPACE)) continue;
    if (licences.some(([from, to]) => m.index >= from && m.index < to)) continue;
    problems.push(rel + ':' + lineAt(text, m.index) + '  web address ' + m[0]);
  }
  return problems;
}

function checkRepository() {
  const git = spawnSync('git', ['ls-files', '--', 'packs/private.js'], { cwd: ROOT, encoding: 'utf8' });
  // A copy downloaded as a ZIP has no git at all, and so tracks nothing.
  if (git.status !== 0) return { note: 'no git repository, so nothing is tracked', problems: [] };
  if (git.stdout.trim()) {
    return { note: '', problems: ['packs/private.js is tracked by git: run git rm --cached packs/private.js'] };
  }
  return { note: 'packs/private.js is not tracked by git', problems: [] };
}

// Each file in tools/tests exports an object of named test functions. A test fails by throwing.
function runTests() {
  const dir = path.join(__dirname, 'tests');
  const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.js')).sort() : [];
  let passed = 0;
  const problems = [];
  for (const file of files) {
    for (const [name, test] of Object.entries(require(path.join(dir, file)))) {
      try {
        test();
        passed += 1;
      } catch (err) {
        problems.push('tools/tests/' + file + '  ' + name + ': ' + err.message);
      }
    }
  }
  return { passed, problems };
}

function count(n, word) {
  return n + ' ' + word + (n === 1 ? '' : 's');
}

function main() {
  const failures = [];
  const report = (label, summary, problems) => {
    console.log(label.padEnd(12) + summary);
    problems.forEach((p) => console.log('  ' + p));
    failures.push(...problems);
  };

  const files = gameFiles();
  const scanned = files.flatMap(scanFile);
  report('scan', count(files.length, 'file') + ', ' + (scanned.length ? count(scanned.length, 'problem') : 'no problems'), scanned);

  const repo = checkRepository();
  report('repository', repo.note, repo.problems);

  const tests = runTests();
  const total = tests.passed + tests.problems.length;
  report('tests', count(total, 'test') + ', ' + tests.passed + ' passed, ' + tests.problems.length + ' failed', tests.problems);

  console.log(failures.length ? 'FAIL: ' + count(failures.length, 'problem') : 'PASS');
  process.exitCode = failures.length ? 1 : 0;
}

main();
