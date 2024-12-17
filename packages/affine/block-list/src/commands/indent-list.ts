import type { IndentContext } from '@blocksuite/affine-shared/types';
import type { Command } from '@blocksuite/block-std';

import {
  getNearestHeadingBefore,
  matchFlavours,
} from '@blocksuite/affine-shared/utils';

import { correctNumberedListsOrderToPrev } from './utils.js';

export const canIndentListCommand: Command<
  never,
  'indentContext',
  Partial<Omit<IndentContext, 'type' | 'flavour'>>
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
  // const nextSibling = doc.getNext(model);

  return next({
    indentContext: {
      blockId,
      inlineIndex,
      type: 'indent',
      flavour: 'affine:list',
    },
  });
};

export const indentListCommand: Command<'indentContext', never> = (
  ctx,
  next
) => {
  const { indentContext, std } = ctx;
  if (
    !indentContext ||
    indentContext.type !== 'indent' ||
    indentContext.flavour !== 'affine:list'
  ) {
    console.warn(
      'you need to use `canIndentList` command before running `indentList` command'
    );
    return;
  }

  const { blockId } = indentContext;
  const { doc, selection, host, range } = std;

  const model = doc.getBlock(blockId)?.model;
  if (!model) return;

  const previousSibling = doc.getPrev(model);
  if (!previousSibling) return;

  const nextSibling = doc.getNext(model);

  doc.captureSync();

  doc.moveBlocks([model], previousSibling);
  correctNumberedListsOrderToPrev(doc, model);
  if (nextSibling) correctNumberedListsOrderToPrev(doc, nextSibling);

  // 123
  //   > # 456
  // 789
  //
  // we need to update 456 collapsed state to false when indent 789
  const nearestHeading = getNearestHeadingBefore(model);
  if (
    nearestHeading &&
    matchFlavours(nearestHeading, ['affine:paragraph']) &&
    nearestHeading.collapsed
  ) {
    doc.updateBlock(nearestHeading, {
      collapsed: false,
    });
  }

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
