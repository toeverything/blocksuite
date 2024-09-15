import type { Command } from '@blocksuite/block-std';

import { focusTextModel } from '@blocksuite/affine-components/rich-text';
import { matchFlavours } from '@blocksuite/affine-shared/utils';

export const dedentParagraphCommand: Command<
  never,
  never,
  {
    blockId?: string;
    inlineIndex?: number;
  }
> = (ctx, next) => {
  let { blockId, inlineIndex } = ctx;
  const { std } = ctx;
  const { selection, doc } = std;
  const text = selection.find('text');

  if (!blockId) {
    /**
     * Do nothing if the selection:
     * - is not a text selection
     * - or spans multiple blocks
     */
    if (!text || (text.to && text.from.blockId !== text.to.blockId)) {
      return;
    }

    blockId = text.from.blockId;
    inlineIndex = text.from.index;
  }
  if (blockId == null || inlineIndex == null) {
    return;
  }

  const model = std.doc.getBlock(blockId)?.model;
  if (!model || !matchFlavours(model, ['affine:paragraph'])) {
    console.error(`block ${blockId} is not a paragraph block`);
    return;
  }

  const parent = doc.getParent(model);
  if (doc.readonly || !parent || parent.role !== 'content') {
    // Top most, can not unindent, do nothing
    return;
  }

  const grandParent = doc.getParent(parent);
  if (!grandParent) return;
  doc.captureSync();

  const nextSiblings = doc.getNexts(model);
  doc.moveBlocks(nextSiblings, model);
  doc.moveBlocks([model], grandParent, parent, false);

  focusTextModel(std, model.id, inlineIndex);

  return next();
};
