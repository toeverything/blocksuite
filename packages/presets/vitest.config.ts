import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vitest/config';

export default defineConfig(_configEnv =>
  defineConfig({
    optimizeDeps: {
      force: true,
      include: ['@blocksuite/blocks > buffer'],
    },
    test: {
      include: ['src/__tests__/**/*.spec.ts'],
      browser: {
        enabled: true,
        headless: false,
        name: 'chromium',
        provider: 'playwright',
        isolate: false,
        providerOptions: {},
      },
      deps: {
        interopDefault: true,
      },
      testTransformMode: {
        web: ['src/__tests__/**/*.spec.ts'],
      },
      alias: {
        '@blocksuite/blocks': path.resolve(
          fileURLToPath(new URL('../blocks/src', import.meta.url))
        ),
        '@blocksuite/blocks/*': path.resolve(
          fileURLToPath(new URL('../blocks/src/*', import.meta.url))
        ),
        '@blocksuite/global/*': path.resolve(
          fileURLToPath(new URL('../global/src/*', import.meta.url))
        ),
        '@blocksuite/store': path.resolve(
          fileURLToPath(new URL('../store/src', import.meta.url))
        ),
        '@blocksuite/inline': path.resolve(
          fileURLToPath(new URL('../inline/src', import.meta.url))
        ),
        '@blocksuite/inline/*': path.resolve(
          fileURLToPath(new URL('../inline/src/*', import.meta.url))
        ),
      },
    },
  })
);
