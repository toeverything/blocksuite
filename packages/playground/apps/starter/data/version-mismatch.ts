import type { Y } from '@blocksuite/store';
import { Workspace } from '@blocksuite/store';

import type { InitFn } from './utils.js';

export const versionMismatch: InitFn = (workspace: Workspace, id: string) => {
  const page = workspace.createPage({ id });
  const tempPage = workspace.createPage({ id: 'tempPage' });
  page.load();

  tempPage.load(() => {
    const pageBlockId = tempPage.addBlock('affine:page', {});
    tempPage.addBlock('affine:surface', {}, pageBlockId);
    const noteId = tempPage.addBlock(
      'affine:note',
      { xywh: '[0, 100, 800, 640]' },
      pageBlockId
    );
    const paragraphId = tempPage.addBlock('affine:paragraph', {}, noteId);
    const blocks = tempPage.spaceDoc.get('blocks') as Y.Map<unknown>;
    const paragraph = blocks.get(paragraphId) as Y.Map<unknown>;
    paragraph.set('sys:version', (paragraph.get('sys:version') as number) + 1);

    const update = Workspace.Y.encodeStateAsUpdate(tempPage.spaceDoc);

    Workspace.Y.applyUpdate(page.spaceDoc, update);
    page.addBlock('affine:paragraph', {}, noteId);
  });

  workspace.removePage('tempPage');
  page.resetHistory();
};

versionMismatch.id = 'version-mismatch';
versionMismatch.displayName = 'Version Mismatch';
versionMismatch.description = 'Error boundary when version mismatch in data';
