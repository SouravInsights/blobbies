# Blobbies for Swift

The Blobbies engine, ported to Swift. Same name → same avatar as the JavaScript
core, **byte-for-byte** — proven by a test that replays the shared conformance
fixture from `packages/core/fixtures/avatar-conformance.json`.

Zero dependencies.

## Install (Swift Package Manager)

```swift
dependencies: [
  .package(url: "https://github.com/SouravInsights/blobbies.git", from: "0.3.0")
]
```

```swift
import Blobbies
```

## Use

```swift
import Blobbies

// A standalone SVG string.
let svg = renderAvatarSvg("Sourav Nanda")

// Just the decisions — colour, shape, mood, tilt — as a value type.
let look = resolveAvatar("Sourav Nanda")
print(look.letters)          // "SN"
print(look.traits.color)     // e.g. "#5FD068"

// A different look for the same person.
let wink = renderAvatarSvg("Ira", AvatarOptions(expression: "wink", size: 64))
```

### Options

`AvatarOptions` mirrors the JavaScript options: `color`, `shape`, `expression`,
`blush`, `tilt`, `size`, `rounded`, `className`, `title`, `palette`, `variant`,
`animate`, `blink`, `blinkInterval`, `follow`.

Enumerable values (see `packages/core/manifest.json` for the full data):

- `shape`: `tall`, `wide`, `squat`, `round`, `mid`
- `expression`: 22 moods, e.g. `smile`, `smirk`, `wink`, `angry`, `cat`, `shy`
- `color`: any CSS colour, or a value from the built-in palette

`variant` lets one name have many bodies while keeping the same eyes.
`variant: 0` is the original look, and it will render identically forever.

## Why the port is trustworthy

The JavaScript core is the source of truth. The Swift port is not reviewed by
eye — it is checked by a test. `avatar-conformance.json` records 24 known-correct
cases (ASCII, Chinese, emoji, punctuation, explicit looks, custom palettes). The
Swift test decodes the file and asserts the output matches **exactly**.

If someone changes a mouth in the core, the Swift test fails on the next run.
That is the whole point.

## Generated data

The big hand-tuned data (36 glyphs, 22 expressions, 5 egg shapes, the layout) is
generated from `packages/core/manifest.json` into
`Sources/Blobbies/Generated.swift`. Do not edit that file by hand:

```bash
pnpm --filter blobbies codegen:swift
```

## Roadmap

- [x] The engine, the renderer, and the conformance test.
- [ ] A native SwiftUI `Avatar` view (renders the drawn shapes, animates the
      blink and the eyes with SwiftUI springs, respects Reduce Motion).
