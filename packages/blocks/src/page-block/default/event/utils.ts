export function pointIsNotText(element: unknown) {
  if (element instanceof Element) {
    const { cursor } = window.getComputedStyle(element);
    return cursor !== 'text';
  }

  return true;
}

export function caretFromPoint(
  x: number,
  y: number
): { node: Node; offset: number } | undefined {
  // @ts-ignore
  if (document.caretPositionFromPoint) {
    try {
      // Firefox throws for this call in hard-to-predict circumstances
      const pos = document.caretPositionFromPoint(x, y);
      if (pos) return { node: pos.offsetNode, offset: pos.offset };
    } catch (_) {
      // do nothing
    }
  }
  if (document.caretRangeFromPoint) {
    const range = document.caretRangeFromPoint(x, y);
    if (range) return { node: range.startContainer, offset: range.startOffset };
  }

  return undefined;
}

export function rangeFromCaret(caret: { node: Node; offset: number }): Range {
  const range = document.createRange();
  range.setStart(caret.node, caret.offset);
  range.setEnd(caret.node, caret.offset);

  return range;
}

export function horizontalGetNextCaret(
  point: { x: number; y: number },
  root: HTMLElement,
  forward = false
) {
  const selection = document.getSelection();
  if (!selection) {
    return;
  }
  let move = caretFromPoint(point.x, point.y);
  const anchor = caretFromPoint(point.x, point.y);
  const needContinue = () => {
    if (!move) {
      return false;
    }
    if (!anchor) {
      return false;
    }
    if (!root.contains(move.node)) {
      return false;
    }
    if (move.node.nodeType !== Node.TEXT_NODE) {
      return true;
    }
    if (move.node !== anchor.node) {
      return false;
    }
    if (move.offset !== anchor.offset) {
      return false;
    }
    return true;
  };
  while (needContinue()) {
    point = {
      x: point.x,
      y: point.y + (forward ? -8 : 8),
    };
    move = caretFromPoint(point.x, point.y);
  }
  if (!move) {
    return;
  }

  move.node.parentElement?.scrollIntoView({ block: 'nearest' });

  return move;
}

export function horizontalMoveCursorToNextText(
  point: { x: number; y: number },
  root: HTMLElement,
  forward = false
) {
  const selection = document.getSelection();
  if (!selection) {
    return;
  }
  const caret = horizontalGetNextCaret(point, root, forward);
  if (!caret) {
    return;
  }
  const { node, offset } = caret;

  const nextRange = document.createRange();
  nextRange.setStart(node, offset);
  selection.removeAllRanges();
  selection.addRange(nextRange);

  const element = node.parentElement;
  element?.scrollIntoView({ block: 'nearest' });

  return {
    caret,
    range: nextRange,
  };
}

export function isControlledKeyboardEvent(e: KeyboardEvent) {
  return e.ctrlKey || e.metaKey || e.altKey;
}

export function isPrintableKeyEvent(event: KeyboardEvent): boolean {
  return event.key.length === 1 && !isControlledKeyboardEvent(event);
}
