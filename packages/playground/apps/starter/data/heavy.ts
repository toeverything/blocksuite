import { type DocCollection, Text } from '@blocksuite/store';

import type { InitFn } from './utils.js';

const params = new URLSearchParams(location.search);

export const heavy: InitFn = (collection: DocCollection, docId: string) => {
  const count = Number(params.get('count')) || 1000;

  const doc = collection.createDoc({ id: docId });
  doc.load(() => {
    // Add root block and surface block at root level
    const rootId = doc.addBlock('affine:page', {
      title: new Text(),
    });
    doc.addBlock('affine:surface', {}, rootId);

    // Add note block inside root block
    const noteId = doc.addBlock('affine:note', {}, rootId);
    for (let i = 0; i < count; i++) {
      // Add paragraph block inside note block
      doc.addBlock(
        'affine:paragraph',
        {
          text: new Text('Hello, world! ' + i),
        },
        noteId
      );
    }
  });
};

heavy.id = 'heavy';
heavy.displayName = 'Heavy Example';
heavy.description = 'Heavy example on thousands of paragraph blocks';
