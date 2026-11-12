# Art direction

How the game looks and moves. `docs/SPEC.md` says what exists; this file says what it
looks like. Every value here is a starting point that the author may change at the art
check-in (milestone M3). After that check-in the values are fixed for version 1.

## 1. The look in one sentence

**A letterpress Western: flat silhouettes in layered depth against big skies, with the
story told on beautifully printed paper.**

Two things carry the visual quality, and effort goes to them first:

1. **Depth and light.** A street that moves in layers as you walk, under a sky that
   changes with the story.
2. **Paper.** Telegrams, contract pages, posters and ledgers set in real type, large,
   crisp, with the small touches of a printed thing.

Characters and buildings are simple on purpose. A silhouette drawn in code looks right. A
detailed face drawn in code does not.

## 2. Keep-out list

Constraint C9 in the spec. None of these appear anywhere, in any form:

- Covered wagons, oxen, wagon trains, a trail or route map with progress along it.
- River crossings, fording, ferries. Hunting. Tombstones or epitaphs.
- Illness or death of a travelling party. Supplies, rations, pace settings, spare parts,
  or anything that runs out along a journey.
- Pixel art, 8-bit or 16-bit styling, green-screen or early-computer styling.
- Any wording, screen layout, menu or sound from The Oregon Trail or any other game.
- Real brands, real railroad or telegraph company names, real people, real places.
- Gunfights, weapons drawn or fired, hangings. Depictions of Native Americans.
- Gambling imagery. Emoji. Stock clip art.

The game is about trade in a town. It is never about a journey or about survival.

## 3. Stage and layers

Logical stage: 1920×1080. The street is 9,600 logical pixels long, five screens.

Each layer is its own element, moved only with CSS `transform`, so the browser can move
it without redrawing. A layer's width is `1920 + factor × 7,680`.

| # | Layer | Parallax factor | Contents |
|---|---|---|---|
| 0 | Sky | 0 | A vertical gradient per mood. Moods cross-fade. |
| 1 | Sun, moon, far cloud | 0.02 | One disc, a few long clouds. |
| 2 | Far mesas | 0.08 | A flat, pale range. One tone. |
| 3 | Hills | 0.20 | Rolling ground, a windmill, the railway line and telegraph poles running off east. |
| 4 | Back row | 0.45 | Rooftops, a church spire, the water tower, washing lines. Two tones. |
| 5 | The street | 1.00 | Building fronts, boardwalk, signs, cast, the player, the train. Three tones and one accent. |
| 6 | Foreground | 1.40 | Hitching posts, barrels, a fence, a cactus or two, crates. Near-black, slightly soft. |
| 7 | Atmosphere | fixed | Dust motes (one small canvas), a vignette, a paper-grain overlay. |

Depth comes from value: far is pale and low-contrast, near is dark. There are no outlines,
and no gradients inside objects. Gradients are for the sky, lamp glow and the vignette.

The paper-grain overlay is one static SVG turbulence texture at low opacity over the whole
stage. It is never animated.

## 4. Colour

Tokens, as CSS custom properties on the stage root.

| Token | Value | Use |
|---|---|---|
| `--paper` | `#F1E4C9` | Props, letterbox bars |
| `--paper-edge` | `#D9C7A3` | Prop edges, ruled lines |
| `--ink` | `#2B211C` | Type, nearest silhouettes |
| `--red` | `#A63A2B` | Stamps, negative amounts, one accent per scene |
| `--ochre` | `#E0A63F` | Lamplight, sun, lit windows |
| `--sage` | `#7A8B6A` | Shutters, one building accent |
| `--dust` | `#C9A27A` | Ground, haze |

Sky gradients, top to horizon:

| Mood | Stops | Feeling | Extras |
|---|---|---|---|
| `dawn` | `#2E3A5C`, `#E7A07A`, `#F6D9A8` | A new deal | Long shadows, no lamps |
| `day` | `#7FB3C8`, `#CFE3DC`, `#F3E3BF` | Business as usual | Heat shimmer low on the horizon |
| `dusk` | `#3B2F5B`, `#C7624A`, `#F2B25C` | Decision made, or pressure easing | Windows begin to glow, rim light on the street layer |
| `night` | `#0E1022`, `#1F2440`, `#3A3A5C` | Consequences | Lit windows, lanterns, moon |
| `storm` | `#2A2D33`, `#5A5A57`, `#9A8F7A` | The customer is leaning on you | Fast low cloud, dust gusts, signs swing hard, a tumbleweed |

Each mood also shifts the silhouette tones of layers 2 to 6 through tokens, so the whole
scene changes together. A mood change takes about 2.5 seconds. No lightning, nothing
flashes.

## 5. The town

Positions are the x of each door on the street layer.

| x | Building | Notes |
|---|---|---|
| 700 | `depot` | Platform, signal, track running off-screen west. The train stops here. |
| 2,000 | `telegraph` | Poles and wires lead away from it. The runner starts here. |
| 3,300 | `supply` | The player's firm. The biggest sign on the street. A counter visible through the window. |
| 4,300 | Bank | Scenery in version 1. |
| 5,200 | `law` | Narrow two-storey front, shelves of books in the window. |
| 6,500 | `courthouse` | The only building with columns and a flag. |
| 7,400 | Saloon and stable | Scenery. |
| 8,700 | `yard` | The site office: a hut, a derrick, stacked cable drums, track being laid east. |

Buildings are Western false-fronts: a tall flat facade with a sign, a lower roof behind.
Signs are real text in the display face. Each building has one thing that moves a little:
a swinging sign, smoke, a flag, the derrick arm.

## 6. Figures

- Height about 170 logical pixels. Silhouette plus one accent colour.
- The player: hat, coat, satchel. Walks with a two-pose leg swing, opposite arm swing,
  a slight bob. Step rate follows speed. Stands with a slow breath.
- The cast are told apart by outline, not by face.

| `look` | Outline cue |
|---|---|
| `clerk` | Eyeshade, sleeve garters |
| `lawyer` | Long coat, a book under one arm |
| `buyer` | Top hat, cane |
| `foreman` | Bowler hat, rolled drawing |
| `engineer` | Tripod instrument beside him |
| `official` | High collar, ledger held flat |
| `runner` | A boy at full tilt, cap flying |

For `say`, the speaker appears as an oval portrait: the same silhouette, cropped at the
chest, in a printed frame.

## 7. Motion

- Walking speed 320 logical pixels a second. No trip takes more than 6 seconds: on a long
  trip the character hurries and the camera glides. Any input ends the trip at once.
- The camera eases in and out. It leads the character slightly in the direction of travel.
- Arrival: the camera settles so that the building's door is a third of the way across.
- Props rise from the bottom of the screen in about 300 ms while the scene behind dims
  and blurs slightly. They leave the same way.
- Telegrams type at about 45 characters a second. Any input finishes the telegram.
- Pages turn over on their vertical axis in about 400 ms, one after another.
- Stamps land with a small overshoot and a slight rotation, never perfectly straight.
- The train (`event: trainOut`, `trainIn`): engine and two flat cars, steam in soft puffs,
  about 4 seconds, skippable.
- Feedback to any input within 100 ms.
- Only `transform` and `opacity` are animated.

Things that are always gently alive: chimney smoke, signs, the windmill, birds on the
telegraph wire, dust motes, lamp glow after dusk.

## 8. Type

Three faces, all open-licence, embedded as base64 in `css/fonts.css`, subset to basic
Latin, punctuation and digits.

| Role | Candidate | Used for |
|---|---|---|
| Display, wood type | Rye | Signs, posters, headlines, the title |
| Typewriter | Special Elite | Telegrams |
| Text | IM Fell English, regular and italic | Pages, ledger, cards, speech, options |

Before using a font: download it from the Google Fonts repository on GitHub, read its
licence file, confirm it allows embedding and redistribution, and commit the licence text
to `css/licences/`. If a candidate fails that test, propose another at the check-in.

Sizes at the logical stage, normal text setting: body 30, option label 34, option note 24,
telegram 34, poster headline 150 or more, sign text to fit. The large setting scales the
props, not the scene.

## 9. The paper props

All props sit on `--paper`, with a soft shadow and a very slight rotation (under one
degree, different each time, fixed for the life of the prop) so that nothing looks
machine-placed.

- **Telegram.** A printed form: company name across the top, ruled lines, a received
  stamp. Sender in the corner. Message in typewriter capitals. STOP is set slightly
  lighter than the words around it.
- **Page.** Contract paper: a title line, numbered clauses in the text face, generous
  margins. Face down, it shows a blank back with the edge of a red seal. A marked clause
  has a pencil line in the margin.
- **Ledger.** Ruled columns. Labels left, amounts right in tabular figures, negatives in
  red with a minus sign. The result line is double-ruled and arrives last.
- **Card.** A stiff printed card, title in display type, numbered points.
- **Poster.** Wood type at full size, slightly uneven inking, nail holes in the corners.
  A stamp may land across it.
- **Paper.** Newspaper front page: masthead with the town's name, a rule, a headline, two
  or three lines of body, a date line.
- **Say.** The portrait oval, the name and title beneath, the words in a panel to the
  right.
- **Note.** One or two lines of text low on the screen over the scene, on a strip of
  paper.

Choice and pick panels: each option is a paper ticket with its key number in a circle.
A picked ticket is punched, with a visible hole and a tick. Never colour alone.

## 10. The quality bar for the art check-in

The M3 slice passes when a person who has never seen it says it looks good, and when all
five of these are true on screen:

| Test | What must be visible |
|---|---|
| Depth | At least five layers moving at different speeds during a walk |
| Light | A mood change from `day` to `dusk` that alters sky, buildings and windows together |
| Life | At least three things moving when the player stands still |
| Craft | A telegram that a typographer would not be embarrassed by |
| Response | Every input acknowledged within 100 ms, and a walk that can be skipped |

## 11. Things that make it worse

Gradients on objects. Drop shadows on interface elements. Rounded modern buttons. More
than three typefaces. More than one accent colour in a scene. Sepia photo filters.
Outlined cartoon characters. Detailed faces. Bouncy easing. Anything that blinks.
