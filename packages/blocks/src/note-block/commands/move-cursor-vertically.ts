import type { Command } from '@blocksuite/block-std';

import {
  getCurrentCaretPos,
  horizontalGetNextCaret,
  moveCursor,
} from '../utils.js';

export const moveCursorVertically: Command<
  'focusBlock',
  never,
  { forward: boolean }
> = (ctx, next) => {
  const { forward, focusBlock } = ctx;
  const cursorRect = getCurrentCaretPos(true);
  if (!cursorRect || !focusBlock) {
    return;
  }

  const nextCaret = horizontalGetNextCaret(
    {
      x: cursorRect.x + 1,
      y: forward
        ? cursorRect.top - cursorRect.height / 2
        : cursorRect.bottom + cursorRect.height / 2,
    },
    focusBlock,
    forward,
    cursorRect.height / 2
  );

  if (!nextCaret) {
    return;
  }

  const result = moveCursor(nextCaret);

  if (!result) {
    return;
  }

  return next();
};

declare global {
  namespace BlockSuite {
    interface Commands {
      moveCursorVertically: typeof moveCursorVertically;
    }
  }
}
