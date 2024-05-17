import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  './packages/blocks/vitest.config.ts',
  './packages/framework/block-std/vitest.config.ts',
  './packages/framework/global/vitest.config.ts',
  './packages/framework/inline/vitest.config.ts',
  './packages/framework/store/vitest.config.ts',
  './packages/presets/vitest.config.ts',
]);
