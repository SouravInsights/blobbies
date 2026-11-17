import { resolve } from 'node:path';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineWorkspace } from 'vitest/config';

/**
 * Svelte compiles a component *twice*: once for the server and once for the
 * browser, and a server-compiled component cannot be mounted, or vice versa.
 * So the two environments are two projects rather than one config with a flag.
 */
const alias = {
  // Test against the core sources directly so tests never depend on a prior
  // build step.
  'blobbies/motion': resolve(__dirname, '../core/src/motion.ts'),
  'blobbies/picker': resolve(__dirname, '../core/src/picker.ts'),
  blobbies: resolve(__dirname, '../core/src/index.ts'),
};

const plugins = [svelte({ hot: false })];

export default defineWorkspace([
  {
    plugins,
    resolve: { alias, conditions: ['browser'] },
    test: {
      name: 'dom',
      environment: 'jsdom',
      include: ['test/dom.test.ts'],
    },
  },
  {
    plugins,
    resolve: { alias },
    test: {
      name: 'ssr',
      environment: 'node',
      include: ['test/ssr.test.ts'],
    },
  },
]);
