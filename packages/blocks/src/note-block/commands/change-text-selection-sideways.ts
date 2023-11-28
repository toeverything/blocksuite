import type { Command } from '@blocksuite/block-std';
import { getTextNodesFromElement } from '@blocksuite/virgo';

import { applyCarets, getCurrentTextSelectionCarets } from '../utils.js';

export const changeTextSelectionSideways: Command<
  'focusBlock',
  never,
  { left: boolean }
> = (ctx, next) => {
  const { left, focusBlock } = ctx;
  const currentTextSelectionCarets = getCurrentTextSelectionCarets();
  if (!currentTextSelectionCarets || !focusBlock) {
    return false;
  }
  const { startCaret, endCaret: prevEndCaret } = currentTextSelectionCarets;

  const texts = getTextNodesFromElement(focusBlock);

  const currentTextIndex = texts.findIndex(text => text === prevEndCaret.node);

  if (currentTextIndex === -1) {
    return;
  }

  let nextEndCaret = {
    node: prevEndCaret.node,
    offset: left ? prevEndCaret.offset - 1 : prevEndCaret.offset + 1,
  };

  if (
    nextEndCaret.offset >= 0 &&
    nextEndCaret.offset <= texts[currentTextIndex].length
  ) {
    const result = applyCarets(startCaret, nextEndCaret);
    if (!result) {
      return;
    }

    return next();
  }

  const nextTextIndex = currentTextIndex + (left ? -1 : 1);

  if (nextTextIndex < 0 || nextTextIndex >= texts.length) {
    return;
  }

  nextEndCaret = {
    node: texts[nextTextIndex],
    offset: left ? texts[nextTextIndex].length - 1 : 1,
  };

  const result = applyCarets(startCaret, nextEndCaret);
  if (!result) {
    return;
  }

  return next();
};

declare global {
  namespace BlockSuite {
    interface Commands {
      changeTextSelectionSideways: typeof changeTextSelectionSideways;
    }
  }
}
