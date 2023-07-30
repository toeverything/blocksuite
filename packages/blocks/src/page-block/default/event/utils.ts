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

function getNearestText(
  anchor: Node,
  node: Element,
  point: { x: number; y: number }
) {
  const block = node.querySelector('[data-virgo-root]');
  const anchorBlock = anchor.parentElement?.closest('[data-virgo-root]');
  const rect = block?.getBoundingClientRect();

  if (
    block &&
    rect &&
    anchorBlock &&
    block !== anchorBlock &&
    Math.abs(anchorBlock.getBoundingClientRect().top - rect.top) > rect.height
  ) {
    const range = document.createRange();
    range.selectNodeContents(block);
    let result = rect;
    Array.from(range.getClientRects()).reduce((d, rect) => {
      const y = Math.abs(rect.top - point.y);
      const x = Math.abs(rect.left - point.x);
      const distance = y ** 2 + x ** 2;
      if (distance < d) {
        result = rect;
        return distance;
      }
      return d;
    }, Infinity);
    return caretFromPoint(result.left, result.top);
  }
  return undefined;
}

export function horizontalGetNextCaret(
  point: { x: number; y: number },
  root: HTMLElement,
  forward = false,
  span = 10
) {
  const selection = document.getSelection();
  if (!selection) {
    return;
  }
  let _point = { ...point };
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
      if (move.node instanceof Element) {
        move = getNearestText(anchor.node, move.node, _point);
        if (move) {
          return false;
        }
      }
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
    _point = {
      x: _point.x,
      y: _point.y + (forward ? -1 * span : span),
    };
    move = caretFromPoint(_point.x, _point.y);
  }
  if (!move || !move.node.parentElement?.closest('[data-virgo-root]')) {
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
