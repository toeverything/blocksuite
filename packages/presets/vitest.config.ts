import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig(_configEnv =>
  defineConfig({
    esbuild: { target: 'es2018' },
    optimizeDeps: {
      force: true,
      esbuildOptions: {
        // Vitest hardcodes the esbuild target to es2020,
        // override it to es2022 for top level await.
        target: 'es2022',
      },
    },
    test: {
      include: ['src/__tests__/**/*.spec.ts'],
      browser: {
        enabled: true,
        headless: true,
        name: 'chromium',
        provider: 'playwright',
        isolate: false,
        providerOptions: {},
      },
      coverage: {
        provider: 'istanbul', // or 'c8'
        reporter: ['lcov'],
        reportsDirectory: '../../.coverage/presets',
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
          fileURLToPath(new URL('../framework/global/src/*', import.meta.url))
        ),
        '@blocksuite/store': path.resolve(
          fileURLToPath(new URL('../framework/store/src', import.meta.url))
        ),
        '@blocksuite/inline': path.resolve(
          fileURLToPath(new URL('../framework/inline/src', import.meta.url))
        ),
        '@blocksuite/inline/*': path.resolve(
          fileURLToPath(new URL('../framework/inline/src/*', import.meta.url))
        ),
      },
    },
  })
);
