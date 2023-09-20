import { Text, type Workspace } from '@blocksuite/store';

import { getOptions } from '../utils';
import { type InitFn } from './utils';

export const heavy: InitFn = async (workspace: Workspace, pageId: string) => {
  const { count } = getOptions((params: URLSearchParams) => {
    const count = Number(params.get('count')) || 1000;
    return {
      count,
    };
  }) as {
    count: number;
  };

  const page = workspace.createPage({ id: pageId });

  // Add page block and surface block at root level
  const pageBlockId = page.addBlock('affine:page', {
    title: new Text(),
  });
  page.addBlock('affine:surface', {}, pageBlockId);

  // Add note block inside page block
  const noteId = page.addBlock('affine:note', {}, pageBlockId);
  for (let i = 0; i < count; i++) {
    // Add paragraph block inside note block
    page.addBlock(
      'affine:paragraph',
      {
        text: new Text('Hello, world! ' + i),
      },
      noteId
    );
  }
};

heavy.id = 'heavy';
heavy.displayName = 'Heavy Example';
heavy.description = 'Heavy example on thousands of paragraph blocks';
