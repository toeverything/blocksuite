import { isDatabaseInput, isInsidePageTitle } from '../query.js';
import { debounce } from '../std.js';
import { Recognizer } from './recognizer.js';
import type { SelectionEvent } from './selection-event.js';
import { toSelectionEvent } from './selection-event.js';

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
  let isDragging = false;

  const recognizer = new Recognizer(container, {
    onDragStart: event => {
      if (shouldFilterMouseEvent(event.raw)) return;
      if (
        !isInsidePageTitle(event.raw.target) &&
        !isDatabaseInput(event.raw.target)
      ) {
        event.raw.preventDefault();
      }
      isDragging = true;
      onContainerDragStart(event);
    },
    onDragMove: event => {
      if (shouldFilterMouseEvent(event.raw)) return;
      if (
        !isInsidePageTitle(event.raw.target) &&
        !isDatabaseInput(event.raw.target)
      ) {
        event.raw.preventDefault();
      }
      onContainerDragMove(event);
    },
    onDragEnd: event => {
      if (
        !isInsidePageTitle(event.raw.target) &&
        !isDatabaseInput(event.raw.target)
      ) {
        event.raw.preventDefault();
      }
      isDragging = false;
      onContainerDragEnd(event);
    },

    onPointerDown: event => {
      //
    },
    onPointerMove: event => {
      if (shouldFilterMouseEvent(event.raw)) return;
      if (
        !isInsidePageTitle(event.raw.target) &&
        !isDatabaseInput(event.raw.target)
      ) {
        event.raw.preventDefault();
      }
      onContainerMouseMove(event);
    },
    onPointerUp: event => {
      //
    },
    onPointerOut: event => {
      onContainerMouseOut(event);
    },

    onClick: event => {
      if (
        !isInsidePageTitle(event.raw.target) &&
        !isDatabaseInput(event.raw.target)
      ) {
        event.raw.preventDefault();
      }
      onContainerClick(event);
    },
    onDblClick: event => {
      if (shouldFilterMouseEvent(event.raw)) return;
      onContainerDblClick(event);
    },
    onTripleClick: event => {
      if (shouldFilterMouseEvent(event.raw)) return;
      onContainerTripleClick(event);
    },
  });

  const getBoundingClientRect: () => DOMRect = () =>
    container.getBoundingClientRect();

  const contextMenuHandler = (event: MouseEvent) => {
    // e.preventDefault();
    // e.stopPropagation();
    const selectionEvent = toSelectionEvent({
      event,
      getBoundingClientRect,
      startX: -Infinity,
      startY: -Infinity,
      last: null,
    });
    onContainerContextMenu(selectionEvent);
  };

  /**
   * TODO merge to `selectionChangeHandler`
   * @deprecated use `selectionChangeHandler` instead
   */
  const selectionChangeHandlerWithDebounce = debounce((e: Event) => {
    if (shouldFilterMouseEvent(e)) return;
    if (isDragging) {
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
    container.removeEventListener('contextmenu', contextMenuHandler);
    document.removeEventListener(
      'selectionchange',
      selectionChangeHandlerWithDebounce
    );
    document.removeEventListener('selectionchange', selectionChangeHandler);
  };
  return dispose;
}
