# @blobbies/react

React bindings for [blobbies](https://www.npmjs.com/package/blobbies) —
deterministic, cute SVG avatars with an optional CSS blink and JS cursor follow.

```tsx
import { Avatar } from '@blobbies/react';

<Avatar name="Sourav Nanda" size={64} animate="all" wink />
```

Inline, SSR-safe SVG with `role="img"` and `aria-label`. The avatar is memoised
so unrelated re-renders never reset the blink animation, and pointer movement
never triggers a React render — motion is written straight to CSS variables by
the shared runtime.

## Install

```sh
npm i @blobbies/react
```

React 18 or newer is a peer dependency. `blobbies` is the only runtime
dependency.

## `<Avatar>`

Takes every [blobbies option](https://www.npmjs.com/package/blobbies) plus the
usual SVG props.

| Prop | Type | Default |
| --- | --- | --- |
| `name` | `string` | required |
| `size` | `number \| string` | `48` |
| `animate` | `boolean \| 'blink' \| 'follow' \| 'all'` | `false` |
| `blinkInterval` | `[min, max]` ms | `[2500, 6000]` |
| `followRange` | `number` | `6` |
| `smoothing` | `0..1` | `0.15` |
| `idleTimeout` | `number` ms | `2500` |
| `paused` | `boolean` | `false` |
| `respectReducedMotion` | `boolean` | `true` |
| `wink` / `glance` / `surprise` | `boolean` | `false` |
| `rounded` | `boolean` | `false` |

## `useAvatarMotion`

Bring your own SVG and attach the same runtime:

```tsx
import { useRef } from 'react';
import { useAvatarMotion } from '@blobbies/react';

function Mine() {
  const ref = useRef<SVGSVGElement>(null);
  useAvatarMotion(ref, { animate: 'follow', followRange: 6 });
  return <svg ref={ref} viewBox="0 0 100 100">{/* bb-* layers */}</svg>;
}
```

## Licence

MIT
