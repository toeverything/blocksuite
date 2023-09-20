import { Text, type Workspace } from '@blocksuite/store';

import { type InitFn } from './utils';

export const edgelessEmpty: InitFn = async (
  workspace: Workspace,
  id: string
) => {
  const page = workspace.createPage({ id });

  // Add page block and surface block at root level
  const pageBlockId = page.addBlock('affine:page', {
    title: new Text(),
  });

  page.addBlock('affine:surface', {}, pageBlockId);

  page.resetHistory();
};

edgelessEmpty.id = 'empty';
edgelessEmpty.displayName = 'Empty Editor';
edgelessEmpty.description = 'Start from empty editor';
