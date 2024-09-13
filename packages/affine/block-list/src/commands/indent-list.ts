import type { Command } from '@blocksuite/block-std';

import { focusTextModel } from '@blocksuite/affine-components/rich-text';
import { matchFlavours } from '@blocksuite/affine-shared/utils';

import { correctNumberedListsOrderToPrev } from './utils.js';

export const indentListCommand: Command<
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
  if (!blockId) {
    const text = selection.find('text');
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

  /**
   * initial state:
   * - aaa
   *   - bbb
   * - ccc <- indent
   *   - ddd
   * - eee
   *
   * final state:
   * - aaa
   *   - bbb
   *   - ccc
   *     - ddd
   * - eee
   */

  /**
   * ccc
   */
  const model = doc.getBlock(blockId)?.model;
  if (!model || !matchFlavours(model, ['affine:list'])) {
    console.error(`block ${blockId} is not a list block`);
    return;
  }
  const schema = std.doc.schema;
  /**
   * aaa
   */
  const previousSibling = doc.getPrev(model);
  if (
    doc.readonly ||
    !previousSibling ||
    !schema.isValid(model.flavour, previousSibling.flavour)
  ) {
    // cannot indent, do nothing
    return;
  }
  /**
   * eee
   */
  const nextSibling = doc.getNext(model);

  doc.captureSync();

  doc.moveBlocks([model], previousSibling);
  correctNumberedListsOrderToPrev(doc, model);
  if (nextSibling) correctNumberedListsOrderToPrev(doc, nextSibling);

  focusTextModel(std, model.id, inlineIndex);

  return next();
};
