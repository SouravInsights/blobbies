# @blobbies/react

**React bindings for [blobbies](https://www.npmjs.com/package/blobbies)** —
deterministic, cute SVG avatars, a drop-in avatar picker, and the hooks to build
your own UI on top.

<p>
  <a href="https://www.npmjs.com/package/@blobbies/react"><img alt="npm" src="https://img.shields.io/npm/v/@blobbies/react?color=6CC8FF&labelColor=1c1c1c"></a>
  <a href="https://www.npmjs.com/package/blobbies"><img alt="blobbies" src="https://img.shields.io/badge/blobbies-FFD43B?labelColor=1c1c1c"></a>
  <a href="LICENSE"><img alt="MIT" src="https://img.shields.io/badge/license-MIT-B79CFF?labelColor=1c1c1c"></a>
</p>

```tsx
import { Avatar, AvatarPicker } from '@blobbies/react';

<Avatar name="Sourav Nanda" size={64} animate="all" wink />

<AvatarPicker
  name="Sourav Nanda"
  defaultValue={user.look}
  onSave={(look) => updateUser({ look })}
/>
```

## Install

```sh
npm i @blobbies/react
```

React 18 or newer is a peer dependency. `blobbies` is the only runtime
dependency. Fully typed, `sideEffects: false`, and safe to render on the server.

## `<Avatar>`

Inline, SSR-safe SVG with `role="img"` and `aria-label`. The avatar is memoised
so unrelated re-renders never reset the blink animation, and pointer movement
never triggers a React render — motion is written straight to CSS variables by
the shared runtime.

Takes every [blobbies option](https://www.npmjs.com/package/blobbies) plus the
usual SVG props.

| Prop | Type | Default |
| --- | --- | --- |
| `name` | `string` | required |
| `size` | `number \| string` | `48` |
| `color` | `string` — any CSS colour, e.g. `COLORS.sky` | seeded |
| `shape` | `'tall' \| 'wide' \| 'squat' \| 'round' \| 'mid'` | seeded |
| `expression` | `'smile' \| 'smirk' \| …` | seeded |
| `blush` | `boolean` | seeded |
| `tilt` | `number` | seeded |
| `variant` | `number` | `0` |
| `palette` | `readonly string[]` | built-in |
| `animate` | `boolean \| 'blink' \| 'follow' \| 'all'` | `false` |
| `blinkInterval` | `[min, max]` ms | `[2500, 6000]` |
| `followRange` | `number` | `6` |
| `smoothing` | `0..1` | `0.15` |
| `idleTimeout` | `number` ms | `2500` |
| `paused` | `boolean` | `false` |
| `respectReducedMotion` | `boolean` | `true` |
| `wink` / `glance` / `surprise` | `boolean` | `false` |
| `rounded` | `boolean` | `false` |

```tsx
<Avatar name="Sourav Nanda" color={COLORS.sky} expression="smirk" shape="round" blush />;

// Your brand's colours are just an array.
<Avatar name="Sourav Nanda" palette={['#0FA3B1', '#FFD166', '#EF476F']} />;
```

## `<AvatarPicker>`

A ready-made **look map**. Columns are colours, rows are moods, and the map wraps
in both directions, so it never ends. Every face is a version of the same person
— the eyes come from `name` and never change.

**Drag or swipe** to pan, **trackpad** to glide, **arrow keys** to move.
Hovering brings a face forward; cells shrink and fade with distance from it, so
the edges dissolve without ever clipping the chosen face.

The map sizes its own grid to whatever box it is given — a full settings page, a
380px popover, or a phone dialog — so it never clips its edge faces.

```tsx
import { useState } from 'react';
import { Avatar, AvatarPicker } from '@blobbies/react';
import type { AvatarOptions } from '@blobbies/react';

function Profile() {
  const [saved, setSaved] = useState<AvatarOptions | null>(null);
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(true)}>
        <Avatar name={user.name} {...saved} size={40} />
      </button>

      {open && (
        <AvatarPicker
          name={user.name}
          defaultValue={saved ?? undefined}
          onSave={(look) => {
            setSaved(look);
            setOpen(false);
          }}
          onCancel={() => setOpen(false)}
        />
      )}
    </>
  );
}
```

The saved look is the same props you pass to `<Avatar>`.

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

The panel is themed entirely with CSS variables. Set them on the root (or any
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
CSS hooks, and `unstyled` skips the bundled styles entirely.

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

It keeps one stable options object and only re-attaches when the follow target or
enabled state changes — pointer movement never triggers a re-render.

## Exports

| Export | |
| --- | --- |
| `<Avatar>`, `AvatarProps` | Inline, SSR-safe SVG. |
| `<AvatarPicker>`, `AvatarPickerProps` | The preset look map. |
| `AvatarPickerRoot`, `AvatarPickerSurface`, `AvatarPickerPreview`, `AvatarPickerMood`, `AvatarPickerBlush`, `AvatarPickerSpotlight`, `AvatarPickerReset`, `AvatarPickerSave`, `AvatarPickerCancel` | The composable parts. |
| `useAvatarPicker`, `AvatarPickerState` | Picker state for custom controls. |
| `useAvatarMotion`, `UseAvatarMotionOptions` | The motion hook. |
| `COLORS`, `PALETTE`, `EXPRESSIONS`, `SHAPES`, `EXPRESSION_NAMES`, `EXPRESSION_COUNT`, `SHAPE_COUNT` | Re-exported for building custom UIs. |

## Licence

MIT
