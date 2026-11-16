# @blobbies/element

**`<blobbies-avatar>` — Blobbies as a web component.** One tag that works in
React, Vue, Svelte, Solid, Angular, Astro, and a plain `.html` file with no
build step.

It is a thin shell over the core: the markup comes from `renderAvatarSvg` and
the motion comes from `attachAvatarMotion`, so an avatar drawn by this element
is byte-for-byte the same as one drawn by the string renderer or React.

## Install

```sh
npm i @blobbies/element
```

Importing the package registers the tag:

```ts
import '@blobbies/element';
```

## Use

Plain HTML — no framework, no bundler required once the script is loaded:

```html
<script type="module" src="https://esm.sh/@blobbies/element"></script>

<blobbies-avatar name="Sourav Nanda" motion="all" size="48"></blobbies-avatar>
```

React (19 handles custom elements natively; React 18 works too):

```tsx
import '@blobbies/element';

<blobbies-avatar name="Sourav Nanda" motion="all" size={48} />;
```

Vue:

```vue
<script setup>
import '@blobbies/element';
</script>

<template>
  <blobbies-avatar name="Sourav Nanda" motion="all" :size="48" />
</template>
```

Svelte:

```svelte
<script>
  import '@blobbies/element';
</script>

<blobbies-avatar name="Sourav Nanda" motion="all" size={48} />
```

## Attributes

| Attribute | Values | Notes |
| --- | --- | --- |
| `name` | any string | The eyes come from this. Required. |
| `size` | number | Width/height in px. Default `48`. |
| `color` | hex or CSS colour | Default: seeded from the name. |
| `shape` | `tall` `wide` `squat` `round` `mid` | Default: seeded. |
| `expression` | `smile` `smirk` `wink` … | 22 moods; see `npx blobbies expressions`. |
| `variant` | number | A different body for the same name. `0` is the original. |
| `tilt` | number | Degrees, `-8`..`8`. |
| `blush` | `true` / `false` | Default: seeded. |
| `palette` | comma-separated colours | Override the built-in palette. |
| `motion` | `all` `blink` `follow` `false` | Default: static. |
| `rounded` | present | Round the corners. |
| `wink` | present | Wink on click. |
| `glance` | present | Glance around when idle. |
| `surprise` | present | Look surprised when the pointer is close. |

Every attribute is also a property that reflects back to the attribute, so
`el.size = 32` and `el.setAttribute('size', '32')` do the same thing.

### Why `motion`, not `animate`

`Element.animate` is a real DOM method (the Web Animations API). Overriding it
with a string would break it for anyone using the element, so the attribute is
called `motion`. It maps to the core's `animate` option.

## Notes

- **Blink** is pure CSS inside the SVG, so it works even when the element is
  used in a page with no JavaScript beyond registering the tag.
- **Cursor following, wink, glance and surprise** attach the JavaScript motion
  runtime only when you ask for them (`motion`, `wink`, `glance`, `surprise`).
  A static avatar adds no global listeners.
- **SSR**: a custom element needs a browser. On the server, render with
  `renderAvatarSvg` and let the element take over on the client.
- **`aria-label`** is always set from `name`; the avatar is announced correctly
  by screen readers.
