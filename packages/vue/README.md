# @blobbies/vue

Vue bindings for [Blobbies](https://github.com/SouravInsights/blobbies) — cute,
deterministic SVG avatars that blink and follow the cursor.

```sh
npm i blobbies @blobbies/vue
```

```vue
<script setup>
import { Avatar } from '@blobbies/vue'
</script>

<template>
  <Avatar name="Sourav Nanda" :size="40" animate="all" />
</template>
```

`BlobbiesAvatar` is exported as an alias, if you prefer the explicit name in
templates.

## Why install this instead of `<blobbies-avatar>`?

The [web component](../element) works in Vue too. This package adds three
things on top of it:

- **Server rendering.** The server emits the real `<svg>` — markup and all —
  so the avatar is in the first paint instead of appearing after hydration. A
  custom element cannot do this.
- **Props.** `:size="40"` and `:blush="false"` are typed and reactive, and
  tri-state options stay distinguishable from "off".
- **No registration step.** Nothing to `defineBlobbies()` or configure.

## Props

Every option the core takes, plus `name`:

| Prop | Type | Default |
| --- | --- | --- |
| `name` | `string` (required) | — |
| `size` | `number \| string` | `48` |
| `shape` | `'tall' \| 'wide' \| 'squat' \| 'round' \| 'mid'` | seeded |
| `expression` | 22 moods | seeded |
| `color` | CSS colour | seeded |
| `palette` | `string[]` | seeded |
| `variant` | `number` | `0` |
| `tilt` | `number` (`-8`…`8`) | seeded |
| `blush` | `boolean` | seeded |
| `rounded` | `boolean` | `false` |
| `animate` | `false \| 'blink' \| 'follow' \| 'all'` | `false` |
| `blinkInterval`, `followRange`, `smoothing`, `idleTimeout` | `number` | core defaults |
| `paused`, `respectReducedMotion`, `wink`, `glance`, `surprise` | `boolean` | core defaults |

Anything else you pass — `class`, `style`, `aria-*`, `data-*` — lands on the
`<svg>`, and Vue merges `class` and `style` with the ones the component sets.

## AvatarPicker

The Look Map — the picker — as a Vue component. Drag across for colour, down
for mood, then keep one.

```vue
<script setup>
import { AvatarPicker } from '@blobbies/vue'

const save = (look) => updateUser({ look })
</script>

<template>
  <AvatarPicker
    :name="user.name"
    :default-value="saved"
    @change="preview"
    @save="save"
    @cancel="close"
  />
</template>
```

Every part is a prop and every action is an event:

| Prop | Type | Default |
| --- | --- | --- |
| `name` | `string` (required) | — |
| `defaultValue` | `AvatarOptions` | the centre of the map |
| `palette` | `string[]` | the built-in `PALETTE` |
| `spotlight` | `boolean` | `true` |
| `unstyled` | `boolean` | `false` |
| `title` / `description` | `string` | "Choose an avatar" / "Drag across for colour…" |
| `saveLabel` | `string` | `"Save"` |

| Event | Payload | When |
| --- | --- | --- |
| `change` | `AvatarOptions` | the look changes — never on mount |
| `save` | `AvatarOptions` | Save is pressed |
| `cancel` | — | Cancel is pressed |

`cancel` is only wired when you listen for it, which is what puts the Cancel
button on screen. A Cancel that does nothing is worse than no Cancel.

The behaviour is not in this package. The wrap-around map, the gesture machine,
the glide, the lens and the value are `createPicker` in
[`blobbies/picker`](https://www.npmjs.com/package/blobbies) — the same runtime
React and `<blobbies-avatar>` use. Build your own layout on top of it and you
get the same feel for nothing.

## Motion

`blink` is pure CSS inside the markup, so it works even in an `<img>`.
`follow`, `wink`, `glance` and `surprise` need a live element and are attached
on mount. `respectReducedMotion` honours the OS setting.

Cursor-follow only works on inline SVG — that is, this component — never on an
`<img>`.

## Licence

MIT.
