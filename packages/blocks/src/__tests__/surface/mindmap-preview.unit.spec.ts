import { DocCollection, Schema } from '@blocksuite/store';
import { describe, expect, test } from 'vitest';

import { markdownToMindmap } from '../../surface-block/mini-mindmap/mindmap-preview.js';

describe('markdownToMindmap: convert markdown list to a mind map tree', () => {
  test('basic case', () => {
    const markdown = `
- Text A
  - Text B
    - Text C
  - Text D
    - Text E
`;
    const collection = new DocCollection({ schema: new Schema() });
    collection.meta.initialize();
    const doc = collection.createDoc();
    const nodes = markdownToMindmap(markdown, doc);

    expect(nodes).toEqual({
      children: [
        {
          children: [
            {
              children: [],
              text: 'Text C',
            },
          ],
          text: 'Text B',
        },
        {
          children: [
            {
              children: [],
              text: 'Text E',
            },
          ],
          text: 'Text D',
        },
      ],
      text: 'Text A',
    });
  });

  test('basic case with different indent', () => {
    const markdown = `
- Text A
    - Text B
        - Text C
    - Text D
        - Text E
`;
    const collection = new DocCollection({ schema: new Schema() });
    collection.meta.initialize();
    const doc = collection.createDoc();
    const nodes = markdownToMindmap(markdown, doc);

    expect(nodes).toEqual({
      children: [
        {
          children: [
            {
              children: [],
              text: 'Text C',
            },
          ],
          text: 'Text B',
        },
        {
          children: [
            {
              children: [],
              text: 'Text E',
            },
          ],
          text: 'Text D',
        },
      ],
      text: 'Text A',
    });
  });

  test('empty case', () => {
    const markdown = '';
    const collection = new DocCollection({ schema: new Schema() });
    collection.meta.initialize();
    const doc = collection.createDoc();
    const nodes = markdownToMindmap(markdown, doc);

    expect(nodes).toEqual(null);
  });
});
