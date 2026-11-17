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
  file: string;
  what: string;
  /** True when the picker is in it — the thing most people come here for. */
  picker: boolean;
}

export const EXAMPLES: readonly Example[] = [
  {
    name: 'React',
    href: 'https://blobbies-example-react.vercel.app',
    file: 'App.tsx',
    what: 'The Avatar and the picker, as a React app uses them.',
    picker: true,
  },
  {
    name: 'Vue',
    href: 'https://blobbies-example-vue.vercel.app',
    file: 'App.vue',
    what: 'The same pair, with a composable for your own layout.',
    picker: true,
  },
  {
    name: 'Svelte',
    href: 'https://blobbies-example-svelte.vercel.app',
    file: 'App.svelte',
    what: 'The same pair, with a rune module for your own layout.',
    picker: true,
  },
  {
    name: 'Plain HTML',
    href: 'https://blobbies-example-html.vercel.app',
    file: 'index.html',
    what: 'One tag and one import. No framework, and no picker — a custom element cannot server-render.',
    picker: false,
  },
];
