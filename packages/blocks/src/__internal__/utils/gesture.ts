import type { BaseBlockModel } from '@blocksuite/store';
import {
  getClosestHorizontalEditor,
  resetNativeSelection,
  setEndRange,
  setStartRange,
} from './selection.js';
import { debounce } from './std.js';
import {
  BLOCK_ID_ATTR,
  MOVE_DETECT_THRESHOLD,
} from '@blocksuite/global/config';
import { isTitleElement } from './query.js';
import { getElementFromEventTarget } from './query.js';
import { matchFlavours } from '@blocksuite/global/utils';

export interface IPoint {
  x: number;
  y: number;
}

export interface Bound {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface SelectionEvent extends IPoint {
  start: IPoint;
  delta: IPoint;
  raw: MouseEvent;
  containerOffset: IPoint;
  keys: {
    shift: boolean;
    /** command or control */
    cmd: boolean;
    alt: boolean;
  };
  button?: number;
}

function isFarEnough(a: IPoint, b: IPoint, d = MOVE_DETECT_THRESHOLD) {
  return Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2) > d * d;
}

function toSelectionEvent(
  e: MouseEvent,
  getBoundingClientRect: () => DOMRect,
  startX: number,
  startY: number,
  last: SelectionEvent | null = null
): SelectionEvent {
  const rect = getBoundingClientRect();
  const delta = { x: 0, y: 0 };
  const start = { x: startX, y: startY };
  const offsetX = e.clientX - rect.left;
  const offsetY = e.clientY - rect.top;
  const selectionEvent: SelectionEvent = {
    x: offsetX,
    y: offsetY,
    raw: e,
    // absolute position is still **relative** to the nearest positioned ancestor.
    //  In our case, it is the editor. For example, if there is padding/margin in editor,
    //    then the correct absolute `x`/`y` of mouse position is `containerOffset.x - x`
    // Refs: https://developer.mozilla.org/en-US/docs/Web/CSS/position#absolute_positioning
    containerOffset: {
      x: rect.left,
      y: rect.top,
    },
    delta,
    start,
    keys: {
      shift: e.shiftKey,
      cmd: e.metaKey || e.ctrlKey,
      alt: e.altKey,
    },
    button: e.button,
  };
  if (last) {
    delta.x = offsetX - last.x;
    delta.y = offsetY - last.y;
  }
  return selectionEvent;
}

export function initMouseEventHandlers(
  mode: 'page' | 'edgeless',
  container: HTMLElement,
  onContainerDragStart: (e: SelectionEvent) => void,
  onContainerDragMove: (e: SelectionEvent) => void,
  onContainerDragEnd: (e: SelectionEvent) => void,
  onContainerClick: (e: SelectionEvent) => void,
  onContainerDblClick: (e: SelectionEvent) => void,
  onContainerMouseMove: (e: SelectionEvent) => void,
  onContainerMouseOut: (e: SelectionEvent) => void,
  onContainerContextMenu: (e: SelectionEvent) => void,
  onSelectionChange: (e: Event) => void
) {
  let startX = -Infinity;
  let startY = -Infinity;
  let isDragging = false;
  let last: SelectionEvent | null = null;
  const getBoundingClientRect: () => DOMRect = () =>
    container.getBoundingClientRect();

  const mouseOutHandler = (e: MouseEvent) =>
    onContainerMouseOut(
      toSelectionEvent(e, getBoundingClientRect, startX, startY)
    );

  const mouseDownHandler = (e: MouseEvent) => {
    if (!isTitleElement(e.target)) {
      e.preventDefault();
    }
    const rect = getBoundingClientRect();

    startX = e.clientX - rect.left;
    startY = e.clientY - rect.top;
    isDragging = false;
    // e.button is 0 means left button
    if (!e.button) {
      last = toSelectionEvent(e, getBoundingClientRect, startX, startY);
    }
    document.addEventListener('mouseup', mouseUpHandler);
    document.addEventListener('mouseout', mouseOutHandler);
  };

  const mouseMoveHandler = (e: MouseEvent) => {
    if (!isTitleElement(e.target)) {
      e.preventDefault();
    }
    const rect = getBoundingClientRect();

    const a = { x: startX, y: startY };
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    const b = { x: offsetX, y: offsetY };

    if (!last) {
      onContainerMouseMove(
        toSelectionEvent(e, getBoundingClientRect, startX, startY, last)
      );
      return;
    }

    if (isFarEnough(a, b) && !isDragging) {
      isDragging = true;
      onContainerDragStart(last);
    }

    if (isDragging) {
      onContainerDragMove(
        toSelectionEvent(e, getBoundingClientRect, startX, startY, last)
      );
      onContainerMouseMove(
        toSelectionEvent(e, getBoundingClientRect, startX, startY, last)
      );
      last = toSelectionEvent(e, getBoundingClientRect, startX, startY);
    }
  };

  const mouseUpHandler = (e: MouseEvent) => {
    if (!isTitleElement(e.target)) {
      e.preventDefault();
    }

    if (isDragging) {
      onContainerDragEnd(
        toSelectionEvent(e, getBoundingClientRect, startX, startY, last)
      );
    } else {
      onContainerClick(
        toSelectionEvent(e, getBoundingClientRect, startX, startY)
      );

      // fix selection back to the nearest block
      // when user click on the edge of page (page mode) or frame (edgeless mode)
      const targetEl = getElementFromEventTarget(e.target);
      const block = targetEl?.closest(`[${BLOCK_ID_ATTR}]`) as {
        model?: BaseBlockModel;
        pageModel?: BaseBlockModel;
      } | null;
      const model = block?.model || block?.pageModel;
      if (model) {
        const isClickOnFramePage =
          mode === 'page'
            ? matchFlavours(model, ['affine:frame', 'affine:page'])
            : matchFlavours(model, ['affine:frame']);
        if (isClickOnFramePage) {
          const horizontalElement = getClosestHorizontalEditor(e.clientY);
          if (horizontalElement) {
            const rect = horizontalElement.getBoundingClientRect();
            if (e.clientX < rect.left) {
              const range = setStartRange(horizontalElement);
              resetNativeSelection(range);
            } else {
              const range = setEndRange(horizontalElement);
              resetNativeSelection(range);
            }
          }
        }
      }
    }

    startX = startY = -Infinity;
    isDragging = false;
    last = null;

    document.removeEventListener('mouseup', mouseUpHandler);
    document.removeEventListener('mouseout', mouseOutHandler);
  };

  const contextMenuHandler = (e: MouseEvent) => {
    // e.preventDefault();
    // e.stopPropagation();
    onContainerContextMenu(
      toSelectionEvent(e, getBoundingClientRect, startX, startY)
    );
  };

  const dblClickHandler = (e: MouseEvent) => {
    onContainerDblClick(
      toSelectionEvent(e, getBoundingClientRect, startX, startY)
    );
  };

  const selectionChangeHandler = debounce(e => {
    if (isDragging) {
      return;
    }

    onSelectionChange(e as Event);
  }, 300);

  container.addEventListener('mousedown', mouseDownHandler);
  container.addEventListener('mousemove', mouseMoveHandler);
  container.addEventListener('contextmenu', contextMenuHandler);
  container.addEventListener('dblclick', dblClickHandler);
  document.addEventListener('selectionchange', selectionChangeHandler);

  const dispose = () => {
    container.removeEventListener('mousedown', mouseDownHandler);
    container.removeEventListener('mousemove', mouseMoveHandler);
    container.removeEventListener('contextmenu', contextMenuHandler);
    container.removeEventListener('dblclick', dblClickHandler);
    document.removeEventListener('selectionchange', selectionChangeHandler);
  };
  return dispose;
}
