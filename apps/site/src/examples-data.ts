/**
 * Hard-coded, not fetched.
 *
 * A list of where the examples live is not data — it is four links, and the
 * build should fail loudly if one is wrong rather than render a card that leads
 * nowhere. The browser tests cover the picker; this page only has to point at
 * the apps they run against.
 */
export interface Example {
  name: string;
  href: string;
  /** A key in `logos.ts` — the framework's own mark, from svgl. */
  icon: string;
  /** The file you would be editing, which is the thing a reader is looking for. */
  file: string;
  what: string;
  /** True when the picker is in it — the thing most people come here for. */
  picker: boolean;
}

export const EXAMPLES: readonly Example[] = [
  {
    name: 'React',
    href: 'https://blobbies-example-react.vercel.app',
    icon: 'react',
    file: 'App.tsx',
    what: 'The avatar and the picker, in one import.',
    picker: true,
  },
  {
    name: 'Vue',
    href: 'https://blobbies-example-vue.vercel.app',
    icon: 'vue',
    file: 'App.vue',
    what: 'The same picker, in Vue.',
    picker: true,
  },
  {
    name: 'Svelte',
    href: 'https://blobbies-example-svelte.vercel.app',
    icon: 'svelte',
    file: 'App.svelte',
    what: 'The same picker, in Svelte.',
    picker: true,
  },
  {
    name: 'Plain HTML',
    href: 'https://blobbies-example-html.vercel.app',
    icon: 'html5',
    file: 'index.html',
    what: 'One tag, and no framework at all. No picker — a custom element does not render on the server.',
    picker: false,
  },
];

/**
 * The face every card shows.
 *
 * The same name in all four, so the page makes its own point: the avatar does
 * not depend on what is around it.
 */
export const SAMPLE = 'Ada Lovelace';
