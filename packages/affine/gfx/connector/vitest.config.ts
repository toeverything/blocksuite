import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    root: './packages/affine/gfx/connector',
    include: ['src/__tests__/**/*.unit.spec.ts'],
    testTimeout: 1000,
  },
});
