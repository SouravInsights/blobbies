# blobbies

**Deterministic, cute SVG avatars from any name.** Zero dependencies, no fonts,
no gradients, no `Math.random` — every decision comes from a seeded hash of the
name, so the same name always draws the same face.

<p>
  <a href="https://www.npmjs.com/package/blobbies"><img alt="npm" src="https://img.shields.io/npm/v/blobbies?color=FFD43B&labelColor=1c1c1c"></a>
  <img alt="zero dependencies" src="https://img.shields.io/badge/dependencies-0-5FD068?labelColor=1c1c1c">
  <a href="LICENSE"><img alt="MIT" src="https://img.shields.io/badge/license-MIT-B79CFF?labelColor=1c1c1c"></a>
</p>

```ts
import { renderAvatarSvg } from 'blobbies';

renderAvatarSvg('Sourav Nanda'); // → "<svg …>"
```

- **Blink in pure CSS** — works inside an `<img src="data:image/svg+xml,…">`.
- **Cursor follow in JS** — one shared pointer listener and one rAF loop for
  every avatar on the page, from the `blobbies/motion` entry point.
- **~1.4 KB per avatar**, ~2 KB of motion, and the motion is a separate entry so
  static users never download it.
- **SSR-safe and typed** — `renderAvatarSvg` returns the same string on the
  server and the client.

## Install

```sh
npm i blobbies
```

The package ships ESM + CJS and declares `sideEffects: false`, so bundlers drop
whatever you do not import.

## Use

```ts
import { renderAvatarSvg, avatarDataUri, getInitials } from 'blobbies';

// an SVG string
el.innerHTML = renderAvatarSvg('Sourav Nanda');

// a data URI for an <img>, CSS or email
img.src = avatarDataUri('Sourav Nanda');

// just the two eye characters
getInitials('Sourav Nanda'); // "SN"
```

Options are the same everywhere:

```ts
renderAvatarSvg('Sourav Nanda', {
  size: 64,
  animate: 'blink',          // false | 'blink' | 'follow' | 'all'
  blinkInterval: [2500, 6000],
  rounded: true,
  color: COLORS.sky,
  expression: 'smirk',
  shape: 'round',
});
```

## Command line

The core is a pure function, so it also ships as a command — handy for scripts,
build steps, and AI agents:

```sh
npx blobbies render "Sourav Nanda" > avatar.svg
npx blobbies render "Ira" --expression wink --color sky --animate all
npx blobbies shapes        # the egg shapes
npx blobbies expressions   # the moods
npx blobbies palette       # the built-in colours
npx blobbies manifest      # the machine-readable capability data
```

## Make it yours

Colors, shapes and moods are set by **name**, not by index:

```ts
import { renderAvatarSvg, COLORS } from 'blobbies';

renderAvatarSvg('Sourav Nanda', {
  color: COLORS.sky,          // or any CSS colour: '#0FA3B1'
  shape: 'round',             // 'tall' | 'wide' | 'squat' | 'round' | 'mid'
  expression: 'smirk',        // any value in EXPRESSIONS
  blush: true,
  tilt: -6,
});
```

Use your own palette — the seed picks from whatever you pass:

```ts
renderAvatarSvg('Sourav Nanda', { palette: ['#0FA3B1', '#FFD166', '#EF476F'] });
```

Give one person many looks without changing who they are. `variant` reseeds the
body; the eyes always come from the name:

```ts
renderAvatarSvg('Sourav Nanda', { variant: 3 });
```

Wrap the renderer in your own SVG shell with `renderAvatarBody`, which returns
the inner markup plus the resolved metadata (letters, seed prefix, blink timing):

```ts
const { body, prefix, letters, blink } = renderAvatarBody('Sourav Nanda');
```

## Options

| Option | Type | Default |
| --- | --- | --- |
| `color` | `string` — any CSS colour, e.g. `COLORS.sky` | seeded |
| `shape` | `'tall' \| 'wide' \| 'squat' \| 'round' \| 'mid'` | seeded |
| `expression` | `'smile' \| 'smirk' \| …` (see `EXPRESSIONS`) | seeded |
| `blush` | `boolean` | seeded |
| `tilt` | `number` (degrees) | seeded |
| `backdrop` | `number` (0..3) | seeded |
| `variant` | `number` — same eyes, another look | `0` |
| `palette` | `readonly string[]` | built-in |
| `size` | `number \| string` | `48` |
| `rounded` | `boolean` | `false` |
| `className` | `string` | – |
| `title` | `boolean` | `false` |
| `animate` | `boolean \| 'blink' \| 'follow' \| 'all'` | `false` |
| `blink` | `boolean` | `true` when animated |
| `blinkInterval` | `[min, max]` ms | `[2500, 6000]` |
| `follow` | `boolean` | `true` when animated |
| `followRange` | `number` | `6` |
| `followTarget` | `'window' \| HTMLElement \| RefObject` | `'window'` |
| `smoothing` | `0..1` | `0.15` |
| `idleTimeout` | `number` ms | `2500` |
| `paused` | `boolean` | `false` |
| `respectReducedMotion` | `boolean` | `true` |
| `wink` / `glance` / `surprise` | `boolean` | `false` |

## Cursor following

```ts
import { attachAvatarMotion } from 'blobbies/motion';

const stop = attachAvatarMotion(svgElement, { followRange: 6, smoothing: 0.15 });
stop(); // removes the listener
```

Follow needs **inline SVG** — a script cannot reach into an `<img>`. Blink does
not, because it is CSS baked into the SVG.

## API

| Export | What it does |
| --- | --- |
| `getInitials(name)` | The two eye characters. |
| `renderAvatarSvg(name, options?)` | A standalone SVG string. |
| `renderAvatarBody(name, options?)` | Inner markup + resolved metadata. |
| `avatarDataUri(name, options?)` | A `data:image/svg+xml,…` URI. |
| `resolveAvatar(name, options?)` | Every seeded decision (its `traits`), without rendering. |
| `CONTRACT_VERSION` | The cross-platform contract version. Bump only on a breaking engine change. |
| `attachAvatarMotion(el, options?)` | From `blobbies/motion`. Returns cleanup. |
| `COLORS` / `PALETTE` | The built-in palette, by name and in order. |
| `BACKDROP_COLOR` / `INK_COLOR` / `BLUSH_COLOR` | The fixed layer colours. |
| `EXPRESSIONS` / `SHAPES` | Every mood and egg shape, by name. |
| `EXPRESSION_NAMES` / `EXPRESSION_COUNT` / `SHAPE_COUNT` | Labels and counts for pickers. |
| `LETTER_PATHS` / `LETTER_BOX` / `STROKE_WIDTH` / `INK_WIDTH` / `hasLetterPath` | The glyph geometry. |
| `hashString` / `cyrb53` / `mulberry32` / `createRng` | The seeding primitives. |

## Porting to another platform

The decisions are the source of truth, and two generated files make a port
possible without reverse-engineering this package:

- **`manifest.json`** — every shape, mood, colour and layout value as JSON.
  Read it, or generate native data files from it; never retype the glyphs.
- **`fixtures/avatar-conformance.json`** — 24 known-correct input/output cases.
  Your port is correct when it reproduces them byte-for-byte.

Both are exported from the package (`blobbies/manifest.json`) and guarded by a
test, so they cannot drift from the code. The full plan — including React Native
and SwiftUI — is in [`docs/PLATFORMS.md`](../../docs/PLATFORMS.md).

## React

```sh
npm i @blobbies/react
```

```tsx
import { Avatar, AvatarPicker } from '@blobbies/react';

<Avatar name="Sourav Nanda" size={40} animate="all" wink />

<AvatarPicker name="Sourav Nanda" onSave={(look) => updateUser({ look })} />
```

## Licence

MIT
