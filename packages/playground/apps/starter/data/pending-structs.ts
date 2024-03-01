import { Workspace } from '@blocksuite/store';
import { Text } from '@blocksuite/store';

import type { InitFn } from './utils.js';

export const pendingStructs: InitFn = (workspace: Workspace, id: string) => {
  const doc = workspace.createDoc({ id });
  const tempDoc = workspace.createDoc({ id: 'tempDoc' });
  doc.load();
  tempDoc.load(() => {
    const rootId = tempDoc.addBlock('affine:page', {
      title: new Text('Pending Structs'),
    });
    const vec = Workspace.Y.encodeStateVector(tempDoc.spaceDoc);

    // To avoid pending structs, uncomment the following line
    // const update = Workspace.Y.encodeStateAsUpdate(tempDoc.spaceDoc);

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
    const diff = Workspace.Y.encodeStateAsUpdate(tempDoc.spaceDoc, vec);
    // To avoid pending structs, uncomment the following line
    // Workspace.Y.applyUpdate(doc.spaceDoc, update);

    Workspace.Y.applyUpdate(doc.spaceDoc, diff);
  });
};

pendingStructs.id = 'pending-structs';
pendingStructs.displayName = 'Pending Structs';
pendingStructs.description = 'Doc with pending structs';
