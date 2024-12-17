import type { ListBlockModel } from '@blocksuite/affine-model';
import type { IndentContext } from '@blocksuite/affine-shared/types';
import type { Command } from '@blocksuite/block-std';

import {
  calculateCollapsedSiblings,
  getNearestHeadingBefore,
  matchFlavours,
} from '@blocksuite/affine-shared/utils';

export const canIndentParagraphCommand: Command<
  never,
  'indentContext',
  Partial<Omit<IndentContext, 'flavour' | 'type'>>
> = (cxt, next) => {
  let { blockId, inlineIndex } = cxt;
  const { std } = cxt;
  const { selection, doc } = std;
  const { schema } = doc;

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

  const model = std.doc.getBlock(blockId)?.model;
  if (!model || !matchFlavours(model, ['affine:paragraph'])) {
    return;
  }

  const previousSibling = doc.getPrev(model);
  if (
    doc.readonly ||
    !previousSibling ||
    !schema.isValid(model.flavour, previousSibling.flavour)
  ) {
    // Bottom, can not indent, do nothing
    return;
  }

  return next({
    indentContext: {
      blockId,
      inlineIndex,
      type: 'indent',
      flavour: 'affine:paragraph',
    },
  });
};

export const indentParagraphCommand: Command<'indentContext'> = (ctx, next) => {
  const { indentContext, std } = ctx;
  const { doc, selection, host, range } = std;

  if (
    !indentContext ||
    indentContext.type !== 'indent' ||
    indentContext.flavour !== 'affine:paragraph'
  ) {
    console.warn(
      'you need to use `canIndentParagraph` command before running `indentParagraph` command'
    );
    return;
  }
  const { blockId } = indentContext;

  const model = doc.getBlock(blockId)?.model;
  if (!model) return;

  const previousSibling = doc.getPrev(model);
  if (!previousSibling) return;

  doc.captureSync();

  {
    // > # 123
    // > # 456
    //
    // we need to update 123 collapsed state to false when indent 456
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
  }

  if (
    matchFlavours(model, ['affine:paragraph']) &&
    model.type.startsWith('h') &&
    model.collapsed
  ) {
    const collapsedSiblings = calculateCollapsedSiblings(model);
    doc.moveBlocks([model, ...collapsedSiblings], previousSibling);
  } else {
    doc.moveBlocks([model], previousSibling);
  }

  {
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
  }

  // update collapsed state of affine list
  if (
    matchFlavours(previousSibling, ['affine:list']) &&
    previousSibling.collapsed
  ) {
    doc.updateBlock(previousSibling, {
      collapsed: false,
    } as Partial<ListBlockModel>);
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
