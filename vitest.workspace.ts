/**
 * Root vitest workspace: every package with unit tests, so `yarn vitest run`
 * at the root (and the CI unit-test job) covers them all in one pass.
 * integration-test is excluded on purpose — it runs in browser mode
 * (playwright) and has its own CI job.
 */
export default [
  'packages/affine/all/vitest.config.ts',
  'packages/affine/blocks/bookmark/vitest.config.ts',
  'packages/affine/data-view/vitest.config.ts',
  'packages/affine/ext-loader/vitest.config.ts',
  'packages/affine/gfx/connector/vitest.config.ts',
  'packages/affine/inlines/footnote/vitest.config.ts',
  'packages/affine/shared/vitest.config.ts',
  'packages/framework/global/vitest.config.ts',
  'packages/framework/std/vitest.config.ts',
  'packages/framework/store/vitest.config.ts',
  'packages/framework/sync/vitest.config.ts',
];
