import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      // Test against the core sources directly so tests never depend on a
      // prior build step.
      'blobbies/motion': resolve(__dirname, '../core/src/motion.ts'),
      blobbies: resolve(__dirname, '../core/src/index.ts'),
    },
  },
  test: {
    environment: 'jsdom',
    include: ['test/**/*.test.tsx', 'test/**/*.test.ts'],
  },
});
