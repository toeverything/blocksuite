import { Text, type Workspace } from '@blocksuite/store';

import { type InitFn } from './utils';

export const heavy: InitFn = (workspace: Workspace, pageId: string) => {
  const page = workspace.createPage({ id: pageId });

  // Add page block and surface block at root level
  const pageBlockId = page.addBlock('affine:page', {
    title: new Text(),
  });
  page.addBlock('affine:surface', {}, pageBlockId);

  // Add frame block inside page block
  const frameId = page.addBlock('affine:frame', {}, pageBlockId);
  for (let i = 0; i < 1000; i++) {
    // Add paragraph block inside frame block
    page.addBlock(
      'affine:paragraph',
      {
        text: new Text('Hello, world! ' + i),
      },
      frameId
    );
  }
};

heavy.id = 'heavy';
heavy.displayName = 'Heavy Example';
heavy.description = 'Heavy example on thousands of paragraph blocks';
