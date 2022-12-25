import { resolve } from 'path';
import { defineConfig } from 'vite';
import { basename, extname } from 'node:path';
import banner from 'vite-plugin-banner';

export default defineConfig({
  build: {
    emptyOutDir: false,
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        std: resolve(__dirname, 'src/std.ts'),
        models: resolve(__dirname, 'src/models.ts'),
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: [
        'yjs',
        /^y-protocols/,
        '@blocksuite/store',
        'highlight.js',
        '@tldraw/intersect',
        '@tldraw/vec',
        'hotkeys-js',
        /^lit/,
        'perfect-freehand',
        'quill',
        'quill-cursors',
      ],
    },
  },
  plugins: [
    banner({
      content: fileName => {
        return `/// <reference types="./${basename(
          fileName,
          extname(fileName)
        )}.d.ts" />
/**/
`;
      },
      verify: false,
    }),
  ],
});
