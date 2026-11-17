# Blobbies — Vue

The `Avatar` and the `AvatarPicker`, as a Vue app actually uses them:

```vue
<script setup>
import { Avatar, AvatarPicker } from '@blobbies/vue'

const save = (look) => updateUser({ look })
</script>

<template>
  <Avatar :name="user.name" :size="44" animate="all" />
  <AvatarPicker
    :name="user.name"
    :default-value="saved"
    @change="preview"
    @save="save"
    @cancel="close"
  />
</template>
```

```sh
pnpm example vue
```

## What it is showing

- **The header avatar follows the picker as it is dragged**, through `@change`,
  so the choice is visible in the place it will actually be used rather than in
  a preview that may or may not match.
- **`@save` and `@cancel` are the two endings.** Save hands you the look; cancel
  tells you to close. The picker does not close itself — that is the app's
  decision, and it is why listening for `@cancel` is what puts the Cancel button
  on screen.
- **`defaultValue` is where it opens**, not a value it tracks. Changing it after
  mount does not move the map, which is deliberate: a picker that jumps while
  someone is choosing is worse than one that opens wrong.

## Choosing your own layout

`<AvatarPicker>` is the preset. `useAvatarPicker` is what it is made of, and
what you use when the panel it draws is not the panel you want:

```vue
<script setup>
const { host, state } = useAvatarPicker({ name: user.name, onSave: save })
</script>

<template>
  <div class="mine">
    <Avatar :name="user.name" v-bind="state.value" :size="64" />
    <div ref="host"></div>
    <button @click="state.reset()">Reset</button>
  </div>
</template>
```

Same map, same state, your chrome. Nothing is reimplemented — the behaviour is
`createPicker` in the core, shared with React and Svelte.

## Is it the same as React's?

Yes, and it is checked rather than claimed. `e2e/parity.spec.ts` loads this app
and the React and Svelte ones, and asserts the picker's markup is identical
character for character, and that the same drag produces the same result in all
three. The map is not rendered by any framework — the core builds it — so the
only thing that can differ is where it is put.
