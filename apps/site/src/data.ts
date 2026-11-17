/**
 * Content for the page. The name lists are generated with a fixed stride so
 * the page is byte-identical on every load (no Math.random anywhere).
 *
 * The numbers — sizes, counts, versions — are not here. They come from
 * `stats.json`, which is measured from the built packages, because every one of
 * them has gone stale at least once when it was typed by hand.
 */
import stats from './stats.json';

export const FIRST = [
  'Ada', 'Grace', 'Sourav', 'Ira', 'John', 'Jane', 'Linus', 'Maya', 'Nina', 'Omar',
  'Priya', 'Quinn', 'Rosa', 'Sam', 'Tara', 'Uma', 'Vera', 'Wes', 'Xiu', 'Yara',
  'Zoe', 'Ken', 'Lena', 'Milo', 'Nadia', 'Owen', 'Pia', 'Rex', 'Sofia', 'Theo',
];

export const LAST = [
  'Nanda', 'Hopper', 'Lovelace', 'Doe', 'Chen', 'Singh', 'Patel', 'Khan', 'Ali',
  'Garcia', 'Rossi', 'Muller', 'Novak', 'Silva', 'Haddad', 'Kim', 'Nakamura',
  'Okafor', 'Petrov', 'Dubois', 'Adeyemi', 'Kowalski', 'Ibrahim', 'Vargas',
];

export function buildNames(count: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    const first = FIRST[(i * 7 + 3) % FIRST.length] as string;
    const last = LAST[(i * 11 + 5) % LAST.length] as string;
    // every 11th is a single name, so the two-letters-of-one-word case shows up
    out.push(i % 11 === 0 ? first : `${first} ${last}`);
  }
  return out;
}

export const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split('');

/**
 * How many faces the engine can draw, measured. The only one of the old four
 * that the page actually showed: `PALETTE_SIZE`, `BUILDS` and `EYE_PAIRS` were
 * exported and read by nothing, which a linter cannot see.
 */
export const TOTAL = stats.engine.total;

/** The size of a package, as a reader would say it. */
function sizeOf(pkg: keyof typeof stats.packages): string {
  return `${(stats.packages[pkg].gzip / 1024).toFixed(1)} kB gz`;
}

export const INSTALL = 'npm i blobbies @blobbies/react';
export const REPO = 'https://github.com/SouravInsights/blobbies';
export const NPM = 'https://www.npmjs.com/package/blobbies';
export const API_BASE = 'https://blobbies-api.souravinsights.com';

export const CORE_SNIPPET = `import { renderAvatarSvg } from 'blobbies'

renderAvatarSvg('Sourav Nanda')`;

export const DATA_URI_SNIPPET = `import { avatarDataUri } from 'blobbies'

img.src = avatarDataUri('Sourav Nanda')`;

export const REACT_SNIPPET = `import { Avatar } from '@blobbies/react'

<Avatar name="Sourav Nanda" size={40} />`;

export const MOTION_SNIPPET = `import { attachAvatarMotion } from 'blobbies/motion'

const stop = attachAvatarMotion(svgEl, {
  followRange: 6,
  smoothing: 0.15,
})

stop() // removes the listener`;

/** The whole public surface, as it would read in an editor. */
export const TYPES_SNIPPET = `// blobbies — zero dependencies, and the whole engine
renderAvatarSvg(name, options?): string
renderAvatarBody(name, options?): ResolvedAvatar
avatarDataUri(name, options?): string
resolveAvatar(name, options?): ResolvedAvatar
getInitials(name): string

// blobbies/motion — its own entry point
attachAvatarMotion(el, options?): () => void

// blobbies/picker — the Look Map, framework-free.
// React, Vue and Svelte all run this one, so the picker cannot drift
// between them.
createPicker(options): PickerRuntime

// @blobbies/react — Avatar, and the picker
<Avatar name="Sourav Nanda" size={40} />  // every AvatarOption, and every svg prop
<AvatarPicker name="Sourav Nanda" onSave={save} />

// @blobbies/vue, @blobbies/svelte — the same pair, server-rendered
<Avatar name="Sourav Nanda" :size="40" />
<AvatarPicker name="Sourav Nanda" onSave={save} />

// @blobbies/react-native — Avatar, on the scene graph
<Avatar name="Sourav Nanda" size={40} />

// @blobbies/element — the web component, anywhere HTML runs
<blobbies-avatar name="Sourav Nanda" size="40" motion="all"></blobbies-avatar>

// Swift — BlobbiesAvatar in SwiftUI
BlobbiesAvatar(name: "Sourav Nanda")

// http — nothing to install
${API_BASE}/v1/avatar/svg?name=Sourav`;

/** Every option, with its default, in the shape you would paste. */
export const OPTIONS_SNIPPET = `type AvatarOptions = {
  size?: number | string                    // 48
  animate?: boolean | 'blink' | 'follow' | 'all'  // false
  blink?: boolean                           // true when animated
  blinkInterval?: [number, number]          // [2500, 6000]
  follow?: boolean                          // true when animated
  followRange?: number                      // 6
  followTarget?: 'window' | Element         // 'window'
  smoothing?: number                        // 0.15
  idleTimeout?: number                      // 2500
  paused?: boolean                          // false
  respectReducedMotion?: boolean            // true
  wink?: boolean                            // false
  glance?: boolean                          // false
  surprise?: boolean                        // false
  rounded?: boolean                         // false
  title?: boolean                           // false
  palette?: readonly string[]               // built-in
  variant?: number                          // 0 — same eyes, another look
  color?: string                            // any CSS colour, e.g. COLORS.sky
  shape?: 'tall' | 'wide' | 'squat' | 'round' | 'mid'   // seeded
  expression?: 'smile' | 'smirk' | …        // EXPRESSIONS     seeded
  blush?: boolean                           // seeded
  className?: string
}`;

/**
 * One entry per platform.
 *
 * Deliberately not one tab per framework: there is no `@blobbies/vue` versus
 * `@blobbies/svelte` split of the engine — each of those packages runs the real
 * component, and everything else runs the same core. The HTTP row leads because
 * it is the one that needs nothing installed at all.
 *
 * `size` is the package's own gzipped ESM, with `blobbies` external, measured
 * by `scripts/export-stats.mjs` rather than typed here. The core is shared by
 * every row that depends on it — which is why React's size went *down* when the
 * picker landed: the picker moved into the core, so React stopped shipping its
 * own copy of it.
 */
export interface Platform {
  id: string;
  label: string;
  /** A key in `logos.ts` (a svgl mark), or a lucide glyph in `icons.tsx`. */
  icon: string;
  /** The claim this tab makes, set large in the left column. */
  headline: string;
  /** `[label, value]` pairs, listed under the headline. */
  meta: readonly (readonly [string, string])[];
  /** The command — or, for Swift, the package URL. Absent on the HTTP row. */
  install?: string;
  /** The endpoint, for the live preview. */
  href?: string;
  /** Set while the package is not installable yet. */
  soon?: boolean;
  file: string;
  code: string;
}

export const PLATFORMS: readonly Platform[] = [
  {
    id: 'http',
    label: 'http',
    icon: 'globe',
    headline: 'No install. Just a URL.',
    meta: [
      ['endpoint', '/v1/avatar/{format}'],
      ['formats', 'svg · png · json'],
      ['deps', 'none'],
    ],
    href: `${API_BASE}/v1/avatar/svg`,
    file: 'index.html',
    code: `<img
  src="https://blobbies-api.souravinsights.com/v1/avatar/svg?name=Sourav"
  width="40"
  height="40"
  alt="Sourav"
/>

<!-- svg, png or json, at any size -->
<img
  src="https://blobbies-api.souravinsights.com/v1/avatar/png?name=Sourav"
  alt="Sourav"
/>`,
  },
  {
    id: 'react',
    label: 'react',
    icon: 'react',
    headline: 'Avatar and picker, in one import.',
    meta: [
      ['package', '@blobbies/react'],
      ['size', sizeOf('@blobbies/react')],
      ['deps', 'react'],
    ],
    install: 'npm i blobbies @blobbies/react',
    file: 'Profile.tsx',
    code: `import { Avatar, AvatarPicker } from '@blobbies/react'

export function Profile({ user, onSave }) {
  return (
    <>
      <Avatar name={user.name} size={40} animate="all" />
      <AvatarPicker name={user.name} onSave={onSave} />
    </>
  )
}`,
  },
  {
    id: 'vue',
    label: 'vue',
    icon: 'vue',
    headline: 'The same picker, in Vue.',
    meta: [
      ['package', '@blobbies/vue'],
      ['size', sizeOf('@blobbies/vue')],
      ['deps', 'vue'],
    ],
    install: 'npm i blobbies @blobbies/vue',
    file: 'Profile.vue',
    code: `<script setup>
import { Avatar, AvatarPicker } from '@blobbies/vue'
</script>

<template>
  <Avatar :name="user.name" :size="40" animate="all" />
  <AvatarPicker :name="user.name" @save="onSave" />
</template>`,
  },
  {
    id: 'svelte',
    label: 'svelte',
    icon: 'svelte',
    headline: 'The same picker, in Svelte.',
    meta: [
      ['package', '@blobbies/svelte'],
      ['size', sizeOf('@blobbies/svelte')],
      ['deps', 'svelte'],
    ],
    install: 'npm i blobbies @blobbies/svelte',
    file: 'Profile.svelte',
    code: `<script>
  import { Avatar, AvatarPicker } from '@blobbies/svelte';
</script>

<Avatar name={user.name} size={40} animate="all" />
<AvatarPicker name={user.name} onsave={onSave} />`,
  },
  {
    id: 'native',
    label: 'react native',
    // React Native draws the same mark, and svgl has no separate one.
    icon: 'react',
    headline: 'The same face, on a phone.',
    meta: [
      ['package', '@blobbies/react-native'],
      ['size', sizeOf('@blobbies/react-native')],
      ['deps', 'react-native-svg'],
    ],
    install: 'npm i blobbies @blobbies/react-native',
    file: 'Profile.tsx',
    code: `import { Avatar } from '@blobbies/react-native'

export function Profile({ user }) {
  return (
    <Avatar
      name={user.name}
      size={40}
    />
  )
}`,
  },
  {
    id: 'element',
    label: 'web component',
    icon: 'html5',
    headline: 'One tag. Anywhere HTML runs.',
    meta: [
      ['package', '@blobbies/element'],
      ['size', sizeOf('@blobbies/element')],
      ['works in', 'svelte · vue · solid · angular'],
    ],
    install: 'npm i @blobbies/element',
    file: 'index.html',
    code: `<script type="module">
  import '@blobbies/element'
</script>

<blobbies-avatar
  name="Sourav"
  size="40"
  motion="all"
></blobbies-avatar>`,
  },
  {
    id: 'core',
    label: 'vanilla',
    icon: 'javascript',
    headline: 'The engine, with nothing around it.',
    meta: [
      ['package', 'blobbies'],
      ['size', sizeOf('blobbies')],
      ['deps', 'none'],
    ],
    install: 'npm i blobbies',
    file: 'avatar.ts',
    code: `import { renderAvatarSvg } from 'blobbies'

const svg = renderAvatarSvg('Sourav', {
  size: 40,
  animate: 'all',
})

document.querySelector('#avatar').innerHTML = svg`,
  },
  {
    id: 'swift',
    label: 'swift',
    icon: 'swift',
    headline: 'The same face, in SwiftUI.',
    meta: [
      ['package', 'Blobbies'],
      ['platforms', 'iOS · macOS'],
      ['deps', 'SwiftUI'],
    ],
    install: 'github.com/SouravInsights/blobbies',
    file: 'Profile.swift',
    code: `import Blobbies
import SwiftUI

struct Profile: View {
  let user: User

  var body: some View {
    BlobbiesAvatar(name: user.name)
      .frame(width: 40, height: 40)
  }
}`,
  },
];
