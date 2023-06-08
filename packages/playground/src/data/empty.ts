import { Text, type Workspace } from '@blocksuite/store';

import { type InitFn } from './utils';

export const empty: InitFn = (workspace: Workspace, id: string) => {
  const page = workspace.createPage({ id });

  page.onLoadSlot.once(() => {
    // Add page block and surface block at root level
    const pageBlockId = page.addBlock('affine:page', {
      title: new Text(),
    });

    page.addBlock('affine:surface', {}, pageBlockId);

    // Add frame block inside page block
    const frameId = page.addBlock('affine:frame', {}, pageBlockId);
    // Add paragraph block inside frame block
    page.addBlock('affine:paragraph', {}, frameId);
    page.resetHistory();
  });
};

empty.id = 'empty';
empty.displayName = 'Empty Editor';
empty.description = 'Start from empty editor';
