import type { Command } from '@blocksuite/block-std';
import { getTextNodesFromElement } from '@blocksuite/virgo';

import { applyCarets, getCurrentTextSelectionCarets } from '../utils.js';

export const changeTextSelectionSidewaysToBlock: Command<
  'focusBlock',
  never,
  { tail: boolean }
> = (ctx, next) => {
  const { tail, focusBlock } = ctx;
  const currentTextSelectionCarets = getCurrentTextSelectionCarets();
  if (!currentTextSelectionCarets || !focusBlock) {
    return;
  }
  const { startCaret } = currentTextSelectionCarets;

  const texts = getTextNodesFromElement(focusBlock);
  if (texts.length === 0) {
    return;
  }

  const nextTextIndex = tail ? texts.length - 1 : 0;

  const nextEndCaret = {
    node: texts[nextTextIndex],
    offset: tail ? texts[nextTextIndex].length - 1 : 1,
  };

  if (
    nextEndCaret.offset >= 0 &&
    nextEndCaret.offset <= texts[nextTextIndex].length
  ) {
    const result = applyCarets(startCaret, nextEndCaret);
    if (!result) {
      return;
    }

    return next();
  }

  const result = applyCarets(startCaret, nextEndCaret);
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
