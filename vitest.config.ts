import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'istanbul', // or 'c8'
      reporter: ['lcov'],
      reportsDirectory: './.coverage/unit',
    },
  },
});
