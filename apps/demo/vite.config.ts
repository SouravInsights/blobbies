import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const repo = resolve(__dirname, '../..');

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Run the demo straight off source so `pnpm dev` needs no prior build.
      'blobbies/motion': resolve(repo, 'packages/core/src/motion.ts'),
      blobbies: resolve(repo, 'packages/core/src/index.ts'),
      '@blobbies/react': resolve(repo, 'packages/react/src/index.ts'),
    },
  },
  server: { port: 5173, open: false },
});
