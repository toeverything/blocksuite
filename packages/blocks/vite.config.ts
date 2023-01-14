import { resolve } from 'path';
import { defineConfig } from 'vite';

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
        /^@blocksuite/,
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
});
