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
      text: 'Text A',
      children: [
        {
          text: 'Text B',
          children: [
            {
              text: 'Text C',
              children: [],
            },
          ],
        },
        {
          text: 'Text D',
          children: [
            {
              text: 'Text E',
              children: [],
            },
          ],
        },
      ],
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
      text: 'Text A',
      children: [
        {
          text: 'Text B',
          children: [
            {
              text: 'Text C',
              children: [],
            },
          ],
        },
        {
          text: 'Text D',
          children: [
            {
              text: 'Text E',
              children: [],
            },
          ],
        },
      ],
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
