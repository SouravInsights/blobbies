import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    motion: 'src/motion.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  // Each entry is bundled independently so static users never pull in motion.
  splitting: false,
  minify: true,
  target: 'es2020',
});
