import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'istanbul', // or 'c8'
      reporter: ['lcov'],
      reportsDirectory: '../../.coverage/sync',
    },
    include: ['src/__tests__/**/*.unit.spec.ts'],
    /**
     * Custom handler for console.log in tests.
     *
     * Return `false` to ignore the log.
     */
    onConsoleLog(log, type) {
      console.warn(`Unexpected ${type} log`, log);
      throw new Error(log);
    },
    restoreMocks: true,
    testTimeout: 500,
  },
});
