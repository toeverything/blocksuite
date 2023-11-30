import { Text, type Workspace } from '@blocksuite/store';

import { type InitFn } from './utils';

export const embed: InitFn = async (workspace: Workspace, id: string) => {
  const page = workspace.getPage(id) ?? workspace.createPage({ id });
  page.clear();

  await page.load(() => {
    // Add page block and surface block at root level
    const pageBlockId = page.addBlock('affine:page', {
      title: new Text(),
    });

    const surfaceId = page.addBlock('affine:surface', {}, pageBlockId);

    // Add note block inside page block
    const noteId = page.addBlock('affine:note', {}, pageBlockId);
    // Add paragraph block inside note block
    page.addBlock('affine:paragraph', {}, noteId);

    page.addBlock(
      'affine:embed:github',
      { owner: 'toeverything', repo: 'blocksuite' },
      noteId
    );
    page.addBlock(
      'affine:embed:github',
      { owner: 'toeverything', repo: 'affine', xywh: '[0, 400, 400, 200]' },
      surfaceId
    );
    page.addBlock(
      'affine:embed:github',
      { owner: 'milkdown', repo: 'milkdown', xywh: '[0, 700, 400, 200]' },
      surfaceId
    );
    page.addBlock('affine:paragraph', {}, noteId);
  });

  page.resetHistory();
};

embed.id = 'embed';
embed.displayName = 'Example for embed blocks';
embed.description = 'Example for embed blocks';
