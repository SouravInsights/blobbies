import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

/**
 * The example resolves `@blobbies/vue` through the workspace link, so it always
 * runs against the code in this repo rather than a published copy — which is
 * the point of keeping examples inside the monorepo. It also means CI builds
 * them, and an example that stops compiling is the earliest signal a binding
 * broke.
 */
export default defineConfig({
  plugins: [vue()],
  server: { port: 5174 },
});
