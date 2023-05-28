import { IS_IOS, IS_MAC } from '@blocksuite/global/config';

export function isPinchEvent(e: WheelEvent) {
  // two finger pinches on touch pad, ctrlKey is always true.
  // https://bugs.chromium.org/p/chromium/issues/detail?id=397027
  if (IS_IOS || IS_MAC) {
    return e.ctrlKey || e.metaKey;
  }
  return e.ctrlKey;
}

/**
 * Returns a `DragEvent` via `MouseEvent`.
 */
export function createDragEvent(type: string, event?: MouseEvent) {
  const options = {
    dataTransfer: new DataTransfer(),
  };
  if (event) {
    const { clientX, clientY, screenX, screenY } = event;
    Object.assign(options, {
      clientX,
      clientY,
      screenX,
      screenY,
    });
  }
  return new DragEvent(type, options);
}
