import {
  caretRangeFromPoint,
  clamp,
  getCurrentRange,
  isMultiLineRange,
  resetNativeSelection,
  SelectionEvent,
} from '../../__internal__/index.js';

export function repairContextMenuRange(e: SelectionEvent) {
  const currentRange = window.getSelection()?.getRangeAt(0);
  const pointRange = caretRangeFromPoint(e.raw.x, e.raw.y);
  // repair browser context menu change selection can not go through blocks
  if (
    currentRange &&
    pointRange &&
    currentRange.isPointInRange(
      pointRange.startContainer,
      pointRange.startOffset
    ) &&
    currentRange.isPointInRange(pointRange.endContainer, pointRange.endOffset)
  ) {
    requestAnimationFrame(() => {
      resetNativeSelection(currentRange);
    });
  }
}

export type DragDirection =
  | 'right-bottom'
  | 'right-top'
  | 'left-bottom'
  | 'left-top'
  | 'center-bottom'
  // no select direction, for example select all by `ctrl + a`
  | 'directionless';

// XXX The type is not clear enough and needs to be redesigned
// text can be applied both text and paragraph formatting actions, while others can only be applied paragraph actions
export type SelectedBlockType = 'Text' | 'Caret' | 'Other';

export function getDragDirection(e: SelectionEvent): DragDirection {
  const startX = e.start.x;
  const startY = e.start.y;
  const endX = e.x;
  const endY = e.y;
  // selection direction
  const isForwards = endX > startX;
  const range = getCurrentRange();
  const selectedOneLine = !isMultiLineRange(range);

  if (isForwards) {
    if (selectedOneLine || endY >= startY) {
      return 'right-bottom';
    } else {
      return 'right-top';
    }
  } else {
    // backwards
    if (selectedOneLine || endY <= startY) {
      return 'left-top';
    } else {
      return 'left-bottom';
    }
  }
}

/**
 * Return a base range for element positioning based on the current selection and selection info
 *
 * @example
 * ```ts
 * const { selectedType, direction, anchor } = getNativeSelectionMouseDragInfo(e);
 * if (selectedType === 'Caret') {
 *   return;
 * }
 * const rect = anchor.getBoundingClientRect();
 * ```
 */
export function getNativeSelectionMouseDragInfo(e: SelectionEvent) {
  const curRange = getCurrentRange();
  const direction = getDragDirection(e);

  const isSelectedNothing =
    curRange.collapsed ||
    // If you try to drag from back to front on an empty line,
    // you will get a empty range, but the `range.collapsed` is false,
    // and the range has different startContainer and endContainer.
    // So we need to check the length of the range
    curRange.toString().length === 0;
  const selectedType: SelectedBlockType = isSelectedNothing ? 'Caret' : 'Text';
  return { selectedType, direction, anchor: curRange };
}

export function calcPositionPointByRange(
  range: Range,
  direction: DragDirection
) {
  const { startContainer, startOffset, endContainer, endOffset } = range;

  const isStartAnchor = direction.includes('top');
  const [targetNode, offset] = isStartAnchor
    ? [startContainer, startOffset]
    : [endContainer, endOffset];
  const lineRange = new Range();

  if (direction.includes('center')) {
    // Use whole range
    lineRange.setStart(startContainer, startOffset);
    lineRange.setEnd(endContainer, endOffset);
  } else {
    lineRange.setStart(targetNode, offset);
  }

  // XXX the workaround is very ugly, please improve after you find a way to identify the range is empty
  // Workaround select to empty line will get empty range
  // If range is empty, range.getBoundingClientRect of range will return the empty value({ x: 0, y: 0 ...})
  const tmpRect = lineRange.getBoundingClientRect();
  const isWrongRect =
    tmpRect.x === 0 &&
    tmpRect.y === 0 &&
    tmpRect.width === 0 &&
    tmpRect.height === 0;

  if (isWrongRect) {
    // Fallback to use whole range
    lineRange.setStart(startContainer, startOffset);
    lineRange.setEnd(endContainer, endOffset);
  }
  // resetNativeSelection(lineRange);

  const lineRect = lineRange.getBoundingClientRect();
  const isBottom = direction.includes('bottom');
  const positioningPoint = {
    // Use the center of the position rect
    x: lineRect.x + lineRect.width / 2,
    // if the direction is bottom, use the bottom of the position rect
    y: lineRect.y + (isBottom ? lineRect.height : 0),
  };
  return positioningPoint;
}

export const calcSafeCoordinate = ({
  positioningPoint,
  objRect = { width: 0, height: 0 },
  boundaryRect = document.body.getBoundingClientRect(),
  offsetX = 0,
  offsetY = 0,
  edgeGap = 20,
}: {
  /**
   * The point that the objRect is positioned to.
   */
  positioningPoint: { x: number; y: number };
  /**
   * The boundary rect of the obj that is being positioned.
   */
  objRect?: { height: number; width: number };
  /**
   * The boundary rect of the container that the obj is in.
   */
  boundaryRect?: DOMRect;
  offsetX?: number;
  offsetY?: number;
  edgeGap?: number;
}) => {
  const safeX = clamp(
    positioningPoint.x + offsetX,
    edgeGap,
    boundaryRect.width - objRect.width - edgeGap
  );
  const y = positioningPoint.y + offsetY;
  // Not use clamp for y coordinate to avoid the quick bar always showing after scrolling
  // const safeY = clamp(
  //   positioningPoint.y + offsetY,
  //   edgeGap,
  //   boundaryRect.height - objRect.height - edgeGap
  // );
  return {
    x: safeX,
    y,
  };
};
