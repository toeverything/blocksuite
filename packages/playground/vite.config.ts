import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'url';
import { hmrPlugin, presets } from 'vite-plugin-web-components-hmr';

const customLitPath = path.resolve(
  __dirname,
  '../blocks/src/__internal__/index.js'
);

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    hmrPlugin({
      include: ['../blocks/src/**/*.ts'],
      exclude: ['**/*/node_modules/**/*'],
      presets: [presets.lit],
      decorators: [{ name: 'customElement', import: 'lit/decorators.js' }],
      baseClasses: [
        {
          name: 'NonShadowLitElement',
          import: customLitPath,
        },
      ],
    }),
  ],
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
