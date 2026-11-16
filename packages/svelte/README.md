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
