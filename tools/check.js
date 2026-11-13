#!/usr/bin/env node
/*
 * The machine check: docs/SPEC.md section 12.1. Exits non-zero on any failure.
 * The Stop hook runs it at the end of every turn, so it has to stay fast.
 *
 * Run: node tools/check.js [--pack <file>]
 * --pack also loads one extra pack after the public one, as the game would, and checks it
 * (PACK-FORMAT 7): node tools/check.js --pack packs/private.js
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const FIXTURES = path.join(ROOT, 'docs', 'scenarios', 'fixtures');

// What the game loads. Only .html, .css and .js are read by the browser, so licence
// texts kept beside the fonts are not scanned.
const GAME_PATHS = ['index.html', 'text.html', 'css', 'src', 'packs'];
const LOADED = /\.(html|css|js)$/;

const RULES = [
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

// Everything is scanned, comments included. SPEC 12.1 allows two exceptions only: licence
// text inside a comment, and the SVG namespace. Licence comments are blanked rather than
// removed, to keep line numbers right.
function withoutLicences(text) {
  return text.replace(BLOCK_COMMENT, (m) => (/licen[cs]e/i.test(m) ? m.replace(/[^\n]/g, ' ') : m));
}

function scanFile(rel) {
  const text = withoutLicences(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
  const rules = rel.startsWith('src/core/') ? RULES.concat(CORE_RULES) : RULES;
  const problems = [];
  text.split('\n').forEach((line, i) => {
    const at = rel + ':' + (i + 1) + '  ';
    for (const [name, re] of rules) {
      if (re.test(line)) problems.push(at + name);
    }
    for (const m of line.matchAll(ADDRESS)) {
      if (!m[0].startsWith(SVG_NAMESPACE)) problems.push(at + 'web address ' + m[0]);
    }
  });
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

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

function sameKeys(a, b) {
  const keys = Object.keys(Object.assign({}, a, b));
  return keys.every((key) => same(a[key], b[key]));
}

// PACK-FORMAT 6, rule 8: replay every fixture path through the real engine and pack.
function checkFixtures(B2B) {
  const problems = [];
  const notes = [];
  let paths = 0;
  const files = fs.readdirSync(FIXTURES).filter((f) => f.endsWith('-paths.json')).sort();
  for (const file of files) {
    const fx = JSON.parse(fs.readFileSync(path.join(FIXTURES, file), 'utf8'));
    const scenario = B2B.packs.scenarios().find((sc) => sc.id === fx.scenario);
    if (!scenario) {
      notes.push(fx.scenario + ' is in no pack yet');
      continue;
    }
    if (!sameKeys(scenario.k, fx.k)) problems.push(file + '  the pack\'s k differs from the fixture\'s k');
    for (const p of fx.paths) {
      const at = file + '  ' + p.path.map((step) => [].concat(step).join(',')).join(' ') + ': ';
      paths += 1;
      let state;
      try {
        state = B2B.engine.replay(scenario, B2B.packs.house(), p.path);
      } catch (err) {
        problems.push(at + err.message);
        continue;
      }
      if (state.nodeId !== p.ending) problems.push(at + 'ends at ' + state.nodeId + ', expected ' + p.ending);
      if (p.vars) {
        for (const key of Object.keys(p.vars)) {
          if (!same(state.vars[key], p.vars[key])) problems.push(at + 'var ' + key + ' is ' + JSON.stringify(state.vars[key]) + ', expected ' + JSON.stringify(p.vars[key]));
        }
      }
      const settled = scenario.settle(state.vars, scenario.k);
      for (const key of Object.keys(p.expect)) {
        const got = key === 'lines' ? settled.lines.map((l) => ({ id: l.id, amount: l.amount })) : settled[key];
        if (!same(got, p.expect[key])) problems.push(at + key + ' is ' + JSON.stringify(got) + ', expected ' + JSON.stringify(p.expect[key]));
      }
      const whatIfs = B2B.engine.result(state).whatIfs.map((w) => ({ id: w.id, state: w.state, amount: w.amount }));
      if (!same(whatIfs, p.whatIfs)) problems.push(at + 'what-ifs are ' + JSON.stringify(whatIfs) + ', expected ' + JSON.stringify(p.whatIfs));
    }
  }
  return { summary: count(paths, 'path') + ' replayed' + (notes.length ? '; ' + notes.join('; ') : ''), problems };
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

  let B2B = null;
  try {
    B2B = require('./load')();
  } catch (err) {
    report('packs', 'the game scripts did not load', [err.stack.split('\n').slice(0, 3).join(' / ')]);
  }
  if (B2B) {
    const scenarios = B2B.packs.scenarios().map((sc) => sc.id);
    const packProblems = B2B.packs.problems();
    report('packs', count(scenarios.length, 'scenario') + ' (' + scenarios.join(', ') + '), ' + (packProblems.length ? count(packProblems.length, 'problem') : 'no problems'), packProblems);
    const fixtures = checkFixtures(B2B);
    report('fixtures', fixtures.summary, fixtures.problems);
  }

  const repo = checkRepository();
  report('repository', repo.note, repo.problems);

  const tests = runTests();
  const total = tests.passed + tests.problems.length;
  report('tests', count(total, 'test') + ', ' + tests.passed + ' passed, ' + tests.problems.length + ' failed', tests.problems);

  // Loaded last, so the fixtures and tests above see the public pack alone.
  const at = process.argv.indexOf('--pack');
  if (at >= 0 && B2B) {
    const file = path.resolve(process.argv[at + 1] || '');
    const rel = path.relative(ROOT, file);
    if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
      report('pack', rel, ['no such file: ' + rel]);
    } else {
      const before = B2B.packs.problems().length;
      const problems = scanFile(rel);
      try {
        require(file);
        problems.push(...B2B.packs.problems().slice(before));
      } catch (err) {
        problems.push(rel + ' did not load: ' + err.message);
      }
      const now = B2B.packs.scenarios().map((sc) => sc.id);
      report('pack', rel + ': the game would offer ' + now.join(', ') + '; ' + count(B2B.packs.wildcards().length, 'wildcard') + '; ' + (problems.length ? count(problems.length, 'problem') : 'no problems'), problems);
    }
  }

  console.log(failures.length ? 'FAIL: ' + count(failures.length, 'problem') : 'PASS');
  process.exitCode = failures.length ? 1 : 0;
}

main();
