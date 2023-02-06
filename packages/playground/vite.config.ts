import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path, { resolve } from 'node:path';
import { fileURLToPath } from 'url';
import { hmrPlugin } from './scripts/hmr-plugin';
import istanbul from 'vite-plugin-istanbul';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    hmrPlugin,
    istanbul({
      cwd: fileURLToPath(new URL('../..', import.meta.url)),
      include: ['packages/**/src/*', 'packages/playground/examples/**/*'],
      exclude: ['node_modules', 'tests'],
      forceBuildInstrument: !!process.env.CI || !!process.env.COVERAGE,
    }),
  ],
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
        'examples/virgo': resolve(__dirname, 'examples/virgo/index.html'),
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
