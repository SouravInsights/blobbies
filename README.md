# Blobbies

Deterministic, cute SVG avatars generated from a name. Give Blobbies a name and it
takes the first two letters — the **eyes** — and builds a little blobby character
around them: a flat-colored blob, a dark backdrop, a mouth and optional blush.

Same input → same avatar, forever. Zero runtime dependencies. No gradients, no
filters, no `Math.random` — every decision comes from a seeded hash of the name.

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

---

## The three animation tiers

All animation is **opt-in** (`animate` defaults to `false`).

### Tier 1 — Blink (pure CSS)

`renderAvatarSvg(name, { animate: 'blink' })` embeds a tiny, seed-scoped
`<style>` block that scales each `.bb-eye` vertically (`scaleY(1 → 0.1 → 1)`).
Timing comes from the seeded hash, so avatars never blink in sync, and ~1 in 4
blinks is a quick double blink. It is disabled under
`@media (prefers-reduced-motion: reduce)`.

Because it is plain CSS inside the SVG, **blink works everywhere**, including:

```html
<img src="data:image/svg+xml,…" />  <!-- ✅ blinks -->
```

Use `avatarDataUri(name, { animate: 'blink' })` to get that data URI. Class names
are scoped with a seed-derived prefix so multiple avatars on one page never clash.

### Tier 2 — Cursor follow (JS, inline SVG only)

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
  fixed in place. Eyes track the pointer at 100 % of the range and the mouth at
  70 %, so the face shifts subtly without the body ever sliding around.
- Motion is smoothed with a lerp; after `idleTimeout` ms of no pointer movement
  it eases back to centre.
- Pauses when the tab is hidden (`visibilitychange`) and when the avatar is
  off-screen (`IntersectionObserver`).
- SSR-safe: nothing touches `window` / `document` at import time.

> **Cursor follow requires inline SVG.** It cannot work inside
> `<img src="data:image/svg+xml,…">`, because scripts can't reach into an image's
> DOM. Use the React `<Avatar>` component (or your own inline SVG) for follow.

### Tier 3 — Extras (default off)

`wink` (wink on click), `glance` (periodic random glance when idle) and
`surprise` (a small pop when the pointer gets very close).

---

## Options

The same options are accepted by the core renderer and the React component.

| Option                  | Type                                                        | Default              |
| ----------------------- | ----------------------------------------------------------- | -------------------- |
| `animate`               | `boolean \| 'blink' \| 'follow' \| 'all'`                   | `false`              |
| `blink`                 | `boolean`                                                   | `true` when animated |
| `blinkInterval`         | `[min, max]` in ms                                          | `[2500, 6000]`       |
| `follow`                | `boolean`                                                   | `true` when animated |
| `followRange`           | `number` (max eye travel, viewBox units)                    | `6`                  |
| `followTarget`          | `'window' \| HTMLElement \| RefObject<HTMLElement>`         | `'window'`           |
| `smoothing`             | `number` `0..1`                                             | `0.15`               |
| `idleTimeout`           | `number` ms before returning to centre                      | `2500`               |
| `paused`                | `boolean`                                                   | `false`              |
| `respectReducedMotion`  | `boolean`                                                   | `true`               |
| `wink` / `glance` / `surprise` | `boolean`                                            | `false`              |
| `size`                  | `number \| string`                                          | `48`                 |
| `rounded`               | `boolean` (circular clip)                                   | `false`              |
| `className`             | `string`                                                    | –                    |
| `title`                 | `boolean` (render an SVG `<title>`)                         | `false`              |
| `palette`               | `readonly string[]` — the colours the seed draws from        | `PALETTE`            |
| `variant`               | `number` (which look for this name)                         | `0`                  |
| `color`                 | `string` (any CSS colour; `COLORS.sky` for the built-in set)  | seeded               |
| `shape`                 | `'tall' \| 'wide' \| 'squat' \| 'round' \| 'mid'`             | seeded               |
| `expression`            | `'smile' \| 'smirk' \| …` (see `EXPRESSIONS`)                 | seeded               |
| `blush`                 | `boolean`                                                    | seeded               |
| `tilt`                  | `number` (degrees)                                           | seeded               |
| `backdrop`              | `number` (0..3)                                              | seeded               |

`variant` reseeds only the body. The eyes still come from the name, so the
same person can have many looks without ever becoming someone else.

The individual trait props set the parts explicitly, which is what a picker
uses to let someone build the look they want while keeping their own eyes.
They read as the things they are — a colour, a mood, an egg — not as indices:

```tsx
import { Avatar, COLORS } from '@blobbies/react';

<Avatar name="Sourav Nanda" color={COLORS.sky} expression="smirk" shape="round" blush />;
```

`color` takes any CSS colour, so a custom palette is just your own hex values:

```tsx
<Avatar name="Sourav Nanda" color="#0FA3B1" />
<Avatar name="Sourav Nanda" palette={['#0FA3B1', '#FFD166', '#EF476F']} />
```

```ts
renderAvatarSvg('Sourav Nanda', { color: COLORS.sky, expression: 'smirk', shape: 'round' });
// COLORS, EXPRESSIONS, SHAPES, EXPRESSION_NAMES, EXPRESSION_COUNT and
// SHAPE_COUNT are exported for pickers and custom UIs.
```

### Core API (`blobbies`)

| Export                                        | Description                                        |
| --------------------------------------------- | -------------------------------------------------- |
| `getInitials(name)`                           | The two eye characters (`"SN"`).                   |
| `renderAvatarSvg(name, options?)`             | Full standalone SVG **string**.                    |
| `renderAvatarBody(name, options?)`            | Inner markup + resolved metadata (for wrappers).   |
| `avatarDataUri(name, options?)`               | `data:image/svg+xml,…` (static / blink-only).      |
| `attachAvatarMotion(svg, options?)`           | From `blobbies/motion`. Returns a cleanup fn.      |
| `resolveAvatar(name, options?)`               | Every seeded decision, without rendering.          |
| `COLORS`                                      | The built-in palette by name (`COLORS.sky`, …).    |
| `PALETTE`                                     | The same colours, in canonical order.              |
| `EXPRESSIONS` / `SHAPES`                      | Every expression and egg shape, by name.           |
| `EXPRESSION_NAMES`                            | Names of every expression, for labels.             |
| `EXPRESSION_COUNT` / `SHAPE_COUNT`            | How many expressions and egg shapes there are.     |

### React (`@blobbies/react`)

| Export                                | Description                                             |
| ------------------------------------- | ------------------------------------------------------- |
| `<Avatar name …options />`            | Inline, SSR-safe SVG (`role="img"`, `aria-label`).      |
| `<AvatarPicker name … />`             | The picker: a draggable map of looks (colour × mood).   |
| `useAvatarMotion(ref, options?)`      | Attach motion to your own SVG.                          |

`useAvatarMotion` keeps one stable options object and only re-attaches when the
follow target or enabled state changes — pointer movement never triggers a
re-render.

### AvatarPicker

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

Every face is a version of the same person — the eyes come from `name` and never
change. The map wraps in both directions, so it never ends: **drag or swipe** to
pan, **trackpad** to glide, **arrow keys** to move. Hovering brings a face
forward; cells shrink and fade with distance from it, so the edges dissolve
without ever clipping the chosen face.

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

Theme it with variables: `--bb-picker-panel`, `--bb-picker-ink`,
`--bb-picker-muted`, `--bb-picker-line`, `--bb-picker-accent`,
`--bb-picker-accent-ink`, `--bb-picker-radius`, `--bb-picker-shadow`,
`--bb-picker-spring`, `--bb-picker-fade`.

Every part has a `data-part` attribute (`root`, `header`, `title`,
`description`, `surface`, `mood`, `blush`, `spotlight`, `reset`, `cancel`, `save`, `footer`).

**Build your own layout** from the parts:

```tsx
import {
  AvatarPickerRoot,
  AvatarPickerSurface,
  AvatarPickerMood,
  AvatarPickerBlush,
  AvatarPickerSpotlight,
  AvatarPickerReset,
  AvatarPickerSave,
  useAvatarPicker,
} from '@blobbies/react';

<AvatarPickerRoot name={user.name} defaultValue={user.look} onSave={save}>
  <AvatarPickerSurface />
  <AvatarPickerMood />
  <AvatarPickerBlush />
  <AvatarPickerSpotlight />
  <AvatarPickerReset />
  <AvatarPickerSave />
</AvatarPickerRoot>;
```

`useAvatarPicker()` returns `{ value, changed, blush, expressionName,
nextExpression, previousExpression, toggleBlush, reset, save, cancel }`.

---

## Palette

Flat, bright and friendly. Every color reads well with the `#1c1c1c` eyes and
`#2f2f2f` backdrop, on light and dark pages.

| Name    | Hex       |   | Name     | Hex       |
| ------- | --------- | - | -------- | --------- |
| yellow  | `#FFD43B` |   | peach    | `#FFB074` |
| green   | `#5FD068` |   | mint     | `#5EE0C0` |
| sky     | `#6CC8FF` |   | pink     | `#FF8FC7` |
| coral   | `#FF7B7B` |   | orange   | `#FFA64D` |
| lavender| `#B79CFF` |   |          |           |

---

## Monorepo

```
packages/core     blobbies          – hash, initials, SVG, tiers 1 & 2
packages/react    @blobbies/react    – <Avatar> + useAvatarMotion
apps/demo         blobbies-demo     – Vite + React playground
```

### Develop

```bash
pnpm install
pnpm dev          # demo at http://localhost:5173
pnpm test         # vitest across packages
pnpm build        # tsup build of both packages
```

Preview sheets (generated, then opened in a browser):

```bash
pnpm preview:letters   # apps/demo/preview/letters.html
pnpm preview:avatars   # apps/demo/preview/avatars.html
pnpm preview:blink     # apps/demo/preview/blink-img.html
```

---

## License

MIT © Blobbies contributors
