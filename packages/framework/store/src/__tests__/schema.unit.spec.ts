import { literal } from 'lit/static-html.js';
import { describe, expect, it, vi } from 'vitest';

// import some blocks
import { type BlockModel, defineBlockSchema } from '../schema/base.js';
import { SchemaValidateError } from '../schema/error.js';
import { Schema } from '../schema/index.js';
import { DocCollection, IdGeneratorType } from '../store/index.js';
import {
  DividerBlockSchema,
  ListBlockSchema,
  NoteBlockSchema,
  ParagraphBlockSchema,
  RootBlockSchema,
} from './test-schema.js';

function createTestOptions() {
  const idGenerator = IdGeneratorType.AutoIncrement;
  const schema = new Schema();
  schema.register(BlockSchemas);
  return { id: 'test-collection', idGenerator, schema };
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
  const collection = new DocCollection(options);
  collection.meta.initialize();
  const doc = collection.createDoc({ id: docId });
  doc.load();
  return doc;
}

describe('schema', () => {
  it('should be able to validate schema by role', () => {
    const consoleMock = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    const doc = createTestDoc();
    const rootId = doc.addBlock('affine:page', {});
    const noteId = doc.addBlock('affine:note', {}, rootId);
    const paragraphId = doc.addBlock('affine:paragraph', {}, noteId);

    doc.addBlock('affine:note', {});
    expect(consoleMock.mock.calls[0]).toSatisfy((call: unknown[]) => {
      return typeof call[0] === 'string';
    });
    expect(consoleMock.mock.calls[1]).toSatisfy((call: unknown[]) => {
      return call[0] instanceof SchemaValidateError;
    });

    consoleMock.mockClear();
    // add paragraph to root should throw
    doc.addBlock('affine:paragraph', {}, rootId);
    expect(consoleMock.mock.calls[0]).toSatisfy((call: unknown[]) => {
      return typeof call[0] === 'string';
    });
    expect(consoleMock.mock.calls[1]).toSatisfy((call: unknown[]) => {
      return call[0] instanceof SchemaValidateError;
    });

    consoleMock.mockClear();
    doc.addBlock('affine:note', {}, rootId);
    doc.addBlock('affine:paragraph', {}, noteId);
    doc.addBlock('affine:paragraph', {}, paragraphId);
    expect(consoleMock).not.toBeCalled();
  });

  it('should glob match works', () => {
    const consoleMock = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    const doc = createTestDoc();
    const rootId = doc.addBlock('affine:page', {});
    const noteId = doc.addBlock('affine:note', {}, rootId);

    doc.addBlock('affine:note-block-video', {}, noteId);
    expect(consoleMock).not.toBeCalled();

    doc.addBlock('affine:note-invalid-block-video', {}, noteId);
    expect(consoleMock.mock.calls[0]).toSatisfy((call: unknown[]) => {
      return typeof call[0] === 'string';
    });
    expect(consoleMock.mock.calls[1]).toSatisfy((call: unknown[]) => {
      return call[0] instanceof SchemaValidateError;
    });
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
