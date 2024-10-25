import { MarkdownTransformer } from '@blocksuite/blocks';
import { type DocCollection, Text } from '@blocksuite/store';

import type { InitFn } from './utils.js';

const presetMarkdown = `Click the 🔁 button to switch between editors dynamically - they are fully compatible!`;

export const preset: InitFn = async (collection: DocCollection, id: string) => {
  const doc = collection.createDoc({ id });
  doc.load();
  // Add root block and surface block at root level
  const rootId = doc.addBlock('affine:page', {
    title: new Text('BlockSuite Playground'),
  });
  doc.addBlock('affine:surface', {}, rootId);

  // Add note block inside root block
  const noteId = doc.addBlock(
    'affine:note',
    { xywh: '[0, 100, 800, 640]' },
    rootId
  );

  // Import preset markdown content inside note block
  await MarkdownTransformer.importMarkdownToBlock({
    doc,
    blockId: noteId,
    markdown: presetMarkdown,
  });

  doc.resetHistory();
};

preset.id = 'preset';
preset.displayName = 'BlockSuite Starter';
preset.description = 'Start from friendly introduction';
