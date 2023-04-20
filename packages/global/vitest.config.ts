import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@blocksuite/global': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    include: ['tests/*.unit.ts'],
    testTimeout: 500,
    coverage: {
      provider: 'istanbul', // or 'c8'
      reporter: ['lcov'],
      reportsDirectory: '../../.coverage/global',
    },
    /**
     * Custom handler for console.log in tests.
     *
     * Return `false` to ignore the log.
     */
    onConsoleLog(log, type) {
      console.warn(`Unexpected ${type} log`, log);
      throw new Error(log);
    },
  },
});
