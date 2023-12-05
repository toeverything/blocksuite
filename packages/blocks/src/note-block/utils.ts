import type { BlockElement } from '@blocksuite/lit';

import { caretFromPoint } from '../page-block/text-selection/utils.js';

type Caret = { node: Node; offset: number };

export const ensureBlockInContainer = (
  blockElement: BlockElement,
  containerElement: BlockElement
) =>
  containerElement.contains(blockElement) && blockElement !== containerElement;

export function isRangeReverse() {
  const selection = document.getSelection();
  if (!selection) {
    return false;
  }

  const isReverse =
    !!selection.anchorNode &&
    !!selection.focusNode &&
    (selection.anchorNode === selection.focusNode
      ? selection.anchorOffset > selection.focusOffset
      : selection.anchorNode.compareDocumentPosition(selection.focusNode) ===
        Node.DOCUMENT_POSITION_PRECEDING);

  return isReverse;
}

export function getCurrentCaretPos(tail: boolean) {
  const selection = document.getSelection();
  if (!selection || !selection.anchorNode) {
    return null;
  }
  const caretRange = document.createRange();
  caretRange.setStart(
    selection.focusNode ?? selection.anchorNode,
    selection.focusNode ? selection.focusOffset : selection.anchorOffset
  );
  const caretRect = caretRange.getClientRects();
  caretRange.detach();
  return tail ? caretRect[caretRect.length - 1] : caretRect[0];
}

export function horizontalGetNextCaret(
  point: { x: number; y: number },
  block: BlockElement,
  forward = false,
  span = 5
): Caret | undefined {
  const current = getCurrentCaretPos(true);
  if (!current) {
    return;
  }

  const rect = block.getBoundingClientRect();

  let _point = {
    x:
      point.x >= rect.left && point.x <= rect.right
        ? point.x
        : point.x < rect.left
          ? rect.left
          : rect.right,
    y:
      point.y >= rect.top && point.y <= rect.bottom
        ? point.y
        : forward && point.y > rect.bottom
          ? rect.bottom - span
          : !forward && point.y < rect.top
            ? rect.top + span
            : point.y,
  };

  let move = caretFromPoint(_point.x, _point.y);

  const needContinue = () => {
    if (!move) {
      return false;
    }
    if (!block.contains(move.node)) {
      return false;
    }
    if (current && Math.abs(current.y - _point.y) < span) {
      return true;
    }
    if (move.node.nodeType === Node.TEXT_NODE) {
      return false;
    }
    return true;
  };

  while (needContinue()) {
    _point = {
      x: _point.x,
      y: _point.y + (forward ? -1 * span : span),
    };
    move = caretFromPoint(_point.x, _point.y);
  }

  if (move && !block.contains(move.node)) {
    return;
  }

  return move;
}

export function moveCursor(caret: Caret) {
  const prevCursor = getCurrentCaretPos(true);

  const selection = document.getSelection();
  if (!selection) {
    return;
  }

  const { node, offset } = caret;

  const nextRange = document.createRange();
  nextRange.setStart(node, offset);
  selection.removeAllRanges();
  selection.addRange(nextRange);

  const element = node.parentElement;
  element?.scrollIntoView({ block: 'nearest' });

  const finalCursor = getCurrentCaretPos(true);

  if (
    !finalCursor ||
    (prevCursor &&
      prevCursor.x === finalCursor.x &&
      prevCursor.y === finalCursor.y)
  ) {
    return false;
  }

  return true;
}

export function getCurrentTextSelectionCarets():
  | { startCaret: Caret; endCaret: Caret }
  | undefined {
  const selection = document.getSelection();
  if (!selection) {
    return;
  }

  const range = selection.getRangeAt(0);

  const isRangeReversed = isRangeReverse();

  const startCaret: Caret = {
    node: isRangeReversed ? range.endContainer : range.startContainer,
    offset: isRangeReversed ? range.endOffset : range.startOffset,
  };

  const endCaret: Caret = {
    node: isRangeReversed ? range.startContainer : range.endContainer,
    offset: isRangeReversed ? range.startOffset : range.endOffset,
  };

  return { startCaret, endCaret };
}

export function applyCarets(startCaret: Caret, endCaret: Caret): boolean {
  const selection = document.getSelection();
  if (!selection) {
    return false;
  }

  const newRange = document.createRange();
  newRange.setStart(startCaret.node, startCaret.offset);
  selection.removeAllRanges();
  selection.addRange(newRange);
  selection.extend(endCaret.node, endCaret.offset);

  return true;
}
