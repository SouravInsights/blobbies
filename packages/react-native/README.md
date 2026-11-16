# @blobbies/react-native

**Blobbies for React Native and Expo.** The same deterministic avatars as the web,
drawn natively with [`react-native-svg`](https://github.com/software-mansion/react-native-svg).

React Native shares the JavaScript core, so an avatar here is the exact same
face as on the web — same colour, same shape, same eyes — with no port and no
drift.

## Install

```sh
npx expo install react-native-svg react-native-reanimated
npm i @blobbies/react-native
```

Both peer dependencies are required. `react-native-reanimated` needs its Babel
plugin (Expo's `babel-preset-expo` sets it up for you) and the New Architecture.

## Use

```tsx
import { Avatar } from '@blobbies/react-native';

<Avatar name="Sourav Nanda" size={48} />

<Avatar
  name="Ira"
  size={64}
  expression="wink"
  color="#6CC8FF"
  animate="blink"
/>
```

Options are the same as the core: `color`, `shape`, `expression`, `blush`,
`tilt`, `size`, `variant`, `animate`, and so on.

## How it works

The core produces a **scene** — a small draw tree with named layers
(`bb-blob`, `bb-eyes`, `bb-mouth`, `bb-eye`) and structured transforms.
`react-native` maps that tree to `react-native-svg` elements. There is no SVG
string parsing and no second renderer to keep in sync.

- **Blink** runs as a Reanimated worklet on the UI thread, scaling the `bb-eye`
  group about its own centre, so it keeps blinking while JavaScript is busy.
- **Cursor following** is intentionally not ported: a phone has no cursor.
  Motion that fits touch (a drag to move the eyes, or a device-tilt mode) is the
  next step for this package.

## Testing

The scene → `react-native-svg` mapping is a pure function and is unit-tested in
plain Node (`sceneToNodes`). The `<Avatar>` component itself needs a real
device or emulator to judge — see `../../docs/PLATFORMS.md`.
