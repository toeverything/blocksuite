import type { Command } from '@blocksuite/block-std';
import { getTextNodesFromElement } from '@blocksuite/virgo';

import { autoScroll } from '../../page-block/text-selection/utils.js';
import { moveCursor } from '../utils.js';

export const moveCursorToBlock: Command<
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
  const viewport = targetBlock.closest('affine-doc-page')?.viewportElement;
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
