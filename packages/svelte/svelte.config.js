import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** Lets `<script lang="ts">` compile and `svelte-package` emit `.d.ts`. */
export default {
  preprocess: vitePreprocess(),
};
