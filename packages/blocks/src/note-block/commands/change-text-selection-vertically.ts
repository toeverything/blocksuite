import type { Command } from '@blocksuite/block-std';

import {
  applyTextSelection,
  getCurrentCaretPos,
  getCurrentTextSelectionCarets,
  horizontalGetNextCaret,
} from '../utils.js';

export const changeTextSelectionVertically: Command<
  'targetBlock',
  never,
  { upward: boolean }
> = (ctx, next) => {
  const { upward, targetBlock } = ctx;
  const currentTextSelectionCarets = getCurrentTextSelectionCarets();
  if (!currentTextSelectionCarets || !targetBlock) {
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
    targetBlock,
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

  const result = applyTextSelection(startCaret, nextEndCaret);
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
