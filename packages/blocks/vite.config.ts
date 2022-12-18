import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  resolve: {
    alias: {
      '@blocksuite/shared': resolve(__dirname, '..', 'shared', 'src'),
    },
  },
  build: {
    emptyOutDir: false,
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      fileName: 'index',
      formats: ['es'],
    },
    rollupOptions: {
      output: {},
      external: [
        'yjs',
        '@blocksuite/store',
        'highlight.js',
        '@tldraw/intersect',
        '@tldraw/vec',
        'hotkeys-js',
        'lit',
        'perfect-freehand',
        'quill',
        'quill-cursors',
        /^@blocksuite\/shared/,
      ],
    },
  },
});
