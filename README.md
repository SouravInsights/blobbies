# Blobbies

**Deterministic, cute SVG avatars from a name — published on npm.**

<p>
  <a href="https://www.npmjs.com/package/blobbies"><img alt="blobbies on npm" src="https://img.shields.io/npm/v/blobbies?label=blobbies&color=FFD43B&labelColor=1c1c1c"></a>
  <a href="https://www.npmjs.com/package/@blobbies/react"><img alt="@blobbies/react on npm" src="https://img.shields.io/npm/v/@blobbies/react?label=%40blobbies%2Freact&color=6CC8FF&labelColor=1c1c1c"></a>
  <img alt="zero dependencies" src="https://img.shields.io/badge/dependencies-0-5FD068?labelColor=1c1c1c">
  <a href="LICENSE"><img alt="MIT" src="https://img.shields.io/badge/license-MIT-B79CFF?labelColor=1c1c1c"></a>
</p>

Give Blobbies a name and it takes the first two letters — the **eyes** — and
builds a little blobby character around them: a flat-colored blob, a dark
backdrop, a mouth and optional blush.

Same input → same avatar, forever. No gradients, no filters, no `Math.random` —
every decision comes from a seeded hash of the name. The core is zero
dependencies, the React bindings depend only on the core, and one avatar is
about **1.4 KB** of SVG.

A small set of packages, and you only ship the one you use:

| Package | What it is | Install |
| --- | --- | --- |
| [`blobbies`](https://www.npmjs.com/package/blobbies) | Renderer, hash, glyphs, motion runtime, CLI. Framework-agnostic. | `npm i blobbies` |
| [`@blobbies/react`](https://www.npmjs.com/package/@blobbies/react) | `<Avatar>`, the `<AvatarPicker>`, and React hooks. | `npm i @blobbies/react` |
| `@blobbies/element` | `<blobbies-avatar>` — a web component that works in any framework. | `npm i @blobbies/element` |
| `@blobbies/react-native` | `<Avatar>` for React Native and Expo, over `react-native-svg`. | `npm i @blobbies/react-native` |

```ts
import { renderAvatarSvg } from 'blobbies';

renderAvatarSvg('Sourav Nanda'); // → "<svg …>"
```

```tsx
import { Avatar } from '@blobbies/react';

<Avatar name="Sourav Nanda" animate="all" />;
```

---

## Install

```bash
npm i blobbies            # framework-agnostic core
npm i @blobbies/react     # React bindings (peer: react >= 18)
```

Both packages ship ESM + CJS, are fully typed, and declare `sideEffects: false`
so bundlers drop whatever you do not import. `blobbies/motion` is a separate
entry point, so static users never download the animation runtime.

### Without writing any code

The core is a pure function, so it also ships as a command. Useful in a script,
a design tool, or an AI agent:

```bash
npx blobbies render "Sourav Nanda" > avatar.svg
npx blobbies render "Ira" --expression wink --color sky --animate all
npx blobbies shapes        # list the egg shapes
npx blobbies manifest      # the machine-readable capability data
```

---

## Quick start

Four ways in. Pick the one that matches where the avatar lives.

**1. An SVG string (any framework, or none)**

```ts
import { renderAvatarSvg } from 'blobbies';

el.innerHTML = renderAvatarSvg('Sourav Nanda');
```

**2. A data URI (for `<img>`, CSS, email, anywhere a URL is needed)**

```ts
import { avatarDataUri } from 'blobbies';

img.src = avatarDataUri('Sourav Nanda');
```

**3. React**

```tsx
import { Avatar } from '@blobbies/react';

<Avatar name="Sourav Nanda" size={40} animate="all" />;
```

**4. Just the initials**

```ts
import { getInitials } from 'blobbies';

getInitials('Sourav Nanda'); // "SN"
```

### Server rendering

Everything is pure and SSR-safe — nothing touches `window` or `document` at
import time. `renderAvatarSvg` returns the same string on the server and the
client, so the markup hydrates byte-for-byte. `useAvatarMotion` attaches the
cursor runtime in an effect, so it is a no-op during SSR.

---

## How it works

1. `getInitials(name)` → the two eye characters (`"Sourav Nanda"` → `"SN"`,
   `"Ira"` → `"IR"`, `"@souravinsights"` → `"SO"`, empty/odd input → `"?"`).
   Emoji and punctuation are ignored; non-Latin letters are kept.
2. The name is hashed with **cyrb53** and fed into a **mulberry32** PRNG.
3. The seeded PRNG picks the blob color, shape, rotation, mouth, blush and the
   backdrop nudge — deterministically.
4. `A–Z` / `0–9` eyes are hand-authored, stroke-based SVG paths on a 24×24 grid
   with flat (butt) caps and a heavy-grotesque weight — no fonts. Characters
   outside that set fall back to a bold `<text>` element.
5. Composition: the dark disk is the outer, complete circle. The coloured
   layer is a soft **egg** whose curve was fitted to the reference width
   profile, and it is **clipped to the disk** with a seed-scoped `clipPath` —
   so it can never poke out of the circle or be clipped flat by the viewBox.

The avatar is rendered as independent layers so each can be animated on its own:

```html
<defs><clipPath id="bb-…-c"><circle cx="50" cy="50" r="50"/></clipPath></defs>
<g class="bb-backdrop">…</g>  <!-- dark disk (outer circle) -->
<g class="bb-blob">…</g>      <!-- coloured egg + blush, clipped to the disk -->
<g class="bb-eyes">…</g>      <!-- both eyes, each in a .bb-eye -->
<g class="bb-mouth">…</g>     <!-- mouth -->
```

Every class is scoped with a seed-derived prefix (`bb-…`), so any number of
avatars can share a page without their styles touching.

---

## Animation

All animation is **opt-in** (`animate` defaults to `false`). There are two
runtimes, and they have different constraints.

### Blink — pure CSS, works in an `<img>`

`renderAvatarSvg(name, { animate: 'blink' })` embeds a tiny, seed-scoped
`<style>` block that scales each `.bb-eye` vertically (`scaleY(1 → 0.1 → 1)`).
Timing comes from the seeded hash, so avatars never blink in sync, and ~1 in 4
blinks is a quick double blink. It is disabled under
`@media (prefers-reduced-motion: reduce)`.

Because it is plain CSS inside the SVG, **blink works everywhere**, including:

```html
<img src="data:image/svg+xml,…" />  <!-- ✅ blinks -->
```

Use `avatarDataUri(name, { animate: 'blink' })` to get that data URI.

### Follow — JS, inline SVG only

```ts
import { attachAvatarMotion } from 'blobbies/motion';

const cleanup = attachAvatarMotion(svgElement, { followRange: 6, smoothing: 0.15 });
// …later
cleanup();
```

- One shared `pointermove` listener per target (usually just `window`) and **one**
  `requestAnimationFrame` loop for every attached avatar.
- For each avatar it computes the vector from its centre to the pointer, clamps
  it to `followRange` (in viewBox units) and writes `--look-x` / `--look-y` CSS
  variables on the `<svg>`. The DOM is never re-rendered.
- Only the **facial features** move — the colored blob and the dark disk stay
  fixed in place. Eyes track the pointer at 100% of the range and the mouth at
  70%, so the face shifts subtly without the body ever sliding around.
- Motion is smoothed with a lerp; after `idleTimeout` ms of no pointer movement
  it eases back to centre.
- Pauses when the tab is hidden (`visibilitychange`) and when the avatar is
  off-screen (`IntersectionObserver`).

> **Cursor follow requires inline SVG.** It cannot work inside
> `<img src="data:image/svg+xml,…">`, because scripts can't reach into an image's
> DOM. Use the React `<Avatar>` component (or your own inline SVG) for follow.

### Extras (default off)

`wink` (wink on click), `glance` (periodic random glance when idle) and
`surprise` (a small pop when the pointer gets very close).

---

## Making it yours

### Semantic props

Colors, shapes and moods are set by **name**, not by index. The trait props read
as the things they are — a colour, a mood, an egg — which is what a custom UI
wants to put in front of a person.

```tsx
import { Avatar, COLORS } from '@blobbies/react';

<Avatar name="Sourav Nanda" color={COLORS.sky} expression="smirk" shape="round" blush />;
```

```ts
renderAvatarSvg('Sourav Nanda', { color: COLORS.sky, expression: 'smirk', shape: 'round' });
```

| Trait | Values |
| --- | --- |
| `color` | Any CSS colour, or `COLORS.sky` for the built-in set |
| `shape` | `'tall' \| 'wide' \| 'squat' \| 'round' \| 'mid'` |
| `expression` | `'smile' \| 'smirk' \| …` — every mood in `EXPRESSIONS` |
| `blush` | `boolean` |
| `tilt` | `number` (degrees) |
| `backdrop` | `number` (0..3) |

### Your own palette

A brand palette is just an array of hex values. The seeded hash picks from
whatever you give it, and `color` still overrides a single avatar.

```tsx
<Avatar name="Sourav Nanda" color="#0FA3B1" />
<Avatar name="Sourav Nanda" palette={['#0FA3B1', '#FFD166', '#EF476F']} />
```

### Many looks, one person

`variant` reseeds only the body. The eyes still come from the name, so the same
person can have many looks without ever becoming someone else.

```tsx
<Avatar name="Sourav Nanda" variant={3} />
```

### Wrap the renderer

`renderAvatarBody` returns the inner markup plus the resolved metadata (letters,
seed prefix, blink timing) so you can drop Blobbies into your own SVG shell.

```ts
import { renderAvatarBody } from 'blobbies';

const { body, prefix, letters, blink } = renderAvatarBody('Sourav Nanda');
```

---

## The picker

`@blobbies/react` ships a ready-made **look map**. Columns are colours, rows are
moods, and the map wraps in both directions, so it never ends. Every face is a
version of the same person — the eyes come from `name` and never change.

**Drag or swipe** to pan, **trackpad** to glide, **arrow keys** to move.
Hovering brings a face forward; cells shrink and fade with distance from it, so
the edges dissolve without ever clipping the chosen face.

The map sizes its own grid to whatever box it is given — a full settings page, a
380px popover, or a phone dialog — so it never clips its edge faces. Drop the
same component into a dialog, an inline settings row, a popover or a sign-up
step.

```tsx
import { Avatar, AvatarPicker } from '@blobbies/react';

<AvatarPicker
  name="Sourav Nanda"
  defaultValue={user.look}
  onSave={(look) => updateUser({ look })}
  onCancel={() => setOpen(false)}
/>;

// The saved look is the same props you pass to <Avatar>.
<Avatar name="Sourav Nanda" {...saved} size={40} />;
```

| Prop | Default | What it does |
| --- | --- | --- |
| `name` | required | The person's name — the eyes every look shares. |
| `defaultValue` | seeded | The look to open on (`AvatarOptions`). Read once. |
| `palette` | `PALETTE` | The colours the map offers — pass your own. |
| `onChange` | – | Called with the current look as it changes. |
| `onSave` | – | Called with the look when Save is pressed. |
| `onCancel` | – | Shows Cancel and calls this. |
| `title` / `description` | `'Choose an avatar'` / … | Header copy. Pass `''` to hide. |
| `saveLabel` | `'Save'` | Save button label. |
| `spotlight` | `true` | Start with the depth-of-field spotlight on. The picker also ships a Spotlight toggle. |
| `className` | – | Added to the root. |
| `unstyled` | `false` | Skip the panel styles; style the parts yourself. |

### Theme it

The panel is themed entirely with CSS variables. Set them on the root (or an
ancestor) and the picker follows your product.

| Variable | |
| --- | --- |
| `--bb-picker-panel` | Surface background |
| `--bb-picker-ink` | Primary text and marks |
| `--bb-picker-muted` | Secondary text |
| `--bb-picker-line` | Borders and dividers |
| `--bb-picker-accent` | Save button background |
| `--bb-picker-accent-ink` | Save button text |
| `--bb-picker-radius` | Panel corner radius |
| `--bb-picker-shadow` | Panel shadow |
| `--bb-picker-spring` | The spring curve for pops |
| `--bb-picker-fade` | The short curve for colour |

```css
.brand-picker {
  --bb-picker-panel: #101014;
  --bb-picker-accent: #ffd43b;
  --bb-picker-accent-ink: #1c1c1c;
}
```

### Rebuild the layout

The preset is only a composition of parts. Import the parts, keep the state, and
lay them out however your product needs. Every part carries a `data-part`
attribute (`root`, `header`, `title`, `description`, `surface`, `preview`,
`mood`, `blush`, `spotlight`, `reset`, `cancel`, `save`, `footer`) for your own
CSS hooks.

```tsx
import {
  AvatarPickerRoot,
  AvatarPickerSurface,
  AvatarPickerPreview,
  AvatarPickerMood,
  AvatarPickerBlush,
  AvatarPickerSpotlight,
  AvatarPickerReset,
  AvatarPickerSave,
  AvatarPickerCancel,
  useAvatarPicker,
} from '@blobbies/react';

<AvatarPickerRoot name={user.name} defaultValue={user.look} onSave={save} unstyled>
  <AvatarPickerPreview size={72} />
  <AvatarPickerSurface />
  <AvatarPickerMood />
  <AvatarPickerBlush />
  <AvatarPickerSpotlight />
  <AvatarPickerReset />
  <AvatarPickerSave>Keep it</AvatarPickerSave>
  <AvatarPickerCancel />
</AvatarPickerRoot>;
```

`useAvatarPicker()` exposes the state when you want to render your own controls:

```ts
const {
  value, changed, blush, spotlight, palette,
  expressionName, nextExpression, previousExpression,
  toggleBlush, toggleSpotlight, reset, save, cancel, hasCancel,
} = useAvatarPicker();
```

---

## Options reference

The same options are accepted by the core renderer and the React component.

```ts
type AvatarOptions = {
  // Look — each defaults to a value seeded from the name
  color?: string                            // any CSS colour, e.g. COLORS.sky
  shape?: 'tall' | 'wide' | 'squat' | 'round' | 'mid'
  expression?: 'smile' | 'smirk' | …        // EXPRESSIONS
  blush?: boolean
  tilt?: number                             // degrees
  backdrop?: number                         // 0..3
  variant?: number                          // 0 — same eyes, another look
  palette?: readonly string[]               // the built-in palette

  // Render
  size?: number | string                    // 48
  rounded?: boolean                         // false
  className?: string
  title?: boolean                           // false

  // Motion
  animate?: boolean | 'blink' | 'follow' | 'all'  // false
  blink?: boolean                           // true when animated
  blinkInterval?: [number, number]          // [2500, 6000]
  follow?: boolean                          // true when animated
  followRange?: number                      // 6
  followTarget?: 'window' | Element         // 'window'
  smoothing?: number                        // 0.15
  idleTimeout?: number                      // 2500
  paused?: boolean                          // false
  respectReducedMotion?: boolean            // true
  wink?: boolean                            // false
  glance?: boolean                          // false
  surprise?: boolean                        // false
};
```

### Core API (`blobbies`)

| Export | Description |
| --- | --- |
| `getInitials(name)` | The two eye characters (`"SN"`). |
| `renderAvatarSvg(name, options?)` | Full standalone SVG **string**. |
| `renderAvatarBody(name, options?)` | Inner markup + resolved metadata (for wrappers). |
| `avatarDataUri(name, options?)` | `data:image/svg+xml,…` (static / blink-only). |
| `attachAvatarMotion(svg, options?)` | From `blobbies/motion`. Returns a cleanup fn. |
| `resolveAvatar(name, options?)` | Every seeded decision, without rendering. |
| `COLORS` | The built-in palette by name (`COLORS.sky`, …). |
| `PALETTE` | The same colours, in canonical order. |
| `BACKDROP_COLOR` / `INK_COLOR` / `BLUSH_COLOR` | The fixed layer colours. |
| `EXPRESSIONS` / `SHAPES` | Every mood and egg shape, by name. |
| `EXPRESSION_NAMES` | Display names for every expression, for labels. |
| `EXPRESSION_COUNT` / `SHAPE_COUNT` | How many expressions and egg shapes there are. |
| `LETTER_PATHS` / `LETTER_BOX` / `STROKE_WIDTH` / `INK_WIDTH` / `hasLetterPath` | The hand-drawn glyph geometry. |
| `hashString` / `cyrb53` / `mulberry32` / `createRng` | The deterministic seeding primitives. |

### React API (`@blobbies/react`)

| Export | Description |
| --- | --- |
| `<Avatar name …options />` | Inline, SSR-safe SVG (`role="img"`, `aria-label`). |
| `<AvatarPicker name … />` | The preset look map. |
| `AvatarPickerRoot` + parts | Build your own layout (see above). |
| `AvatarPickerPreview` | The chosen face, for layouts that show it outside the map. |
| `useAvatarPicker()` | The picker state, for custom controls. |
| `useAvatarMotion(ref, options?)` | Attach motion to your own SVG. |
| `AvatarPickerProps`, `AvatarPickerState`, `AvatarProps`, … | The public types. |

`useAvatarMotion` keeps one stable options object and only re-attaches when the
follow target or enabled state changes — pointer movement never triggers a
re-render.

---

## Palette

Flat, bright and friendly. Every colour is verified to read well with the
`#1c1c1c` eyes and `#2f2f2f` backdrop, on light and dark pages.

| Name | Hex | | Name | Hex | | Name | Hex |
| --- | --- | --- | --- | --- | --- | --- | --- |
| yellow | `#FFD43B` | | green | `#5FD068` | | sky | `#6CC8FF` |
| coral | `#FF7B7B` | | lavender | `#B79CFF` | | peach | `#FFB074` |
| mint | `#5EE0C0` | | pink | `#FF8FC7` | | orange | `#FFA64D` |

---

## Development

This is a pnpm workspace with two published packages and a demo app.

```
packages/core     blobbies          – hash, initials, SVG, animation runtimes
packages/react    @blobbies/react   – <Avatar>, <AvatarPicker>, hooks
apps/demo         blobbies-demo     – Vite + React playground
```

```bash
pnpm install
pnpm dev          # demo at http://localhost:5173
pnpm test         # vitest across packages
pnpm build        # tsup build of both packages
pnpm typecheck    # tsc across the workspace
```

Two files are generated from the code and checked by a test, so they can never go
stale. Never edit them by hand — change the source, run the script, commit both:

```bash
pnpm --filter blobbies export:fixtures   # fixtures/avatar-conformance.json
pnpm --filter blobbies export:manifest   # manifest.json
```

Planning a new framework or platform? Read [`docs/PLATFORMS.md`](docs/PLATFORMS.md).
Working with an AI agent? Point it at [`AGENTS.md`](AGENTS.md) and [`llms.txt`](llms.txt).

Preview sheets (generated, then opened in a browser):

```bash
pnpm preview:letters   # apps/demo/preview/letters.html
pnpm preview:avatars   # apps/demo/preview/avatars.html
pnpm preview:blink     # apps/demo/preview/blink-img.html
```

---

## License

MIT © Blobbies contributors
