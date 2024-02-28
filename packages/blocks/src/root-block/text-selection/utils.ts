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
