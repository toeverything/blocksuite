import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    emptyOutDir: false,
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      fileName: 'index',
      name: 'BlockSuiteEditor',
      formats: ['es', 'umd'],
    },
    rollupOptions: {
      output: {},
      external: [
        '@blocksuite/blocks',
        '@blocksuite/store',
        'lit',
        'marked',
        'turndown',
      ],
    },
  },
});
