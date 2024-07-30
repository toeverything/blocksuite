import type { UserConfig } from 'vite';

import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { defineConfig, mergeConfig } from 'vite';

import { brotliAsync, gzipAsync } from '../../scripts/utils.js';
import base from './vite.config';

const sizeDir = resolve(__dirname, '../../temp/size');

const baseConfig: UserConfig = base({ mode: process.env.NODE_ENV });

const config = mergeConfig(
  baseConfig,
  defineConfig({
    plugins: [
      {
        name: 'remove-dynamic-import',
        resolveDynamicImport() {
          return 'empty-file';
        },
        load(id) {
          if (id === 'empty-file') return 'export {}';
        },
        async writeBundle(o, bundle) {
          const chunk = bundle['main.js'];
          if (chunk.type !== 'chunk') return;

          const file = chunk.code;
          const gzipped = await gzipAsync(file);
          const brotli = await brotliAsync(file);

          await mkdir(sizeDir, { recursive: true });
          await writeFile(
            resolve(sizeDir, `playground.json`),
            JSON.stringify({
              file: 'examples/basic',
              size: file.length,
              gzip: gzipped.length,
              brotli: brotli.length,
            }),
            'utf-8'
          );
        },
      },
    ],
    build: {
      outDir: resolve(__dirname, 'temp/dist-basic'),
      rollupOptions: {
        output: {
          entryFileNames: '[name].js',
        },
      },
    },
  })
);

config.build!.rollupOptions!.input = {
  main: resolve(__dirname, 'examples/basic/page/index.html'),
};

export default config;
