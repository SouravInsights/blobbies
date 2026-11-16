# Blobbies on every platform

This is the plan for making Blobbies work in React, Vue, Svelte, plain HTML,
React Native, SwiftUI, and anything that comes after — without the platforms
drifting apart.

It is written to be read by a person first, and a tool second. If a sentence
here needs a diagram to make sense, it is the sentence that is wrong.

---

## What Blobbies actually is

Hand Blobbies a name and it draws a small blobby avatar. The same name always
draws the same avatar — today, tomorrow, and on every device.

Under the hood it is two different things, and it helps to keep them apart:

1. **The decisions.** The two letters used as eyes, the colour, the egg shape,
   the mouth and eyebrows (the mood), whether there is blush, and a small tilt.
   These all come from the name, through a hash.
2. **The drawing.** Circles, curves, and lines that show those decisions on a
   screen.

The decisions are small, pure, and the same everywhere. The drawing is not —
every platform draws differently.

## The problem

If we want Blobbies in six places, the obvious approach is to build it six
times. That fails in a specific, ugly way: **the avatars slowly stop matching.**
Someone nudges a mouth curve in the Swift version, and now the same person's
face is slightly different on an iPhone than on the web. Nobody notices for
three months.

So we make one rule and hold to it:

> **The decisions are the source of truth. Every platform is a thin layer that
> draws those decisions. A shared set of test cases proves every platform draws
> them the same.**

Everything below is in service of that sentence.

---

## Why the decisions can't just be "the code"

The decisions already live in the `blobbies` package. The problem is that today
they are *printed straight into a text string* — an SVG. A string is perfect for
a website and useless for SwiftUI, which wants shapes it can animate.

That is the one structural change the plan makes: **separate "what the avatar
is" from "how it is drawn."** You will see this called "the shape data" or "the
draw tree" below. It just means: instead of handing every platform a finished
picture, we hand it a small list of things to draw — circles, paths, colours —
and let each platform draw them its own way.

---

## The two safety nets

Multi-platform projects rot at the seams. Two cheap mechanisms stop that.

### 1. The conformance file — proves behaviour matches

`packages/core/fixtures/avatar-conformance.json`

For 24 names and options (including Chinese, emoji, apostrophes, and empty
input), this file records exactly what the core produces: the letters, the
colour, the shape, the mood, the blink timing, and the final markup.

**Every platform ships a test that reads this file and checks its own output
matches.** If a port drifts, its test fails on the next commit. There is no
"looks about right" — either the bytes match or they don't.

### 2. The manifest — the data a port needs

`packages/core/manifest.json`

All 5 egg shapes, all 22 moods, all 9 colours, and the layout numbers, as plain
JSON.

A Swift or Kotlin port should never retype 36 hand-drawn letter shapes. It reads
the manifest (or generates native code from it), and the conformance test proves
it wired them up correctly.

Both files are **generated from the code and checked by a test**, so they can
never quietly go stale. Commands to regenerate them are at the bottom.

---

## What already works (today)

| You can already… | Where it works | Try it |
| --- | --- | --- |
| Get an SVG string | Any website, server, email, `<img>` | `renderAvatarSvg('Ira')` |
| Get a URL with the avatar baked in | Same, no JavaScript needed | `avatarDataUri('Ira')` |
| Get the raw decisions | Any language that reads JSON | `resolveAvatar('Ira').traits` |
| Drop in a React component | React apps | `<Avatar name="Ira" />` |
| Open the full picker | React apps | `<AvatarPicker name="Ira" />` |
| Use it without writing code | A terminal | `npx blobbies render "Ira"` |
| Read what it can do | Ports and AI agents | `packages/core/manifest.json` |
| Use one tag in any web framework | Plain HTML, React, Vue, Svelte, Solid, Angular | `<blobbies-avatar name="Ira">` |
| Draw the same avatar in Swift | iOS, macOS, watchOS, visionOS | `BlobbiesAvatar("Ira")` from `platforms/swift` |
| Draw the same avatar in React Native | iOS + Android apps | `import { Avatar } from '@blobbies/react-native'` |

The React picker is finished and rock-solid on touch (that was the last piece of
work before this plan).

---

## The plan, in order

Each step ships on its own and ends with a test that says whether it worked.
The order is chosen so the risky, high-value structural work happens first, and
each later step gets easier.

### Step 0 — Write down the decisions (done)

Expose the decisions (`traits`) on `resolveAvatar()`, add a `CONTRACT_VERSION`,
and generate the conformance file and the manifest.

**Done when:** the conformance test is green and the files regenerate
identically. ✅ Both are in the repo.

### Step 1 — One web component, every web framework ✅

Build a `<blobbies-avatar>` custom element — a real HTML tag that works in React,
Vue, Svelte, Solid, Angular, and a plain `.html` file with no build step.

This is the highest-leverage step. Instead of six wrappers that each need
maintaining, it is **one** implementation that every web framework can already
use. Framework-specific packages become optional extras, not requirements.

**Status:** `packages/element` is built and tested (6 tests). It is a thin shell
over `renderAvatarSvg` + `attachAvatarMotion`, so its output is identical to the
string renderer. Still worth a real-browser check in a Vue and a Svelte page.

### Step 2 — Separate the drawing from the string

Turn the parts that currently build an SVG string into a plain list of shapes
("a circle here, a path there, this colour"), and rebuild the SVG string from
that list.

Nothing changes for users: the SVG output must stay byte-for-byte identical, and
the conformance test enforces that. But now a platform that is not the web has
something structured to draw, instead of having to parse SVG.

**Done when:** the entire existing test suite passes untouched, and a native
platform could plausibly consume the shape list.

### Step 3 — React Native

React Native can share the JavaScript core directly — no port needed.
`@blobbies/react-native` draws the shared scene with `react-native-svg`, and
blinks natively. A phone has no mouse cursor, so "follow" becomes following a
touch, or the device's tilt; that is rebuilt to fit the platform, not copied
from the web.

**Status:** the renderer and the scene mapping are done, and the pure mapping
is unit-tested in Node. Blink runs as a Reanimated worklet. Still needs a real
device to judge; touch/tilt follow is the next step.

### Step 4 — SwiftUI

Swift cannot run JavaScript, so this one is a real (but small) port: the hashing
and trait-selection logic, plus a renderer. The data (letters, mouths, shapes)
is generated from the manifest, and the conformance test proves the port is
correct without a human eyeballing it.

**Status:** the engine, the SVG renderer and the native `BlobbiesAvatar` view
are done and tested. `platforms/swift` reproduces all 24 conformance cases
**byte-for-byte**, the scene is verified against the string renderer, and the
SVG path parser is tested — all under `swift test`. Eye movement on pointer
hover / drag is the next step.

Motion will follow Apple's rules: springs that start from the current value,
respond on touch-down, and can be interrupted mid-flight.

### Step 5 — The other web frameworks (only if needed)

Vue, Svelte, Solid, and Angular wrappers, each tiny, each with a server-render
snapshot test. **Skip these entirely if the custom element from Step 1 is
enough** — that is the whole point of Step 1.

### Step 6 — The picker, everywhere

The picker is the biggest surface and the most React-shaped. Its *logic* (which
avatar is selected, the wrapping grid, the expression stepper) moves into a
framework-free module. React keeps its look. React Native and SwiftUI get their
own look over the same logic.

The picker is deliberately last. Ship a great `<Avatar>` everywhere first, then
the interactive picker where there is demand.

### Parallel track — a hosted image API

`https://…/v1/avatar.svg?name=Ira` is the lowest-friction way to use Blobbies:
it works in an `<img>`, an email, a PDF, a terminal, or SwiftUI's `AsyncImage`
with zero install. It is worth shipping eventually.

But it is a **delivery channel, not the architecture.** It serves static and
blinking avatars; it cannot do cursor-following or the picker, because a URL
cannot run code. So it depends on the decisions being stable — it does not
replace the work above.

---

## How to add a new platform

This is the part that makes the library grow without us. If you want Blobbies in
a framework that is not listed, here is the whole job.

1. **Read the conformance file.** `packages/core/fixtures/avatar-conformance.json`
   is the specification. It tells you exactly what output is correct.
2. **Port the small brain.** `getInitials`, the `cyrb53` hash, the `mulberry32`
   random generator, and the trait selection. Roughly 200 lines. The
   conformance file tells you immediately if you got the hash or the rounding
   wrong — which is the usual failure, because languages handle 32-bit integers
   and Unicode differently.
3. **Generate the big data.** Do not retype 36 letter shapes and 22 mouths.
   Read `manifest.json` or generate native data files from it.
4. **Draw the shapes.** Use whatever the platform gives you: `Path` in SwiftUI,
   `<Path>` in react-native-svg, `Canvas`, anything.
5. **Run the conformance test.** Your output must match the file byte-for-byte.
6. **Add motion in the platform's own style.** The web follows a cursor. A phone
   has no cursor, so following becomes touch or tilt. Do not copy the web's
   motion; make the right motion for the platform.
7. **Check accessibility.** A name for screen readers, a reduced-motion path, and
   touch targets of at least 44×44 points.

That's it. That is the contribution.

---

## What "agent native" means here

An AI assistant should be able to pick up Blobbies and use it correctly — in any
framework — without reading the whole source or asking you a question. And if it
wants to build an avatar library itself, it should find our invariants easier to
reuse than to reinvent.

Concretely, that means shipping files that are useful to a tool, not just prose:

| File | What it gives an agent |
| --- | --- |
| `packages/core/manifest.json` | Every shape, mood, and colour as data, so it can render without reading TypeScript |
| `AGENTS.md` | How to work in this repo: the commands, the rules, the traps |
| `llms.txt` | A short, machine-friendly index of the docs and the API |
| `blobbies` CLI | Use the library from a shell, with no code at all |
| `avatar-conformance.json` | A way for the agent to check its own work |
| `docs/PLATFORMS.md` (this file) | The plan, in language a person or a model can both follow |

Why this matters: building a one-off avatar component is cheap now. Anyone — or
any agent — can generate one in an afternoon. What is *not* cheap is a library
that is **provably** identical across six platforms, versioned so old avatars
never change, and easy to use correctly on the first attempt. That is the bar we
are aiming at, and these files are how we clear it.

---

## The rules

Short, and worth repeating:

- **Never fork the algorithm.** If a platform needs a change, it goes in the
  core, and every platform gets it at once.
- **Never hand-edit a generated file.** `avatar-conformance.json` and
  `manifest.json` are produced by scripts. Change the code, run the script,
  commit both.
- **Determinism is a promise.** `variant: 0` must keep drawing the original look
  forever. The conformance file is what makes that enforceable.
- **Motion is a rendering concern.** It attaches to the drawn layers. It never
  changes the model.

---

## Commands

```bash
# Everything
pnpm test          # the conformance test and the manifest test live here
pnpm typecheck
pnpm build

# Regenerate the generated files after changing the engine or the data
pnpm --filter blobbies export:fixtures   # → fixtures/avatar-conformance.json
pnpm --filter blobbies export:manifest   # → manifest.json

# Use it without writing any code
npx blobbies render "Sourav Nanda"
npx blobbies render "Ira" --expression wink --color sky
npx blobbies shapes
```

## Where the code lives

```
packages/core       blobbies            the decisions, the drawing, the contract
packages/react      @blobbies/react     <Avatar>, <AvatarPicker>, hooks
packages/element    @blobbies/element   <blobbies-avatar> web component
packages/react-native  @blobbies/react-native  <Avatar> over the scene
platforms/swift     Blobbies            Swift engine, SVG renderer, SwiftUI view
packages/core/fixtures                  the conformance file (generated)
packages/core/manifest.json             the capability data (generated)
docs/PLATFORMS.md                       this plan
AGENTS.md                               repo guide for AI agents
llms.txt                                compact doc index for AI tools
```

The remaining work is the picker across frameworks (Step 6): its state becomes a
framework-free module, and React, React Native and SwiftUI each present it in
their own way.
