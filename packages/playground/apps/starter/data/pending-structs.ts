import { DocCollection, Text } from '@blocksuite/store';

import type { InitFn } from './utils.js';

export const pendingStructs: InitFn = (
  collection: DocCollection,
  id: string
) => {
  const doc = collection.createDoc({ id });
  const tempDoc = collection.createDoc({ id: 'tempDoc' });
  doc.load();
  tempDoc.load(() => {
    const rootId = tempDoc.addBlock('affine:page', {
      title: new Text('Pending Structs'),
    });
    const vec = DocCollection.Y.encodeStateVector(tempDoc.spaceDoc);

    // To avoid pending structs, uncomment the following line
    // const update = DocCollection.Y.encodeStateAsUpdate(tempDoc.spaceDoc);

    tempDoc.addBlock('affine:surface', {}, rootId);
    // Add note block inside root block
    const noteId = tempDoc.addBlock('affine:note', {}, rootId);
    tempDoc.addBlock(
      'affine:paragraph',
      {
        text: new Text('This is a paragraph block'),
      },
      noteId
    );
    const diff = DocCollection.Y.encodeStateAsUpdate(tempDoc.spaceDoc, vec);
    // To avoid pending structs, uncomment the following line
    // DocCollection.Y.applyUpdate(doc.spaceDoc, update);

    DocCollection.Y.applyUpdate(doc.spaceDoc, diff);
  });
};

pendingStructs.id = 'pending-structs';
pendingStructs.displayName = 'Pending Structs';
pendingStructs.description = 'Doc with pending structs';
