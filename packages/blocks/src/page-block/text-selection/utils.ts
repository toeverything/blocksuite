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
  let caret: { node: Node; offset: number } | undefined = undefined;

  // hide all widget modals, caret-ignore elements
  const elements = [
    ...document.querySelectorAll('[data-widget-id]'),
    ...document.querySelectorAll('.caret-ignore'),
  ] as HTMLElement[];
  const prevDisplayState = elements.map(element => element.style.display);
  elements.forEach(element => {
    element.style.display = 'none';
  });

  // @ts-ignore
  if (document.caretPositionFromPoint) {
    try {
      // Firefox throws for this call in hard-to-predict circumstances
      const pos = document.caretPositionFromPoint(x, y);
      if (pos) {
        caret = { node: pos.offsetNode, offset: pos.offset };
      }
    } catch (_) {
      // do nothing
    }
  }
  if (!caret && document.caretRangeFromPoint) {
    const range = document.caretRangeFromPoint(x, y);
    if (range) {
      caret = { node: range.startContainer, offset: range.startOffset };
    }
  }

  // restore all elements
  elements.forEach((element, i) => {
    element.style.display = prevDisplayState[i];
  });

  return caret;
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
