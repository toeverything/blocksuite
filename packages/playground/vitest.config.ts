import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, mergeConfig } from 'vitest/config';

import viteConfig from './vite.config';

export default defineConfig(
  configEnv =>
    mergeConfig(
      viteConfig(configEnv),
      defineConfig({
        optimizeDeps: {
          force: true,
          include: ['@blocksuite/blocks > buffer'],
        },
        test: {
          include: ['tests/**/*.spec.ts'],
          browser: {
            enabled: true,
            headless: false,
            name: 'chromium',
            provider: 'playwright',
            providerOptions: {},
          },
          deps: {
            interopDefault: true,
          },
          testTransformMode: {
            web: ['tests/**/*.spec.ts'],
          },
          alias: {
            '@blocksuite/blocks': path.resolve(
              fileURLToPath(new URL('../blocks/src', import.meta.url))
            ),
            '@blocksuite/blocks/*': path.resolve(
              fileURLToPath(new URL('../blocks/src/*', import.meta.url))
            ),
            '@blocksuite/editor': path.resolve(
              fileURLToPath(new URL('../editor/src', import.meta.url))
            ),
            '@blocksuite/global/*': path.resolve(
              fileURLToPath(new URL('../global/src/*', import.meta.url))
            ),
            '@blocksuite/store': path.resolve(
              fileURLToPath(new URL('../store/src', import.meta.url))
            ),
            '@blocksuite/virgo': path.resolve(
              fileURLToPath(new URL('../virgo/src', import.meta.url))
            ),
            '@blocksuite/virgo/*': path.resolve(
              fileURLToPath(new URL('../virgo/src/*', import.meta.url))
            ),
          },
        },
      })
    )

  // defineConfig({
  //   optimizeDeps: {
  //     force: true,
  //     include: ['/node_modules/buffer/'],
  //   },
  //   build: {
  //     commonjsOptions: {
  //       include: ['/node_modules/buffer/'],
  //     },
  //   },
  //   test: {
  //     include: ['tests/**/*.spec.ts'],
  //     browser: {
  //       enabled: true,
  //       headless: false,
  //       name: 'chromium',
  //       provider: 'playwright',
  //     },
  //     testTransformMode: {
  //       web: ['tests/**/*.spec.ts'],
  //     },
  //     alias: {
  //       '@blocksuite/blocks': path.resolve(
  //         fileURLToPath(new URL('../blocks/src', import.meta.url))
  //       ),
  //       '@blocksuite/editor': path.resolve(
  //         fileURLToPath(new URL('../editor/src', import.meta.url))
  //       ),
  //       '@blocksuite/global/*': path.resolve(
  //         fileURLToPath(new URL('../global/src/*', import.meta.url))
  //       ),
  //       '@blocksuite/store': path.resolve(
  //         fileURLToPath(new URL('../store/src', import.meta.url))
  //       ),
  //       '@blocksuite/virgo': path.resolve(
  //         fileURLToPath(new URL('../virgo/src', import.meta.url))
  //       ),
  //       '@blocksuite/virgo/*': path.resolve(
  //         fileURLToPath(new URL('../virgo/src/*', import.meta.url))
  //       ),
  //     },
  //   },
  // })
);
