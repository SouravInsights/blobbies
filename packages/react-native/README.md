# @blobbies/react-native

**Blobbies for React Native and Expo.** The same deterministic avatars as the web,
drawn natively with [`react-native-svg`](https://github.com/software-mansion/react-native-svg).

React Native shares the JavaScript core, so an avatar here is the exact same
face as on the web — same colour, same shape, same eyes — with no port and no
drift.

## Install

```sh
npx expo install react-native-svg
npm i @blobbies/react-native
```

Only `react-native-svg` is required. No Reanimated, no worklets, no Babel setup.

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

- **Blink** plays the web's exact keyframes. `src/blink.ts` mirrors
  `buildBlinkStyle` in the core: open until 92% of the interval, a dip to `0.1`
  at 95%, back to `1` at 100%, with the CSS `ease-in-out` curve, the seed's
  `delay`, and the seed's double-blink variant. Frames only run during the dip.
  It is a plain frame loop rather than Reanimated because the native SVG
  transform prop only accepts an already-computed matrix.
- **Reduce motion** is honoured through `AccessibilityInfo`, the native
  equivalent of `prefers-reduced-motion`.
- **Cursor following** is intentionally not ported: a phone has no cursor.
  Motion that fits touch (a drag to move the eyes, or a device-tilt mode) is the
  next step for this package.

## Testing

The scene → `react-native-svg` mapping is a pure function and is unit-tested in
plain Node:

```bash
pnpm --filter @blobbies/react-native test
```

The component needs a real device or simulator. The fastest way to see it:

```bash
npx create-expo-app blobbies-try --template blank-typescript
cd blobbies-try
npx expo install react-native-svg
npm i @blobbies/react-native
```

Then replace `App.tsx` with:

```tsx
import { View, Text } from 'react-native';
import { Avatar } from '@blobbies/react-native';

export default function App() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20, backgroundColor: '#111' }}>
      <Avatar name="Sourav Nanda" size={96} animate="blink" />
      <Avatar name="Ira" size={96} expression="wink" animate="blink" />
      <Text style={{ color: '#fff' }}>Blobbies on React Native</Text>
    </View>
  );
}
```

```bash
npx expo start   # press i for iOS simulator, a for Android, or scan on a device
```

Do **not** add a hand-written `babel.config.js` to an Expo SDK 58 project — it can
knock out React Native's own codegen plugin ("Unable to determine event
arguments for …"). Expo configures Babel itself.
