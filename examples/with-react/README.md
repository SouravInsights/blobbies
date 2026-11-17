# Blobbies — React

The `Avatar` and the `AvatarPicker`, as a React app actually uses them:

```tsx
import { Avatar, AvatarPicker } from '@blobbies/react'
import type { AvatarOptions } from '@blobbies/react'

const [saved, setSaved] = useState<AvatarOptions | null>(null)

<Avatar name={user.name} {...(saved ?? {})} size={44} animate="all" />

<AvatarPicker
  name={user.name}
  defaultValue={saved ?? undefined}
  onChange={setLive}
  onSave={setSaved}
  onCancel={close}
/>
```

```sh
pnpm --filter blobbies-example-react dev
```

## What it is showing

- **The header avatar follows the picker as it is dragged**, through `onChange`,
  so the choice is visible in the place it will actually be used rather than in
  a preview that may or may not match.
- **`onSave` and `onCancel` are the two endings.** Save hands you the look;
  cancel tells you to close. The picker does not close itself — that is the
  app's decision, and it is why `onCancel` is what puts the Cancel button on
  screen.
- **`defaultValue` is where it opens**, not a value it tracks. Changing it after
  mount does not move the map, which is deliberate: a picker that jumps while
  someone is choosing is worse than one that opens wrong.

## Choosing your own layout

`AvatarPicker` is the preset. Its parts are exported too — `AvatarPickerRoot`,
`AvatarPickerSurface`, `AvatarPickerMood`, `AvatarPickerPreview`, and the
buttons — so you can keep the map and the state and build the panel around it.
This is the one framework where that is a set of components; in Vue and Svelte
it is a composable over the same runtime.
