import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'url';
import { hmrPlugins } from './scripts/hmrPlugin';

const customLitPath = path.resolve(
  __dirname,
  '../blocks/src/__internal__/index.js'
);

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), hmrPlugins],
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
