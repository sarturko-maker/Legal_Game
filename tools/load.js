// Loads the game's core and the public pack into Node, in the order index.html loads them.
// The files are classic browser scripts: each one attaches what it makes to globalThis.B2B.
'use strict';
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SCRIPTS = ['src/core/namespace.js', 'src/core/rng.js', 'src/core/packs.js', 'src/core/engine.js', 'packs/public.js'];

module.exports = function load() {
  if (!globalThis.B2B || !globalThis.B2B.engine) {
    SCRIPTS.forEach((file) => require(path.join(ROOT, file)));
  }
  return globalThis.B2B;
};
