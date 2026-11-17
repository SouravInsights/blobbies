# Blobbies — Svelte

The `Avatar` and the `AvatarPicker`, as a Svelte app actually uses them:

```svelte
<script>
  import { Avatar, AvatarPicker } from '@blobbies/svelte';

  let saved = $state(null);
</script>

<Avatar name={user.name} {...(saved ?? {})} size={44} animate="all" />

<AvatarPicker
  name={user.name}
  defaultValue={saved}
  onchange={(look) => (preview = look)}
  onsave={(look) => (saved = look)}
  oncancel={close}
/>
```

```sh
pnpm example svelte
```

## What it is showing

- **The header avatar follows the picker as it is dragged**, through `onchange`,
  so the choice is visible in the place it will actually be used rather than in
  a preview that may or may not match.
- **`onsave` and `oncancel` are the two endings.** Save hands you the look;
  cancel tells you to close. The picker does not close itself — that is the
  app's decision, and it is why passing `oncancel` is what puts the Cancel
  button on screen.
- **`defaultValue` is where it opens**, not a value it tracks. Changing it after
  mount does not move the map, which is deliberate: a picker that jumps while
  someone is choosing is worse than one that opens wrong.

## Choosing your own layout

`<AvatarPicker>` is the preset. `createAvatarPicker` is what it is made of, and
what you use when the panel it draws is not the panel you want:

```svelte
<script>
  import { Avatar, createAvatarPicker } from '@blobbies/svelte';

  const picker = createAvatarPicker({ name: user.name, onsave: save });
</script>

<div class="mine">
  <Avatar name={user.name} {...picker.state.value} size={64} />
  <div bind:this={picker.host}></div>
  <button onclick={() => picker.state.reset()}>Reset</button>
</div>
```

Same map, same state, your chrome. Nothing is reimplemented — the behaviour is
`createPicker` in the core, shared with React and Vue.

## A note on the build

Svelte compiles a component twice, once for the server and once for the browser,
and the two are not interchangeable — so this package's own tests run as two
Vitest projects. That is also why the package ships its components as source:
only your bundler can compile them, and that is what lets them server-render.

## Is it the same as React's?

Yes, and it is checked rather than claimed. `e2e/parity.spec.ts` loads this app
and the React and Vue ones, and asserts the picker's markup is identical
character for character, and that the same drag produces the same result in all
three. The map is not rendered by any framework — the core builds it — so the
only thing that can differ is where it is put.
