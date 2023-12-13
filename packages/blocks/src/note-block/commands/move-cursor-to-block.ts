import type { Command } from '@blocksuite/block-std';
import { getTextNodesFromElement } from '@blocksuite/inline';

import { autoScroll } from '../../page-block/text-selection/utils.js';
import { moveCursor } from '../utils.js';

export const moveCursorToBlock: Command<
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
  const nextCaret = {
    node: text,
    offset: tail ? text.textContent?.length ?? 0 : 0,
  };

  const success = moveCursor(nextCaret);
  if (!success) {
    return;
  }

  const selection = document.getSelection();
  if (!selection) {
    return;
  }
  const range = selection.getRangeAt(0);
  const viewport = focusBlock.closest('affine-doc-page')?.viewportElement;
  if (viewport) {
    autoScroll(viewport, range.getBoundingClientRect().top);
  }

  return next();
};

declare global {
  namespace BlockSuite {
    interface Commands {
      moveCursorToBlock: typeof moveCursorToBlock;
    }
  }
}
