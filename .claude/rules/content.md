---
paths:
  - "packs/**"
  - "docs/scenarios/**"
---

# Content rules

- The scripts in `docs/scenarios/` are the author's. A pack copies them exactly: wording,
  punctuation, numbers, ids, the order of options.
- Do not edit a script file unless the author's message tells you to.
- Do not edit a fixture file by hand. Change `docs/scenarios/fixtures/make-fixtures.js`
  and run it.
- A number changes in three places together: the script, `make-fixtures.js`, the pack.
- Names of people and companies are placeholders in text, never typed out.
- Invented names only. No real company, person, brand or place. Nothing specific to any
  employer.
- After any change to a pack, run `node tools/check.js`.
