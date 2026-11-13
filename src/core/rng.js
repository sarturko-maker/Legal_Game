// The seeded generator (SPEC 9). One number drives every random pick in a session, so the
// same seed always gives the same session. Mulberry32: small, fast, and the same everywhere.
(function () {
  const B2B = globalThis.B2B;

  B2B.rng = function (seed) {
    let a = Number(seed) >>> 0;
    const next = function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    // A whole number from 0 to n - 1.
    const int = function (n) { return Math.floor(next() * n); };
    return { next: next, int: int };
  };
})();
