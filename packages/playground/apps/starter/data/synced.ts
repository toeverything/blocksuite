import { Text, type Workspace } from '@blocksuite/store';

import { type InitFn } from './utils';

export const synced: InitFn = async (workspace: Workspace, id: string) => {
  const pageA = workspace.getPage(id) ?? workspace.createPage({ id });
  const pageB = workspace.createPage({ id: 'pageB' });
  pageA.clear();
  pageB.clear();

  let syncedBlockId = '';

  await pageB.load(() => {
    // Add page block and surface block at root level
    const pageBlockId = pageB.addBlock('affine:page', {
      title: new Text('Page B'),
    });

    pageB.addBlock('affine:surface', {}, pageBlockId);

    // Add note block inside page block
    const noteId = pageB.addBlock('affine:note', {}, pageBlockId);
    // Add paragraph block inside note block
    pageB.addBlock('affine:paragraph', { text: new Text('QAQ') }, noteId);
    syncedBlockId = noteId;
  });

  await pageA.load(() => {
    // Add page block and surface block at root level
    const pageBlockId = pageA.addBlock('affine:page', {
      title: new Text(),
    });

    pageA.addBlock('affine:surface', {}, pageBlockId);

    pageA.addBlock(
      'affine:synced',
      {
        pageId: 'pageB',
        blockId: syncedBlockId,
      },
      pageBlockId
    );
  });

  pageB.resetHistory();
  pageA.resetHistory();
};

synced.id = 'synced';
synced.displayName = 'Synced block demo';
synced.description = 'A simple demo for synced block';
