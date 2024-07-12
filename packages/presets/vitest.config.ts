import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig(_configEnv =>
  defineConfig({
    esbuild: { target: 'es2018' },
    optimizeDeps: {
      esbuildOptions: {
        // Vitest hardcodes the esbuild target to es2020,
        // override it to es2022 for top level await.
        target: 'es2022',
      },
      force: true,
    },
    test: {
      alias: {
        '@blocksuite/blocks': path.resolve(
          fileURLToPath(new URL('../blocks/src', import.meta.url))
        ),
        '@blocksuite/blocks/*': path.resolve(
          fileURLToPath(new URL('../blocks/src/*', import.meta.url))
        ),
        '@blocksuite/global/*': path.resolve(
          fileURLToPath(new URL('../framework/global/src/*', import.meta.url))
        ),
        '@blocksuite/inline': path.resolve(
          fileURLToPath(new URL('../framework/inline/src', import.meta.url))
        ),
        '@blocksuite/inline/*': path.resolve(
          fileURLToPath(new URL('../framework/inline/src/*', import.meta.url))
        ),
        '@blocksuite/store': path.resolve(
          fileURLToPath(new URL('../framework/store/src', import.meta.url))
        ),
      },
      browser: {
        enabled: true,
        headless: false,
        isolate: false,
        name: 'chromium',
        provider: 'playwright',
        providerOptions: {},
      },
      deps: {
        interopDefault: true,
      },
      include: ['src/__tests__/**/*.spec.ts'],
      testTransformMode: {
        web: ['src/__tests__/**/*.spec.ts'],
      },
    },
  })
);
