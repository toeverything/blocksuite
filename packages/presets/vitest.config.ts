import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vitest/config';

export default defineConfig(configEnv =>
  defineConfig({
    optimizeDeps: {
      force: true,
      include: ['@blocksuite/blocks > buffer'],
    },
    test: {
      include: ['tests/**/*.spec.ts'],
      browser: {
        enabled: true,
        headless: true,
        name: 'chromium',
        provider: 'playwright',
        isolate: false,
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
);
