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

export function autoScroll(
  viewportElement: HTMLElement,
  y: number,
  threshold = 50
): boolean {
  const { scrollHeight, clientHeight, scrollTop } = viewportElement;
  let _scrollTop = scrollTop;
  const max = scrollHeight - clientHeight;

  let d = 0;
  let flag = false;

  if (Math.ceil(scrollTop) < max && clientHeight - y < threshold) {
    // ↓
    d = threshold - (clientHeight - y);
    flag = Math.ceil(_scrollTop) < max;
  } else if (scrollTop > 0 && y < threshold) {
    // ↑
    d = y - threshold;
    flag = _scrollTop > 0;
  }

  _scrollTop += d * 0.25;

  if (flag && scrollTop !== _scrollTop) {
    viewportElement.scrollTop = _scrollTop;
    return true;
  }
  return false;
}
