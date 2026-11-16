# Working in this repo

Blobbies turns a name into a deterministic, cute SVG avatar. This file is the
short version of how the repo fits together and how to change it safely. For the
full multi-platform plan, read [`docs/PLATFORMS.md`](docs/PLATFORMS.md).

## The one rule

**One core, many renderers.** The decisions that make an avatar (letters,
colour, shape, mood, blush, tilt) live in `packages/core` and are the source of
truth. Everything else — an SVG string, a React element, a SwiftUI `Path` — is a
thin way of drawing those decisions. Never copy the algorithm into a binding.
Change the core and every platform gets it at once.

## Parity is the product

A binding is not done because it draws something. A platform is done when it is
**the same product** as the web:

- **Same prop API.** `size`, `color`, `shape`, `expression`, `blush`, `rounded`,
  `palette`, `variant`, `animate`, `blinkInterval`, `respectReducedMotion`, and
  so on. A prop may be ignored only where the platform genuinely has no
  equivalent, and then it is documented, not silently dropped.
- **Same defaults.** Anything seeded or defaulted by the core stays seeded and
  defaulted by the core — never re-decided in a binding.
- **Same motion.** Animation timings are shared data, not per-platform taste.
  The blink keyframes live in `packages/react-native/src/blink.ts` and mirror
  `buildBlinkStyle` in the core; change one, change both, and test it.
- **Same accessibility.** `accessibilityLabel` / `aria-label` from the name,
  reduce-motion honoured everywhere.

The only genuinely platform-specific thing is the *input*: the web follows a
cursor, a phone has none. The behaviour around it should still feel like the same
product.

## Commands

```bash
pnpm install
pnpm test          # vitest across all packages (includes the conformance test)
pnpm typecheck     # tsc across the workspace
pnpm build         # tsup build of the packages
pnpm dev           # the demo app at http://localhost:5173
```

## The two generated files — do not hand-edit

| File | Regenerate with | What it is |
| --- | --- | --- |
| `packages/core/fixtures/avatar-conformance.json` | `pnpm --filter blobbies export:fixtures` | Known-correct output for 24 cases. Every port tests against it. |
| `packages/core/manifest.json` | `pnpm --filter blobbies export:manifest` | Every shape, mood and colour as data, for ports and agents. |

Both are guarded by a test that regenerates them and compares. If you change the
engine on purpose, run the script and commit the regenerated file. If a test
fails after your change, that is the safety net working — do not delete the test.

## The traps

- **Determinism is a promise.** `variant: 0` must keep drawing the original look
  forever. Never introduce `Math.random`, a clock, or locale-dependent steps into
  the engine.
- **The hash is the hard part of a port.** `cyrb53` and `mulberry32` use 32-bit
  integer math; other languages (Swift, Kotlin) must wrap integers explicitly.
  The conformance file is how you prove you got it right.
- **`getInitials` is Unicode-aware** (grapheme clusters, non-Latin letters). It is
  covered by the conformance file; treat edge cases there as real requirements.
- **Motion is per-platform *in input*, not in feel.** The web follows a cursor;
  a phone has no cursor, so the input differs. But the timings, the keyframes
  and the prop names are shared, not invented per platform. See *Parity is the
  product* above.
- **`packages/react` is published and must keep its current API.** Add, do not
  rename or remove.

## Where the value is

The drawing is easy and getting easier. The value is the guarantees: same name →
same avatar, forever, on every platform, provably. When in doubt, protect the
guarantees and keep the drawing simple.

## Useful entry points

- `packages/core/src/index.ts` — the public API of the core.
- `packages/core/src/parts.ts` — the authored data (shapes, expressions, layout).
- `packages/core/src/render.ts` — `resolveAvatar`, `renderAvatarBody`, `renderAvatarSvg`.
- `packages/react/src/AvatarPicker.tsx` — the picker.
- `docs/PLATFORMS.md` — the plan for Vue, Svelte, React Native, SwiftUI and beyond.
