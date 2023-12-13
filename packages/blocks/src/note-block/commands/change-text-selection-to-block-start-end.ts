import type { Command } from '@blocksuite/block-std';
import { getTextNodesFromElement } from '@blocksuite/inline';

import { applyCarets, getCurrentTextSelectionCarets } from '../utils.js';

export const changeTextSelectionToBlockStartEnd: Command<
  'focusBlock',
  never,
  { tail: boolean }
> = (ctx, next) => {
  const { tail, focusBlock } = ctx;
  if (!focusBlock) {
    return;
  }

  const texts = getTextNodesFromElement(focusBlock);

  const text = tail ? texts[texts.length - 1] : texts[0];
  if (!text) {
    return;
  }

  const nextEndCaret = {
    node: text,
    offset: tail ? text.textContent?.length ?? 0 : 0,
  };

  const currentTextSelectionCarets = getCurrentTextSelectionCarets();
  if (!currentTextSelectionCarets) {
    return;
  }

  const { startCaret, endCaret } = currentTextSelectionCarets;

  if (
    endCaret.node === nextEndCaret.node &&
    endCaret.offset === nextEndCaret.offset
  ) {
    return;
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
      changeTextSelectionToBlockStartEnd: typeof changeTextSelectionToBlockStartEnd;
    }
  }
}
