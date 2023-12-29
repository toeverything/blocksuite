import { Text, type Workspace } from '@blocksuite/store';

import { type InitFn } from './utils';

export const linked: InitFn = async (workspace: Workspace, id: string) => {
  const pageA = workspace.getPage(id) ?? workspace.createPage({ id });
  const pageBId = 'page:page-linked';
  const pageB =
    workspace.getPage('pageB') ?? workspace.createPage({ id: pageBId });
  pageA.clear();
  pageB.clear();

  await pageB.load(() => {
    const pageBlockId = pageB.addBlock('affine:page', {
      title: new Text('Page B'),
    });

    pageB.addBlock('affine:surface', {}, pageBlockId);

    // Add note block inside page block
    const noteId = pageB.addBlock('affine:note', {}, pageBlockId);
    // Add paragraph block inside note block
    pageB.addBlock(
      'affine:paragraph',
      {
        text: new Text('This is page B'),
      },
      noteId
    );
  });

  await pageA.load(() => {
    // Add page block and surface block at root level
    const pageBlockId = pageA.addBlock('affine:page', {
      title: new Text('Page A'),
    });

    pageA.addBlock('affine:surface', {}, pageBlockId);

    // Add note block inside page block
    const noteId = pageA.addBlock('affine:note', {}, pageBlockId);
    // Add paragraph block inside note block
    pageA.addBlock('affine:paragraph', {}, noteId);

    pageA.addBlock('affine:embed-linked-page', { pageId: pageBId }, noteId);
  });

  pageA.resetHistory();
  pageB.resetHistory();
};

linked.id = 'linked';
linked.displayName = 'Linked Page Editor';
linked.description = 'A demo with two linked pages';
