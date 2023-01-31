import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path, { resolve } from 'node:path';
import { fileURLToPath } from 'url';
import { hmrPlugin } from './scripts/hmr-plugin';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), hmrPlugin],
  build: {
    sourcemap: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        'examples/basic': resolve(__dirname, 'examples/basic/index.html'),
        'examples/blob': resolve(__dirname, 'examples/blob/index.html'),
        'examples/canvas': resolve(__dirname, 'examples/canvas/index.html'),
        'examples/counter': resolve(__dirname, 'examples/counter/index.html'),
        'examples/workspace': resolve(
          __dirname,
          'examples/workspace/index.html'
        ),
      },
    },
  },
  resolve: {
    alias: {
      '@blocksuite/blocks': path.resolve(
        fileURLToPath(new URL('../blocks/src', import.meta.url))
      ),
      '@blocksuite/blocks/*': path.resolve(
        fileURLToPath(new URL('../blocks/src/*', import.meta.url))
      ),
      '@blocksuite/global/*': path.resolve(
        fileURLToPath(new URL('../global/src/*', import.meta.url))
      ),
    },
  },
});
