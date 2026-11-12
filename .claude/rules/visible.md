---
paths:
  - "src/render/**"
  - "src/ui/**"
  - "css/**"
  - "index.html"
---

# Rules for anything the player sees

- Read `docs/ART.md` before the first change in a session. Section 2, the keep-out list,
  has no exceptions.
- All art is code. No image files, no SVG loaded from another file, no network address.
- Colours come from the tokens in ART section 4. Three typefaces. One accent colour in a
  scene.
- Animate only `transform` and `opacity`. Honour the system's reduce-motion setting.
- Text on props is real HTML text, in reading order.
- After a visible change, take a screenshot and look at it before saying it is done.
