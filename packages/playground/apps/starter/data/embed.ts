import { Text, type Workspace } from '@blocksuite/store';

import { type InitFn } from './utils.js';

// eslint-disable-next-line @typescript-eslint/no-misused-promises
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
      'affine:embed-github',
      {
        url: 'https://github.com/toeverything/AFFiNE/pull/5453',
      },
      noteId
    );
    page.addBlock(
      'affine:embed-github',
      {
        url: 'https://www.github.com/toeverything/blocksuite/pull/5927',
        style: 'vertical',
        xywh: '[0, 400, 364, 390]',
      },
      surfaceId
    );
    page.addBlock(
      'affine:embed-github',
      {
        url: 'https://github.com/Milkdown/milkdown/pull/1215',
        xywh: '[500, 400, 752, 116]',
      },
      surfaceId
    );
    page.addBlock('affine:paragraph', {}, noteId);
  });

  page.resetHistory();
};

embed.id = 'embed';
embed.displayName = 'Example for embed blocks';
embed.description = 'Example for embed blocks';
