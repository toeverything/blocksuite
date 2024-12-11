import type { IndentContext } from '@blocksuite/affine-shared/types';
import type { Command } from '@blocksuite/block-std';

import { matchFlavours } from '@blocksuite/affine-shared/utils';

import { correctNumberedListsOrderToPrev } from './utils.js';

export const canDedentListCommand: Command<
  never,
  'indentContext',
  Partial<Omit<IndentContext, 'flavour' | 'type'>>
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
    return;
  }
  /**
   * bbb
   */
  const parent = doc.getParent(model);
  if (!parent) {
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
    return;
  }
  /**
   * ccc index
   */
  const modelIndex = parent.children.indexOf(model);
  if (modelIndex === -1) {
    return;
  }

  return next({
    indentContext: {
      blockId,
      inlineIndex,
      type: 'dedent',
      flavour: 'affine:list',
    },
  });
};

export const dedentListCommand: Command<'indentContext'> = (ctx, next) => {
  const { indentContext: dedentContext, std } = ctx;
  const { doc, selection, range, host } = std;

  if (
    !dedentContext ||
    dedentContext.type !== 'dedent' ||
    dedentContext.flavour !== 'affine:list'
  ) {
    console.warn(
      'you need to use `canDedentList` command before running `dedentList` command'
    );
    return;
  }

  const { blockId } = dedentContext;

  const model = doc.getBlock(blockId)?.model;
  if (!model) return;

  const parent = doc.getParent(model);
  if (!parent) return;

  const grandParent = doc.getParent(parent);
  if (!grandParent) return;

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

  const textSelection = selection.find('text');
  if (textSelection) {
    host.updateComplete
      .then(() => {
        range.syncTextSelectionToRange(textSelection);
      })
      .catch(console.error);
  }

  return next();
};
