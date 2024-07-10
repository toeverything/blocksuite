/* eslint-disable @typescript-eslint/no-restricted-imports */
// checkout https://vitest.dev/guide/debugging.html for debugging tests
import { beforeEach, describe, expect, it } from 'vitest';
import { applyUpdate, encodeStateAsUpdate } from 'yjs';

import { DocCollection, Generator, Schema } from '../index.js';
// Use manual per-module import/export to support vitest environment on Node.js
import {
  NoteBlockSchema,
  ParagraphBlockSchema,
  RootBlockSchema,
} from './test-schema.js';

export const BlockSchemas = [
  RootBlockSchema,
  ParagraphBlockSchema,
  NoteBlockSchema,
];

function createTestOptions() {
  const idGenerator = Generator.AutoIncrement;
  const schema = new Schema();
  schema.register(BlockSchemas);
  return { id: 'test-collection', idGenerator, schema };
}

function createTestDoc(pageId = 'doc:home', collection?: DocCollection) {
  const options = createTestOptions();
  const _collection = collection || new DocCollection(options);
  _collection.meta.initialize();
  const doc = _collection.createDoc({ id: pageId });
  doc.load();
  return doc;
}

function requestIdleCallbackPolyfill(
  callback: IdleRequestCallback,
  options?: IdleRequestOptions
) {
  const timeout = options?.timeout ?? 1000;
  const start = Date.now();
  return setTimeout(function () {
    callback({
      didTimeout: false,
      timeRemaining: function () {
        return Math.max(0, timeout - (Date.now() - start));
      },
    });
  }, timeout) as unknown as number;
}

beforeEach(() => {
  if (globalThis.requestIdleCallback === undefined) {
    globalThis.requestIdleCallback = requestIdleCallbackPolyfill;
  }
});

describe('collection.search works', () => {
  it('collection search matching', () => {
    const doc = createTestDoc();
    const collection = doc.collection;

    const rootId = doc.addBlock('affine:page', {
      title: new doc.Text(''),
    });
    const noteId = doc.addBlock('affine:note', {}, rootId);
    const text1 =
      '英特尔第13代酷睿i7-1370P移动处理器现身Geekbench，14核心和5GHz';
    const text2 = '索尼考虑移植《GT赛车7》，又一PlayStation独占IP登陆PC平台';
    const expected1 = new Map([
      [
        '2',
        {
          content: text1,
          space: doc.id,
        },
      ],
    ]);
    const expected2 = new Map([
      [
        '3',
        {
          content: text2,
          space: doc.id,
        },
      ],
    ]);
    doc.addBlock(
      'affine:paragraph',
      {
        text: new doc.Text(text1),
      },
      noteId
    );

    doc.addBlock(
      'affine:paragraph',
      {
        text: new doc.Text(text2),
      },
      noteId
    );

    requestIdleCallback(() => {
      queueMicrotask(() => {
        expect(collection.search('处理器')).toStrictEqual(expected1);
        expect(collection.search('索尼')).toStrictEqual(expected2);
      });
    });

    const update = encodeStateAsUpdate(doc.spaceDoc);
    const schema = new Schema();
    const collection2 = new DocCollection({
      schema,
      id: 'test',
    });
    collection2.meta.initialize();
    const doc2 = collection2.createDoc({
      id: 'doc:home',
    });
    applyUpdate(doc2.spaceDoc, update);
    expect(doc2.spaceDoc.toJSON()).toEqual(doc.spaceDoc.toJSON());

    requestIdleCallback(() => {
      queueMicrotask(() => {
        expect(collection2.search('处理器')).toStrictEqual(expected1);
        expect(collection2.search('索尼')).toStrictEqual(expected2);
      });
    });
  });
});

describe('backlink works', () => {
  it('backlink indexer works with subpage', async () => {
    const doc = createTestDoc();
    const collection = doc.collection;
    const subpage = createTestDoc('doc1', collection);
    const backlinkIndexer = collection.indexer.backlink!;

    const rootId = doc.addBlock('affine:page', {
      title: new doc.Text(''),
    });
    const noteId = doc.addBlock('affine:note', {}, rootId);

    const text = doc.Text.fromDelta([
      {
        insert: ' ',
        attributes: { reference: { type: 'Subpage', pageId: subpage.id } },
      },
    ]);
    doc.addBlock(
      'affine:paragraph',
      {
        text,
      },
      noteId
    );

    // wait for the backlink index to be updated
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(backlinkIndexer.getBacklink(doc.id)).toStrictEqual([]);
    expect(backlinkIndexer.getBacklink(subpage.id)).toStrictEqual([
      {
        blockId: '2',
        pageId: 'doc:home',
        type: 'Subpage',
      },
    ]);

    text.format(0, 1, { reference: null });

    expect(backlinkIndexer.getBacklink(doc.id)).toStrictEqual([]);

    expect(backlinkIndexer.getBacklink(subpage.id)).toStrictEqual([]);
  });

  it('backlink indexer works with linked doc', async () => {
    const doc0 = createTestDoc();
    const collection = doc0.collection;
    const doc1 = createTestDoc('space:doc1', collection);
    const backlinkIndexer = collection.indexer.backlink!;

    const doc0Id = doc0.addBlock('affine:page');
    const note0Id = doc0.addBlock('affine:note', {}, doc0Id);

    doc0.addBlock(
      'affine:paragraph',
      {
        text: doc0.Text.fromDelta([
          {
            insert: ' ',
            attributes: { reference: { type: 'LinkedPage', pageId: doc0.id } },
          },
        ]),
      },
      note0Id
    );
    const paragraphId2 = doc0.addBlock(
      'affine:paragraph',
      {
        text: doc1.Text.fromDelta([
          {
            insert: ' ',
            attributes: { reference: { type: 'LinkedPage', pageId: doc1.id } },
          },
        ]),
      },
      note0Id
    );
    const paragraph2 = doc0.getBlockById(paragraphId2);

    const doc1Id = doc1.addBlock('affine:page');
    const note1Id = doc1.addBlock('affine:note', {}, doc1Id);

    doc1.addBlock(
      'affine:paragraph',
      {
        text: doc1.Text.fromDelta([
          {
            insert: ' ',
            attributes: { reference: { type: 'LinkedPage', pageId: doc0.id } },
          },
        ]),
      },
      note1Id
    );
    const paragraphId4 = doc1.addBlock(
      'affine:paragraph',
      {
        text: doc1.Text.fromDelta([
          {
            insert: ' ',
            attributes: { reference: { type: 'LinkedPage', pageId: doc1.id } },
          },
        ]),
      },
      note1Id
    );
    const paragraph4 = doc1.getBlockById(paragraphId4);

    // wait for the backlink index to be updated
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(backlinkIndexer.getBacklink(doc0.id)).toStrictEqual([
      {
        blockId: '2',
        pageId: 'doc:home',
        type: 'LinkedPage',
      },
      {
        blockId: '6',
        pageId: 'space:doc1',
        type: 'LinkedPage',
      },
    ]);

    expect(backlinkIndexer.getBacklink(doc1.id)).toStrictEqual([
      {
        blockId: '3',
        pageId: 'doc:home',
        type: 'LinkedPage',
      },
      {
        blockId: '7',
        pageId: 'space:doc1',
        type: 'LinkedPage',
      },
    ]);

    paragraph2?.text?.delete(0, paragraph2.text.length);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    doc1.updateBlock(paragraph4!, { text: new doc1.Text() });

    expect(backlinkIndexer.getBacklink(doc0.id)).toStrictEqual([
      {
        blockId: '2',
        pageId: 'doc:home',
        type: 'LinkedPage',
      },
      {
        blockId: '6',
        pageId: 'space:doc1',
        type: 'LinkedPage',
      },
    ]);

    expect(backlinkIndexer.getBacklink(doc1.id)).toStrictEqual([]);
  });
});
