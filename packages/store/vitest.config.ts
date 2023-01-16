import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/__tests__/*.spec.ts'],
    testTimeout: 500,
  },
});
