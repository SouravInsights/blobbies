import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

/** The example resolves `@blobbies/react` through the workspace link. */
export default defineConfig({
  plugins: [react()],
  server: { port: 5177 },
});
