import type { Command } from '@blocksuite/block-std';

import {
  applyCarets,
  getCurrentCaretPos,
  getCurrentTextSelectionCarets,
  horizontalGetNextCaret,
} from '../utils.js';

export const changeTextSelectionVertically: Command<
  'focusBlock',
  never,
  { upward: boolean }
> = (ctx, next) => {
  const { upward, focusBlock } = ctx;
  const currentTextSelectionCarets = getCurrentTextSelectionCarets();
  if (!currentTextSelectionCarets || !focusBlock) {
    return;
  }
  const { startCaret, endCaret: prevEndCaret } = currentTextSelectionCarets;

  const cursorRect = getCurrentCaretPos(true);
  if (!cursorRect) {
    return;
  }

  const nextEndCaret = horizontalGetNextCaret(
    {
      x: cursorRect.x + 1,
      y: upward
        ? cursorRect.top - cursorRect.height / 2
        : cursorRect.bottom + cursorRect.height / 2,
    },
    focusBlock,
    upward,
    cursorRect.height / 2
  );

  if (
    !nextEndCaret ||
    (prevEndCaret.node === nextEndCaret.node &&
      prevEndCaret.offset === nextEndCaret.offset)
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
      changeTextSelectionVertically: typeof changeTextSelectionVertically;
    }
  }
}
