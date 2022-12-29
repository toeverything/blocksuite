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
        editor: resolve(__dirname, 'src/editor.ts'),
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: ['react', /^@blocksuite/, /^zustand/],
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
