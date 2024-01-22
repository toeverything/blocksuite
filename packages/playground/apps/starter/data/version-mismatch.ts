import type { Y } from '@blocksuite/store';
import { Workspace } from '@blocksuite/store';

import type { InitFn } from './utils.js';

// eslint-disable-next-line @typescript-eslint/no-misused-promises
export const versionMismatch: InitFn = async (
  workspace: Workspace,
  id: string
) => {
  const page = workspace.createPage({ id });
  const tempPage = workspace.createPage({ id: 'tempPage' });
  await page.load();

  await tempPage.load(() => {
    const pageBlockId = tempPage.addBlock('affine:page', {});
    tempPage.addBlock('affine:surface', {}, pageBlockId);
    const noteId = tempPage.addBlock(
      'affine:note',
      { xywh: '[0, 100, 800, 640]' },
      pageBlockId
    );
    const blocks = tempPage.spaceDoc.get('blocks') as Y.Map<unknown>;
    const note = blocks.get(noteId) as Y.Map<unknown>;
    note.set('sys:version', (note.get('sys:version') as number) + 1);

    const update = Workspace.Y.encodeStateAsUpdate(tempPage.spaceDoc);

    Workspace.Y.applyUpdate(page.spaceDoc, update);
  });
};

versionMismatch.id = 'version-mismatch';
versionMismatch.displayName = 'Version Mismatch';
versionMismatch.description = 'Error boundary when version mismatch in data';
