import type { Command } from '@blocksuite/block-std';
import { getTextNodesFromElement } from '@blocksuite/virgo';

import { applyTextSelection, getCurrentTextSelectionCarets } from '../utils.js';

export const changeTextSelectionToBlockStartEnd: Command<
  'targetBlock',
  never,
  { tail: boolean }
> = (ctx, next) => {
  const { tail, targetBlock } = ctx;
  if (!targetBlock) {
    return;
  }

  const texts = getTextNodesFromElement(targetBlock);

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

  const result = applyTextSelection(startCaret, nextEndCaret);
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
