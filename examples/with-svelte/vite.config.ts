import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';

/**
 * The example resolves `@blobbies/svelte` through the workspace link, so it
 * always runs against the code in this repo rather than a published copy — and
 * it is the only place that compiles the package's own `.svelte` files the way
 * a stranger's app would, since the package ships them as source.
 */
export default defineConfig({
  plugins: [svelte()],
  server: { port: 5175 },
});
