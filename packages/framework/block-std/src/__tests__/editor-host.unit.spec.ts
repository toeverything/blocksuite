import { DocCollection, IdGeneratorType, Schema } from '@blocksuite/store';
import { describe, expect, test } from 'vitest';

import { effects } from '../effects.js';
import { TestEditorContainer } from './test-editor.js';
import {
  type HeadingBlockModel,
  HeadingBlockSchema,
  NoteBlockSchema,
  RootBlockSchema,
} from './test-schema.js';
import { testSpecs } from './test-spec.js';

effects();

function createTestOptions() {
  const idGenerator = IdGeneratorType.AutoIncrement;
  const schema = new Schema();
  schema.register([RootBlockSchema, NoteBlockSchema, HeadingBlockSchema]);
  return { id: 'test-collection', idGenerator, schema };
}

function wait(time: number) {
  return new Promise(resolve => setTimeout(resolve, time));
}

describe('editor host', () => {
  test('editor host should rerender model when view changes', async () => {
    const collection = new DocCollection(createTestOptions());

    collection.meta.initialize();
    const doc = collection.createDoc({ id: 'home' });
    doc.load();
    const rootId = doc.addBlock('test:page');
    const noteId = doc.addBlock('test:note', {}, rootId);
    const headingId = doc.addBlock('test:heading', { type: 'h1' }, noteId);
    const headingBlock = doc.getBlock(headingId)!;

    const editorContainer = new TestEditorContainer();
    editorContainer.doc = doc;
    editorContainer.specs = testSpecs;

    document.body.append(editorContainer);

    await wait(50);
    let headingElm = editorContainer.std.view.getBlock(headingId);

    expect(headingElm!.tagName).toBe('TEST-H1-BLOCK');

    (headingBlock.model as HeadingBlockModel).type = 'h2';
    await wait(50);
    headingElm = editorContainer.std.view.getBlock(headingId);

    expect(headingElm!.tagName).toBe('TEST-H2-BLOCK');
  });
});
