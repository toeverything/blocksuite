import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    emptyOutDir: false,
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      fileName: 'index',
      name: 'BlockSuiteStore',
      formats: ['es', 'umd'],
    },
    rollupOptions: {
      output: {},
      external: [
        'buffer',
        'flexsearch',
        'idb-keyval',
        'ky',
        'lib0',
        'sha3',
        'y-indexeddb',
        'y-protocols',
        'y-webrtc',
        'y-websocket',
        'yjs',
      ],
    },
  },
});
