import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    emptyOutDir: false,
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        editor: resolve(__dirname, 'src/editor.ts'),
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: ['react', /^@blocksuite/, /^zustand/],
    },
  },
});
