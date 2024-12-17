import type { IndentContext } from '@blocksuite/affine-shared/types';
import type { Command } from '@blocksuite/block-std';

import {
  calculateCollapsedSiblings,
  matchFlavours,
} from '@blocksuite/affine-shared/utils';

export const canDedentParagraphCommand: Command<
  never,
  'indentContext',
  Partial<Omit<IndentContext, 'flavour' | 'type'>>
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

  const model = doc.getBlock(blockId)?.model;
  if (!model || !matchFlavours(model, ['affine:paragraph'])) {
    return;
  }

  const parent = doc.getParent(model);
  if (doc.readonly || !parent || parent.role !== 'content') {
    // Top most, can not unindent, do nothing
    return;
  }

  const grandParent = doc.getParent(parent);
  if (!grandParent) return;

  return next({
    indentContext: {
      blockId,
      inlineIndex,
      type: 'dedent',
      flavour: 'affine:paragraph',
    },
  });
};

export const dedentParagraphCommand: Command<'indentContext'> = (ctx, next) => {
  const { indentContext: dedentContext, std } = ctx;
  const { doc, selection, range, host } = std;

  if (
    !dedentContext ||
    dedentContext.type !== 'dedent' ||
    dedentContext.flavour !== 'affine:paragraph'
  ) {
    console.warn(
      'you need to use `canDedentParagraph` command before running `dedentParagraph` command'
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

  if (
    matchFlavours(model, ['affine:paragraph']) &&
    model.type.startsWith('h') &&
    model.collapsed
  ) {
    const collapsedSiblings = calculateCollapsedSiblings(model);
    doc.moveBlocks([model, ...collapsedSiblings], grandParent, parent, false);
  } else {
    const nextSiblings = doc.getNexts(model);
    doc.moveBlocks(nextSiblings, model);
    doc.moveBlocks([model], grandParent, parent, false);
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
