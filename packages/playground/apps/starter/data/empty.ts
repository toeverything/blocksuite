import { Text, type Workspace } from '@blocksuite/store';

import { type InitFn } from './utils.js';

export const empty: InitFn = (workspace: Workspace, id: string) => {
  const doc = workspace.getDoc(id) ?? workspace.createDoc({ id });
  doc.clear();

  doc.load(() => {
    // Add root block and surface block at root level
    const rootId = doc.addBlock('affine:page', {
      title: new Text(),
    });

    doc.addBlock('affine:surface', {}, rootId);

    // Add note block inside root block
    const noteId = doc.addBlock('affine:note', {}, rootId);
    // Add paragraph block inside note block
    doc.addBlock('affine:paragraph', {}, noteId);
  });

  doc.resetHistory();
};

empty.id = 'empty';
empty.displayName = 'Empty Editor';
empty.description = 'Start from empty editor';
