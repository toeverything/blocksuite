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
    },
  })
);
