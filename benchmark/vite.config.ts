import { defineConfig } from 'vite';
import { resolve } from 'node:path';

// https://vitejs.dev/config/
export default defineConfig({
  base: '',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
      external: ['/bench.js'],
    },
  },
});
