import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    emptyOutDir: false,
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'block',
      fileName: 'index',
      formats: ['es'],
    },
    rollupOptions: {
      output: {},
      external: 'yjs',
    },
  },
});
