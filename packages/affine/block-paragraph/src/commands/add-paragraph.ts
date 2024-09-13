import type { Command } from '@blocksuite/block-std';

import { focusTextModel } from '@blocksuite/affine-components/rich-text';

/**
 * Add a paragraph next to the current block.
 */
export const addParagraphCommand: Command<
  never,
  'paragraphConvertedId',
  {
    blockId?: string;
  }
> = (ctx, next) => {
  const { std } = ctx;
  const { doc, selection } = std;
  doc.captureSync();

  let blockId = ctx.blockId;
  if (!blockId) {
    const text = selection.find('text');
    blockId = text?.blockId;
  }
  if (!blockId) return;

  const model = doc.getBlock(blockId)?.model;
  if (!model) return;

  let id: string;
  if (model.children.length > 0) {
    // before:
    // aaa|
    //   bbb
    //
    // after:
    // aaa
    //   |
    //   bbb
    id = doc.addBlock('affine:paragraph', {}, model, 0);
  } else {
    const parent = doc.getParent(model);
    if (!parent) return;
    const index = parent.children.indexOf(model);
    if (index < 0) return;
    // before:
    // aaa|
    //
    // after:
    // aaa
    // |
    id = doc.addBlock('affine:paragraph', {}, parent, index + 1);
  }

  focusTextModel(std, id);
  return next({ paragraphConvertedId: id });
};
