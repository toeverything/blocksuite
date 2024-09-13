import type { Command } from '@blocksuite/block-std';

import { focusTextModel } from '@blocksuite/affine-components/rich-text';
import { matchFlavours } from '@blocksuite/affine-shared/utils';

import { correctNumberedListsOrderToPrev } from './utils.js';

export const dedentListCommand: Command<
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
   *     - ccc  <- unindent
   *       - ddd
   *     - eee
   *   - fff
   *
   * final state:
   * - aaa
   *   - bbb
   *   - ccc
   *     - ddd
   *     - eee
   *   - fff
   */

  /**
   * ccc
   */
  const model = doc.getBlock(blockId)?.model;
  if (!model || !matchFlavours(model, ['affine:list'])) {
    console.error(`block ${blockId} is not a list block`);
    return;
  }
  /**
   * bbb
   */
  const parent = doc.getParent(model);
  if (!parent) {
    console.error(`block ${blockId} has no parent`);
    return;
  }
  if (doc.readonly || parent.role !== 'content') {
    // Top most list cannot be unindent
    return;
  }
  /**
   * aaa
   */
  const grandParent = doc.getParent(parent);
  if (!grandParent) {
    console.error(`block ${blockId} has no grand parent`);
    return;
  }
  /**
   * ccc index
   */
  const modelIndex = parent.children.indexOf(model);
  if (modelIndex === -1) {
    console.error(`block ${blockId} is not a child of its parent`);
    return;
  }

  doc.captureSync();

  /**
   * step 1:
   * - aaa
   *   - bbb
   *     - ccc
   *       - ddd
   *       - eee <- make eee as ccc's child
   *   - fff
   */
  const nextSiblings = doc.getNexts(model); // [eee]
  doc.moveBlocks(nextSiblings, model);
  /**
   * eee
   */
  const nextSibling = nextSiblings.at(0);
  if (nextSibling) correctNumberedListsOrderToPrev(doc, nextSibling);

  /**
   * step 2:
   * - aaa
   *   - bbb
   *   - ccc <- make ccc as aaa's child
   *     - ddd
   *     - eee
   *   - fff
   */
  doc.moveBlocks([model], grandParent, parent, false);
  correctNumberedListsOrderToPrev(doc, model);

  focusTextModel(std, model.id, inlineIndex);

  return next();
};
