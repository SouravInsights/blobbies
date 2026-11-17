# Blobbies — plain HTML

The whole example is one HTML file and one import:

```html
<script type="module">
  import '@blobbies/element';
</script>

<blobbies-avatar name="Sourav Nanda" size="64" motion="all"></blobbies-avatar>
```

Importing the package registers `<blobbies-avatar>`, and the attributes you set
are the options — the same ones every other binding takes. There is no
framework here, and nothing to configure.

```sh
pnpm --filter blobbies-example-html dev
```

## What it is showing

- **One tag works anywhere HTML runs** — a `.html` file, an Astro island, a
  Rails view, a Vue or Svelte template. Same element, same attributes.
- **Properties are sugar over attributes**, so `avatar.name = 'Ira'` and
  `name="Ira"` do the same thing and the element re-renders either way.
- **`motion="all"`** is the blink plus cursor-follow. Blink is pure CSS inside
  the markup, so it survives even in an `<img>`; follow needs a live element.

## What it is not

There is no picker here, and there cannot be: a web component does not
server-render, so this is for avatars, not for a control. For the picker, use
[`@blobbies/react`](../with-react), [`@blobbies/vue`](../with-vue) or
[`@blobbies/svelte`](../with-svelte) — all three run the same picker runtime.
