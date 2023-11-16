import type { Command } from '@blocksuite/block-std';
import { getTextNodesFromElement } from '@blocksuite/virgo';

import { applyTextSelection, getCurrentTextSelectionCarets } from '../utils.js';

export const changeTextSelectionSidewaysToBlock: Command<
  'targetBlock',
  never,
  { left: boolean }
> = (ctx, next) => {
  const { left, targetBlock } = ctx;
  const currentTextSelectionCarets = getCurrentTextSelectionCarets();
  if (!currentTextSelectionCarets || !targetBlock) {
    return;
  }
  const { startCaret } = currentTextSelectionCarets;

  const texts = getTextNodesFromElement(targetBlock);
  if (texts.length === 0) {
    return;
  }

  const nextTextIndex = left ? texts.length - 1 : 0;

  const nextEndCaret = {
    node: texts[nextTextIndex],
    offset: left ? texts[nextTextIndex].length - 1 : 1,
  };

  if (
    nextEndCaret.offset >= 0 &&
    nextEndCaret.offset <= texts[nextTextIndex].length
  ) {
    const result = applyTextSelection(startCaret, nextEndCaret);
    if (!result) {
      return;
    }

    return next();
  }

  const result = applyTextSelection(startCaret, nextEndCaret);
  if (!result) {
    return;
  }

  return next();
};

declare global {
  namespace BlockSuite {
    interface Commands {
      changeTextSelectionSidewaysToBlock: typeof changeTextSelectionSidewaysToBlock;
    }
  }
}
