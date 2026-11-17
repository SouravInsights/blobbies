# @blobbies/svelte

Svelte bindings for [Blobbies](https://github.com/SouravInsights/blobbies) — cute,
deterministic SVG avatars that blink and follow the cursor.

```sh
npm i blobbies @blobbies/svelte
```

```svelte
<script>
  import { Avatar } from '@blobbies/svelte';
</script>

<Avatar name="Sourav Nanda" size={40} animate="all" />
```

`BlobbiesAvatar` is exported as an alias, if you prefer the explicit name.

## Why install this instead of `<blobbies-avatar>`?

The [web component](../element) works in Svelte too. This package adds three
things on top of it:

- **Server rendering.** The server emits the real `<svg>` — markup and all — so
  the avatar is in the first paint instead of appearing after hydration. A
  custom element renders nothing on the server, so a web-component avatar only
  shows up once the client boots.
- **Typed props.** Every option is a typed prop, and `blush={false}` stays
  distinguishable from an omitted `blush`.
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

Anything that is not a Blobbies option — `class`, `style`, `aria-*`, `data-*` —
is passed through to the `<svg>`.

## AvatarPicker

The Look Map — the picker — as a Svelte component. Drag across for colour, down
for mood, then keep one.

```svelte
<script>
  import { AvatarPicker } from '@blobbies/svelte';

  let saved = $state(null);
</script>

<AvatarPicker
  name={user.name}
  defaultValue={saved}
  onchange={(look) => (preview = look)}
  onsave={(look) => (saved = look)}
  oncancel={close}
/>
```

Every part is a prop and every action is a callback prop:

| Prop | Type | Default |
| --- | --- | --- |
| `name` | `string` (required) | — |
| `defaultValue` | `AvatarOptions` | the centre of the map |
| `palette` | `string[]` | the built-in `PALETTE` |
| `spotlight` | `boolean` | `true` |
| `unstyled` | `boolean` | `false` |
| `title` / `description` | `string` | "Choose an avatar" / "Drag across for colour…" |
| `saveLabel` | `string` | `"Save"` |
| `onchange` | `(look: AvatarOptions) => void` | the look changes — never on mount |
| `onsave` | `(look: AvatarOptions) => void` | Save is pressed |
| `oncancel` | `() => void` | Cancel is pressed |

Passing `oncancel` is what puts the Cancel button on screen, because that is
what tells the picker there is something to cancel. A Cancel that does nothing
is worse than no Cancel.

The behaviour is not in this package. The wrap-around map, the gesture machine,
the glide, the lens and the value are `createPicker` in
[`blobbies/picker`](https://www.npmjs.com/package/blobbies) — the same runtime
React and Vue use. Build your own layout on top of it and you get the same feel
for nothing.

### Your own layout

`<AvatarPicker>` is the preset. When the panel it draws is not the panel you
want, `createAvatarPicker` gives you the same map and the same state, and you
write the chrome:

```svelte
<script>
  import { Avatar, createAvatarPicker } from '@blobbies/svelte';

  const picker = createAvatarPicker({
    name: user.name,
    onsave: (look) => updateUser({ look }),
  });
</script>

<div class="mine">
  <Avatar name={user.name} {...picker.state.value} size={64} animate="all" />
  <div bind:this={picker.host}></div>
  <button onclick={() => picker.state.reset()}>Reset</button>
  <button onclick={() => picker.state.save()}>Use this look</button>
</div>
```

`picker.state` carries the look, the blush, the mood name, whether anything has
changed, and the actions. The map goes wherever you bind `picker.host`. Nothing
is reimplemented — it is the same runtime as React and the preset above.

## Motion

`blink` is pure CSS inside the markup, so it works even in an `<img>`.
`follow`, `wink`, `glance` and `surprise` need a live element and are attached
on mount. `respectReducedMotion` honours the OS setting.

Cursor-follow only works on inline SVG — that is, this component — never on an
`<img>`.

## A note on the build

Svelte compiles a component twice, once for the server and once for the
browser, and the two are not interchangeable. The test suite therefore runs as
two Vitest projects (`vitest.workspace.ts`): `ssr` renders through
`svelte/server`, `dom` mounts through `@testing-library/svelte`.

## Licence

MIT.
