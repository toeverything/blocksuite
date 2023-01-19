export const isWeb = typeof window !== 'undefined';
export const isFirefox =
  isWeb && navigator.userAgent.toLowerCase().indexOf('firefox') > -1;

export function caretRangeFromPoint(
  clientX: number,
  clientY: number
): Range | null {
  if (isFirefox) {
    // @ts-ignore
    const caret = document.caretPositionFromPoint(clientX, clientY);
    const range = document.createRange();
    range.setStart(caret.offsetNode, caret.offset);
    return range;
  }
  return document.caretRangeFromPoint(clientX, clientY);
}
