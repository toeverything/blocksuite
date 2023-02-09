export const isWeb = typeof window !== 'undefined';
export const isFirefox =
  isWeb && navigator.userAgent.toLowerCase().indexOf('firefox') > -1;

declare global {
  interface Document {
    caretPositionFromPoint(
      x: number,
      y: number
    ): {
      offsetNode: Node;
      offset: number;
    };
  }
}

const withHidePopup = <T>(fn: () => T): T => {
  const map = new Map<HTMLElement, string>();
  const formatBar = document.querySelector<HTMLElement>('format-quick-bar');
  if (formatBar) {
    map.set(formatBar, formatBar.style.visibility);
    formatBar.style.visibility = 'hidden';
  }
  try {
    return fn();
  } finally {
    // recover
    map.forEach((visibility, node) => {
      node.style.visibility = visibility;
    });
  }
};

export function caretRangeFromPoint(
  clientX: number,
  clientY: number
): Range | null {
  if (isFirefox) {
    const caret = document.caretPositionFromPoint(clientX, clientY);
    // TODO handle caret is covered by popup
    const range = document.createRange();
    range.setStart(caret.offsetNode, caret.offset);
    return range;
  }
  const range = document.caretRangeFromPoint(clientX, clientY);
  if (!range) {
    return null;
  }
  // This is a workaround
  // Sometimes the point be covered by the format bar,
  // so the range will return the body element,
  // which is not what we want.
  if (
    range.startContainer === document.body &&
    range.endContainer === document.body
  ) {
    const retryRange = withHidePopup(() =>
      document.caretRangeFromPoint(clientX, clientY)
    );
    return retryRange;
  }
  return range;
}
