/* eslint-disable @typescript-eslint/no-restricted-imports */

import { describe, expect, it } from 'vitest';

// Use manual per-module import/export to support vitest environment on Node.js
import { DividerBlockSchema } from '../../../blocks/src/divider-block/divider-model.js';
import { FrameBlockSchema } from '../../../blocks/src/frame-block/frame-model.js';
import { ListBlockSchema } from '../../../blocks/src/list-block/list-model.js';
import { PageBlockSchema } from '../../../blocks/src/page-block/page-model.js';
import { ParagraphBlockSchema } from '../../../blocks/src/paragraph-block/paragraph-model.js';
import { SchemaValidateError } from '../../../global/src/error/index.js';
import { Generator } from '../store';
import { Workspace } from '../workspace';

function createTestOptions() {
  const idGenerator = Generator.AutoIncrement;
  return { id: 'test-workspace', idGenerator, isSSR: true };
}

const BlockSchemas = [
  ParagraphBlockSchema,
  PageBlockSchema,
  ListBlockSchema,
  FrameBlockSchema,
  DividerBlockSchema,
];

const defaultPageId = 'page0';
function createTestPage(pageId = defaultPageId) {
  const options = createTestOptions();
  const workspace = new Workspace(options).register(BlockSchemas);
  return workspace.createPage({ id: pageId });
}

describe('schema', () => {
  it('should be able to validate schema by role', () => {
    const page = createTestPage();
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
});
