import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['packages/store/src/__tests__/*.spec.ts'],
  },
});
