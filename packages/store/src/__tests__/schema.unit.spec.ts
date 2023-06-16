/* eslint-disable @typescript-eslint/no-restricted-imports */

import { literal } from 'lit/static-html.js';
import { describe, expect, it } from 'vitest';

// Use manual per-module import/export to support vitest environment on Node.js
import { DividerBlockSchema } from '../../../blocks/src/divider-block/divider-model.js';
import { FrameBlockSchema } from '../../../blocks/src/frame-block/frame-model.js';
import { ListBlockSchema } from '../../../blocks/src/list-block/list-model.js';
import { PageBlockSchema } from '../../../blocks/src/page-block/page-model.js';
import { ParagraphBlockSchema } from '../../../blocks/src/paragraph-block/paragraph-model.js';
import { SchemaValidateError } from '../../../global/src/error/index.js';
import { defineBlockSchema } from '../base';
import { Generator } from '../store';
import type { Page } from '../workspace';
import { Workspace } from '../workspace';

function createTestOptions() {
  const idGenerator = Generator.AutoIncrement;
  return { id: 'test-workspace', idGenerator, isSSR: true };
}

const TestCustomFrameBlockSchema = defineBlockSchema({
  flavour: 'affine:frame-block-video',
  props: internal => ({
    text: internal.Text(),
  }),
  metadata: {
    version: 1,
    role: 'content',
    tag: literal`affine-frame-block-video`,
    parent: ['affine:frame'],
  },
});

const TestInvalidFrameBlockSchema = defineBlockSchema({
  flavour: 'affine:frame-invalid-block-video',
  props: internal => ({
    text: internal.Text(),
  }),
  metadata: {
    version: 1,
    role: 'content',
    tag: literal`affine-invalid-frame-block-video`,
    parent: ['affine:frame'],
  },
});

const BlockSchemas = [
  ParagraphBlockSchema,
  PageBlockSchema,
  ListBlockSchema,
  FrameBlockSchema,
  DividerBlockSchema,
  TestCustomFrameBlockSchema,
  TestInvalidFrameBlockSchema,
];

const defaultPageId = 'page0';
async function createTestPage(pageId = defaultPageId) {
  const options = createTestOptions();
  const workspace = new Workspace(options).register(BlockSchemas);
  const page = workspace.createPage({ id: pageId });
  await page.waitForLoaded();
  return page;
}

describe('schema', () => {
  it('should be able to validate schema by role', async () => {
    const page = await createTestPage();
    const pageId = page.addBlock('affine:page', {});
    const frameId = page.addBlock('affine:frame', {}, pageId);
    const paragraphId = page.addBlock('affine:paragraph', {}, frameId);

    // add frame to root should throw
    expect(() => page.addBlock('affine:frame', {})).toThrow(
      SchemaValidateError
    );

    // add paragraph to root should throw
    expect(() => page.addBlock('affine:paragraph', {}, pageId)).toThrow(
      SchemaValidateError
    );

    expect(() => page.addBlock('affine:frame', {}, pageId)).not.toThrow();
    expect(() => page.addBlock('affine:paragraph', {}, frameId)).not.toThrow();
    expect(() =>
      page.addBlock('affine:paragraph', {}, paragraphId)
    ).not.toThrow();
  });

  it('should glob match works', async () => {
    const page = await createTestPage();
    const pageId = page.addBlock('affine:page', {});
    const frameId = page.addBlock('affine:frame', {}, pageId);

    expect(() =>
      page.addBlock('affine:frame-block-video', {}, frameId)
    ).not.toThrow();

    expect(() =>
      page.addBlock('affine:frame-invalid-block-video', {}, frameId)
    ).toThrow();
  });
});
