import path, { resolve } from 'node:path';

import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';
import istanbul from 'vite-plugin-istanbul';

import { hmrPlugin } from './scripts/hmr-plugin';

const enableIstanbul = !!process.env.CI || !!process.env.COVERAGE;

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    hmrPlugin,
    enableIstanbul &&
      istanbul({
        cwd: fileURLToPath(new URL('../..', import.meta.url)),
        include: ['packages/**/src/*'],
        exclude: [
          'node_modules',
          'tests',
          fileURLToPath(new URL('.', import.meta.url)),
        ],
        forceBuildInstrument: true,
      }),
  ],
  build: {
    sourcemap: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        'examples/basic': resolve(__dirname, 'examples/basic/index.html'),
        'examples/canvas': resolve(__dirname, 'examples/canvas/index.html'),
        'examples/canvas/connector': resolve(
          __dirname,
          'examples/canvas/connector.html'
        ),
        'examples/counter': resolve(__dirname, 'examples/counter/index.html'),
        'examples/workspace': resolve(
          __dirname,
          'examples/workspace/index.html'
        ),
        'examples/virgo': resolve(__dirname, 'examples/virgo/index.html'),
        'examples/store': resolve(__dirname, 'examples/store/index.html'),
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
      '@blocksuite/store': path.resolve(
        fileURLToPath(new URL('../store/src', import.meta.url))
      ),
      '@blocksuite/phasor': path.resolve(
        fileURLToPath(new URL('../phasor/src', import.meta.url))
      ),
      '@blocksuite/phasor/*': path.resolve(
        fileURLToPath(new URL('../phasor/src/*', import.meta.url))
      ),
      '@blocksuite/virgo': path.resolve(
        fileURLToPath(new URL('../virgo/src', import.meta.url))
      ),
      '@blocksuite/virgo/*': path.resolve(
        fileURLToPath(new URL('../virgo/src/*', import.meta.url))
      ),
    },
  },
});
