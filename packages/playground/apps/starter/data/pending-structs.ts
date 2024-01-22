import { Workspace } from '@blocksuite/store';
import { Text } from '@blocksuite/store';

import type { InitFn } from './utils.js';

// eslint-disable-next-line @typescript-eslint/no-misused-promises
export const pendingStructs: InitFn = async (
  workspace: Workspace,
  id: string
) => {
  const page = workspace.createPage({ id });
  const tempPage = workspace.createPage({ id: 'tempPage' });
  await page.load();
  await tempPage.load(() => {
    const pageBlockId = tempPage.addBlock('affine:page', {
      title: new Text('Pending Structs'),
    });
    const vec = Workspace.Y.encodeStateVector(tempPage.spaceDoc);

    // To avoid pending structs, uncomment the following line
    // const update = Workspace.Y.encodeStateAsUpdate(tempPage.spaceDoc);

    tempPage.addBlock('affine:surface', {}, pageBlockId);
    // Add note block inside page block
    const noteId = tempPage.addBlock('affine:note', {}, pageBlockId);
    tempPage.addBlock(
      'affine:paragraph',
      {
        text: new Text('This is a paragraph block'),
      },
      noteId
    );
    const diff = Workspace.Y.encodeStateAsUpdate(tempPage.spaceDoc, vec);
    // To avoid pending structs, uncomment the following line
    // Workspace.Y.applyUpdate(page.spaceDoc, update);

    Workspace.Y.applyUpdate(page.spaceDoc, diff);
  });
};

pendingStructs.id = 'pending-structs';
pendingStructs.displayName = 'Pending Structs';
pendingStructs.description = 'Page doc with pending structs';
