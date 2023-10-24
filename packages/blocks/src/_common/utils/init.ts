import type { Workspace } from '@blocksuite/store';

export async function createPage(
  workspace: Workspace,
  options: { id?: string; title?: string } = {}
) {
  const page = workspace.createPage({ id: options.id });
  await page.waitForLoaded();

  const pageBlockId = page.addBlock('affine:page', {
    title: new page.Text(options.title ?? ''),
  });
  page.addBlock('affine:surface', {}, pageBlockId);
  const noteId = page.addBlock('affine:note', {}, pageBlockId);
  page.addBlock('affine:paragraph', {}, noteId);
  // To make sure the content of new page would not be clear
  // By undo operation for the first time
  page.resetHistory();
  return page;
}
