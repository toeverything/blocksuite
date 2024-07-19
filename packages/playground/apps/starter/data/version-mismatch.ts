import type { Y } from '@blocksuite/store';

import { DocCollection } from '@blocksuite/store';

import type { InitFn } from './utils.js';

export const versionMismatch: InitFn = (
  collection: DocCollection,
  id: string
) => {
  const doc = collection.createDoc({ id });
  const tempDoc = collection.createDoc({ id: 'tempDoc' });
  doc.load();

  tempDoc.load(() => {
    const rootId = tempDoc.addBlock('affine:page', {});
    tempDoc.addBlock('affine:surface', {}, rootId);
    const noteId = tempDoc.addBlock(
      'affine:note',
      { xywh: '[0, 100, 800, 640]' },
      rootId
    );
    const paragraphId = tempDoc.addBlock('affine:paragraph', {}, noteId);
    const blocks = tempDoc.spaceDoc.get('blocks') as Y.Map<unknown>;
    const paragraph = blocks.get(paragraphId) as Y.Map<unknown>;
    paragraph.set('sys:version', (paragraph.get('sys:version') as number) + 1);

    const update = DocCollection.Y.encodeStateAsUpdate(tempDoc.spaceDoc);

    DocCollection.Y.applyUpdate(doc.spaceDoc, update);
    doc.addBlock('affine:paragraph', {}, noteId);
  });

  collection.removeDoc('tempDoc');
  doc.resetHistory();
};

versionMismatch.id = 'version-mismatch';
versionMismatch.displayName = 'Version Mismatch';
versionMismatch.description = 'Error boundary when version mismatch in data';
