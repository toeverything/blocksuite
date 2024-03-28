import { describe, expect, test } from 'vitest';

import { MemoryBackend } from '../impl/memory/index.js';
import { Document, type Field, Indexer, Schema } from '../index.js';

function randomString() {
  return Math.random().toString(36).substring(7);
}

describe('memory backend', () => {
  test('basic', async () => {
    const tagsField = {
      type: 'String',
      key: 'tags',
    } as Field<'String'>;
    const indexer = new Indexer(new Schema([tagsField]), new MemoryBackend());

    await indexer.initialize();

    // Insert 100 documents with the tag 'a' and 200 documents with the tag 'b'
    const writer = await indexer.write();
    for (let i = 0; i < 100; i++) {
      const document = new Document(randomString());
      document.set(tagsField, 'a');
      writer.insert(document);
    }
    for (let i = 0; i < 200; i++) {
      const document = new Document(randomString());
      document.set(tagsField, 'b');
      writer.insert(document);
    }
    await writer.commit();

    {
      // Search for documents that have the tag 'a'
      const result = await indexer.search(
        { type: 'match', field: 'tags', match: 'a' },
        [
          // Count the number of documents
          { type: 'Count' },
          // Collect the top 5 documents id
          { type: 'TopDocs', limit: 5, skip: 0 },
          // Collect the tags and their count
          {
            type: 'TermsAggregation',
            field: 'tags',
          },
        ]
      );
      // result = [
      //   100,
      //   [ 'b2d8ad', 'bj797i', 'f7l4o3', '5gujo', 'b0a04r' ],
      //   { a: 100 }
      // ]

      expect(result[0]).toBe(100);
      expect(result[1].length).toBe(5);
      expect(result[2]['a']).toBe(100);
    }

    {
      // Search for documents that have the tag 'a' or 'b'
      const result = await indexer.search(
        {
          type: 'boolean',
          occur: 'should',
          queries: [
            { type: 'match', field: 'tags', match: 'a' },
            { type: 'match', field: 'tags', match: 'b' },
          ],
        },
        [
          { type: 'Count' },
          {
            type: 'TermsAggregation',
            field: 'tags',
          },
        ]
      );

      expect(result).toStrictEqual([300, { a: 100, b: 200 }]);
    }

    {
      // Search for documents that do not have the tag 'a'
      const result = await indexer.search(
        {
          type: 'boolean',
          occur: 'must_not',
          queries: [{ type: 'match', field: 'tags', match: 'a' }],
        },
        [
          { type: 'Count' },
          {
            type: 'TermsAggregation',
            field: 'tags',
          },
        ]
      );

      expect(result).toStrictEqual([200, { b: 200 }]);
    }
  });

  test('full-text', async () => {
    const contentField = {
      type: 'FullText',
      key: 'content',
    } as Field<'FullText'>;
    const indexer = new Indexer(
      new Schema([contentField]),
      new MemoryBackend()
    );

    await indexer.initialize();

    const writer = await indexer.write();
    const document = new Document(randomString());
    document.set(contentField, 'hello world');
    writer.insert(document);
    const document1 = new Document(randomString());
    document1.set(contentField, 'helwor');
    writer.insert(document1);
    await writer.commit();

    const result = await indexer.search(
      { type: 'match', field: 'content', match: 'helwor' },
      [
        { type: 'Count' },
        { type: 'TopDocs', limit: 5, skip: 0 },
        {
          type: 'Highlight',
          field: 'content',
          topDocs: { limit: 5, skip: 0 },
          before: '<b>',
          end: '</b>',
        },
      ]
    );
    // return = [
    //   2,
    //   [ 'vhlc9m', 'a6cqc' ],
    //   [ '<b>helwor</b>', '<b>hello</b> <b>worl</b>d' ]
    // ]

    expect(result[0]).toBe(2);
  });
});
