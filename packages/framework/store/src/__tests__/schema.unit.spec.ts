/* eslint-disable @typescript-eslint/no-restricted-imports */

import { literal } from 'lit/static-html.js';
import { describe, expect, it } from 'vitest';

// import some blocks
import { type BlockModel, defineBlockSchema } from '../schema/base.js';
import { SchemaValidateError } from '../schema/error.js';
import { Schema } from '../schema/index.js';
import { Workspace } from '../workspace/index.js';
import { Generator } from '../workspace/store.js';
import {
  DividerBlockSchema,
  ListBlockSchema,
  NoteBlockSchema,
  ParagraphBlockSchema,
  RootBlockSchema,
} from './test-schema.js';

function createTestOptions() {
  const idGenerator = Generator.AutoIncrement;
  const schema = new Schema();
  schema.register(BlockSchemas);
  return { id: 'test-workspace', idGenerator, schema };
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
  RootBlockSchema,
  ParagraphBlockSchema,
  ListBlockSchema,
  NoteBlockSchema,
  DividerBlockSchema,
  TestCustomNoteBlockSchema,
  TestInvalidNoteBlockSchema,
];

const defaultDocId = 'doc0';
function createTestDoc(docId = defaultDocId) {
  const options = createTestOptions();
  const workspace = new Workspace(options);
  const doc = workspace.createDoc({ id: docId });
  doc.load();
  return doc;
}

describe('schema', () => {
  it('should be able to validate schema by role', () => {
    const doc = createTestDoc();
    const rootId = doc.addBlock('affine:page', {});
    const noteId = doc.addBlock('affine:note', {}, rootId);
    const paragraphId = doc.addBlock('affine:paragraph', {}, noteId);

    // add note to root should throw
    expect(() => doc.addBlock('affine:note', {})).toThrow(SchemaValidateError);

    // add paragraph to root should throw
    expect(() => doc.addBlock('affine:paragraph', {}, rootId)).toThrow(
      SchemaValidateError
    );

    expect(() => doc.addBlock('affine:note', {}, rootId)).not.toThrow();
    expect(() => doc.addBlock('affine:paragraph', {}, noteId)).not.toThrow();
    expect(() =>
      doc.addBlock('affine:paragraph', {}, paragraphId)
    ).not.toThrow();
  });

  it('should glob match works', () => {
    const doc = createTestDoc();
    const rootId = doc.addBlock('affine:page', {});
    const noteId = doc.addBlock('affine:note', {}, rootId);

    expect(() =>
      doc.addBlock('affine:note-block-video', {}, noteId)
    ).not.toThrow();

    expect(() =>
      doc.addBlock('affine:note-invalid-block-video', {}, noteId)
    ).toThrow();
  });
});

declare global {
  namespace BlockSuite {
    interface BlockModels {
      'affine:note-block-video': BlockModel;
      'affine:note-invalid-block-video': BlockModel;
    }
  }
}
