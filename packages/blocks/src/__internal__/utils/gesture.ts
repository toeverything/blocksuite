import { IS_IOS, IS_MAC } from '@blocksuite/global/config';

import type { SelectionEvent } from './gesture-recognition.js';
import { GestureRecognition, toSelectionEvent } from './gesture-recognition.js';
import { isDatabaseInput, isInsidePageTitle } from './query.js';
import { debounce } from './std.js';

export interface Bound {
  x: number;
  y: number;
  w: number;
  h: number;
}

function shouldFilterMouseEvent(event: Event): boolean {
  const target = event.target;
  if (!target || !(target instanceof HTMLElement)) {
    return false;
  }
  if (target.tagName === 'INPUT') {
    return true;
  }
  if (target.tagName === 'FORMAT-QUICK-BAR') {
    return true;
  }
  return false;
}

export function initMouseEventHandlers(
  container: HTMLElement,
  onContainerDragStart: (e: SelectionEvent) => void,
  onContainerDragMove: (e: SelectionEvent) => void,
  onContainerDragEnd: (e: SelectionEvent) => void,
  onContainerClick: (e: SelectionEvent) => void,
  onContainerDblClick: (e: SelectionEvent) => void,
  onContainerTripleClick: (e: SelectionEvent) => void,
  onContainerMouseMove: (e: SelectionEvent) => void,
  onContainerMouseOut: (e: SelectionEvent) => void,
  onContainerContextMenu: (e: SelectionEvent) => void,
  onSelectionChangeWithDebounce: (e: Event) => void,
  onSelectionChangeWithoutDebounce: (e: Event) => void
) {
  const recognition = new GestureRecognition(
    container,
    {
      onClick: onContainerClick,
      onDblClick: onContainerDblClick,
      onTripleClick: onContainerTripleClick,
      onDragStart: onContainerDragStart,
      onDragMove: onContainerDragMove,
      onDragEnd: onContainerDragEnd,
      onPointerDown: ({ raw, clickCount }) => {
        if (!isInsidePageTitle(raw.target) && !isDatabaseInput(raw.target)) {
          raw.preventDefault();
        }
        if (clickCount > 3) {
          raw.stopPropagation();
        }
        return;
      },
      onPointerMove: onContainerMouseMove,
      onPointerOut: onContainerMouseOut,
    },
    {
      eventFilter: selectionEvent => {
        return shouldFilterMouseEvent(selectionEvent.raw);
      },
      eventProcessor: selectionEvent => {
        const event = selectionEvent.raw;
        const target = event.target;
        if (event.type !== 'pointerout') {
          if (!isInsidePageTitle(target) && !isDatabaseInput(target)) {
            event.preventDefault();
          }
        }
      },
    }
  );

  const getBoundingClientRect: () => DOMRect = () =>
    container.getBoundingClientRect();

  const contextMenuHandler = (e: MouseEvent) => {
    // e.preventDefault();
    // e.stopPropagation();
    const rect = getBoundingClientRect();
    onContainerContextMenu(
      toSelectionEvent(e, rect, -Infinity, -Infinity, false, 1)
    );
  };

  /**
   * TODO merge to `selectionChangeHandler`
   * @deprecated use `selectionChangeHandler` instead
   */
  const selectionChangeHandlerWithDebounce = debounce((e: Event) => {
    if (shouldFilterMouseEvent(e)) return;
    if (recognition.isDragging) {
      return;
    }

    onSelectionChangeWithDebounce(e as Event);
  }, 300);

  const selectionChangeHandler = (e: Event) => {
    onSelectionChangeWithoutDebounce(e);
  };

  container.addEventListener('contextmenu', contextMenuHandler);
  document.addEventListener(
    'selectionchange',
    selectionChangeHandlerWithDebounce
  );
  document.addEventListener('selectionchange', selectionChangeHandler);

  const dispose = () => {
    recognition.dispose();
    container.removeEventListener('contextmenu', contextMenuHandler);
    document.removeEventListener(
      'selectionchange',
      selectionChangeHandlerWithDebounce
    );
    document.removeEventListener('selectionchange', selectionChangeHandler);
  };
  return dispose;
}

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
