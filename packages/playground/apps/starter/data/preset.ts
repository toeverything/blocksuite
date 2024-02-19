import { MarkdownTransformer } from '@blocksuite/blocks';
import { Text, type Workspace } from '@blocksuite/store';

import { type InitFn } from './utils.js';

const presetMarkdown = `Click the 🔁 button to switch between editors dynamically - they are fully compatible!`;

// eslint-disable-next-line @typescript-eslint/no-misused-promises
export const preset: InitFn = async (workspace: Workspace, id: string) => {
  const page = workspace.createPage({ id });
  page.load();
  // Add page block and surface block at root level
  const pageBlockId = page.addBlock('affine:page', {
    title: new Text('BlockSuite Playground'),
  });
  page.addBlock('affine:surface', {}, pageBlockId);

  // Add note block inside page block
  const noteId = page.addBlock(
    'affine:note',
    { xywh: '[0, 100, 800, 640]' },
    pageBlockId
  );

  // Import preset markdown content inside note block
  await MarkdownTransformer.importMarkdown({
    page,
    noteId,
    markdown: presetMarkdown,
  });

  page.resetHistory();
};

preset.id = 'preset';
preset.displayName = 'BlockSuite Starter';
preset.description = 'Start from friendly introduction';
