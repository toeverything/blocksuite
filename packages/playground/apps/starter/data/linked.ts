import { Text, type Workspace } from '@blocksuite/store';

import { type InitFn } from './utils';

export const linked: InitFn = async (workspace: Workspace, id: string) => {
  const pageA = workspace.getPage(id) ?? workspace.createPage({ id });

  const pageBId = 'page:page-linked-page';
  const pageB =
    workspace.getPage('pageB') ?? workspace.createPage({ id: pageBId });

  const pageCId = 'page:page-linked-edgeless';
  const pageC =
    workspace.getPage('pageC') ?? workspace.createPage({ id: pageCId });

  pageA.clear();
  pageB.clear();
  pageC.clear();

  await pageB.load(() => {
    const pageBlockId = pageB.addBlock('affine:page', {
      title: new Text(''),
    });

    pageB.addBlock('affine:surface', {}, pageBlockId);

    // Add note block inside page block
    const noteId = pageB.addBlock('affine:note', {}, pageBlockId);
    // Add paragraph block inside note block
    pageB.addBlock('affine:paragraph', {}, noteId);
  });

  await pageC.load(() => {
    const pageBlockId = pageC.addBlock('affine:page', {
      title: new Text(''),
    });

    pageC.addBlock('affine:surface', {}, pageBlockId);

    // Add note block inside page block
    const noteId = pageC.addBlock('affine:note', {}, pageBlockId);
    // Add paragraph block inside note block
    pageC.addBlock('affine:paragraph', {}, noteId);
  });

  await pageA.load(async () => {
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

    pageA.addBlock(
      'affine:embed-linked-page',
      { pageId: 'page:deleted-example' },
      noteId
    );

    pageA.addBlock('affine:embed-linked-page', { pageId: pageCId }, noteId);

    pageA.addBlock(
      'affine:embed-linked-page',
      { pageId: 'page:deleted-example-edgeless' },
      noteId
    );
  });

  pageA.resetHistory();
  pageB.resetHistory();
  pageC.resetHistory();
};

linked.id = 'linked';
linked.displayName = 'Linked Page Editor';
linked.description = 'A demo with linked pages';
