import { Text, type Workspace } from '@blocksuite/store';

import { type InitFn } from './utils';

export const empty: InitFn = async (workspace: Workspace, id: string) => {
  const page = workspace.getPage(id) ?? workspace.createPage({ id });
  page.clear();
  await page.waitForLoaded();

  // Add page block and surface block at root level
  const pageBlockId = page.addBlock('affine:page', {
    title: new Text(),
  });

  page.addBlock('affine:surface', {}, pageBlockId);

  // Add note block inside page block
  const noteId = page.addBlock('affine:note', {}, pageBlockId);
  // Add paragraph block inside note block
  page.addBlock('affine:paragraph', {}, noteId);
  page.resetHistory();
};

empty.id = 'empty';
empty.displayName = 'Empty Editor';
empty.description = 'Start from empty editor';
