import { defineConfig } from 'vite';

/**
 * No framework, and no framework plugin. The whole example is an HTML file and
 * one import — which is the point of the web component: `<blobbies-avatar>`
 * works in a `.html` file the same way it works in Vue, Svelte or Angular, and
 * this example is what that claim looks like written down.
 */
export default defineConfig({
  server: { port: 5176 },
});
