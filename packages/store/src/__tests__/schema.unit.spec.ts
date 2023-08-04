/* eslint-disable @typescript-eslint/no-restricted-imports */

import { literal } from 'lit/static-html.js';
import { describe, expect, it } from 'vitest';

// Use manual per-module import/export to support vitest environment on Node.js
import { DividerBlockSchema } from '../../../blocks/src/divider-block/divider-model.js';
import { ListBlockSchema } from '../../../blocks/src/list-block/list-model.js';
import { NoteBlockSchema } from '../../../blocks/src/note-block/note-model.js';
import { PageBlockSchema } from '../../../blocks/src/page-block/page-model.js';
import { ParagraphBlockSchema } from '../../../blocks/src/paragraph-block/paragraph-model.js';
import { SchemaValidateError } from '../../../global/src/error/index.js';
import { defineBlockSchema } from '../base';
import { Generator } from '../store';
import { Schema, Workspace } from '../workspace';

function createTestOptions() {
  const idGenerator = Generator.AutoIncrement;
  const schema = new Schema();
  schema.register(BlockSchemas);
  return { id: 'test-workspace', idGenerator, isSSR: true, schema };
}

const TestCustomNoteBlockSchema = defineBlockSchema({
  flavour: 'affine:note-block-video',
  props: internal => ({
    text: internal.Text(),
  }),
  metadata: {
    version: 1,
    role: 'content',
    tag: literal`affine-note-block-video`,
    parent: ['affine:note'],
  },
});

const TestInvalidNoteBlockSchema = defineBlockSchema({
  flavour: 'affine:note-invalid-block-video',
  props: internal => ({
    text: internal.Text(),
  }),
  metadata: {
    version: 1,
    role: 'content',
    tag: literal`affine-invalid-note-block-video`,
    parent: ['affine:note'],
  },
});

const BlockSchemas = [
  ParagraphBlockSchema,
  PageBlockSchema,
  ListBlockSchema,
  NoteBlockSchema,
  DividerBlockSchema,
  TestCustomNoteBlockSchema,
  TestInvalidNoteBlockSchema,
];

const defaultPageId = 'page0';
async function createTestPage(pageId = defaultPageId) {
  const options = createTestOptions();
  const workspace = new Workspace(options);
  const page = workspace.createPage({ id: pageId });
  await page.waitForLoaded();
  return page;
}

describe('schema', () => {
  it('should be able to validate schema by role', async () => {
    const page = await createTestPage();
    const pageId = page.addBlock('affine:page', {});
    const noteId = page.addBlock('affine:note', {}, pageId);
    const paragraphId = page.addBlock('affine:paragraph', {}, noteId);

    // add note to root should throw
    expect(() => page.addBlock('affine:note', {})).toThrow(SchemaValidateError);

    // add paragraph to root should throw
    expect(() => page.addBlock('affine:paragraph', {}, pageId)).toThrow(
      SchemaValidateError
    );

    expect(() => page.addBlock('affine:note', {}, pageId)).not.toThrow();
    expect(() => page.addBlock('affine:paragraph', {}, noteId)).not.toThrow();
    expect(() =>
      page.addBlock('affine:paragraph', {}, paragraphId)
    ).not.toThrow();
  });

  it('should glob match works', async () => {
    const page = await createTestPage();
    const pageId = page.addBlock('affine:page', {});
    const noteId = page.addBlock('affine:note', {}, pageId);

    expect(() =>
      page.addBlock('affine:note-block-video', {}, noteId)
    ).not.toThrow();

    expect(() =>
      page.addBlock('affine:note-invalid-block-video', {}, noteId)
    ).toThrow();
  });
});
