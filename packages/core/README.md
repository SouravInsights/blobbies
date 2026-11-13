# blobbies

Deterministic, cute SVG avatars from any name. Zero dependencies, no fonts, no
gradients, no `Math.random` — every decision comes from a seeded hash of the
name, so the same name always draws the same face.

```ts
import { renderAvatarSvg } from 'blobbies';

renderAvatarSvg('Sourav Nanda'); // → "<svg …>"
```

- **Blink in pure CSS** — works inside an `<img src="data:image/svg+xml,…">`.
- **Cursor follow in JS** — one shared pointer listener and one rAF loop for
  every avatar on the page, from the `blobbies/motion` entry point.
- **1.4 KB per avatar**, 2 KB of motion, and the motion is a separate entry so
  static users never download it.

## Install

```sh
npm i blobbies
```

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
});
```

| Option | Type | Default |
| --- | --- | --- |
| `size` | `number \| string` | `48` |
| `rounded` | `boolean` | `false` |
| `className` | `string` | – |
| `title` | `boolean` | `false` |
| `palette` | `readonly string[]` | built-in |
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
| `resolveAvatar(name, options?)` | Every seeded decision, without rendering. |
| `attachAvatarMotion(el, options?)` | From `blobbies/motion`. Returns cleanup. |
| `PALETTE` | The built-in flat palette. |
| `LETTER_PATHS` | The 36 hand-drawn glyphs as path data. |

## React

```sh
npm i @blobbies/react
```

```tsx
import { Avatar } from '@blobbies/react';

<Avatar name="Sourav Nanda" size={40} animate="all" wink />
```

## Licence

MIT
