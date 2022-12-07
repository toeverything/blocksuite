import {
  assertExists,
  caretRangeFromPoint,
  getCurrentRange,
  isMultiLineRange,
  resetNativeSelection,
  SelectionEvent,
} from '../../__internal__';
import type { FrameSelectionState } from '../edgeless/selection-manager';

export function repairContextMenuRange(e: SelectionEvent) {
  const currentRange = window.getSelection()?.getRangeAt(0);
  const pointRange = caretRangeFromPoint(e.x, e.y);
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
  // no select direction, for example select all by `ctrl + a`
  | 'directionless';

// text can be applied both text and paragraph formatting actions, while others can only be applied paragraph actions
export type SelectedBlockType = 'Text' | 'Caret' | 'Other';

function isSelectionEvent(
  e: SelectionEvent | FrameSelectionState
): e is SelectionEvent {
  return 'raw' in e;
}

export function getDragDirection(
  e: SelectionEvent | FrameSelectionState,
  selection: Selection
): DragDirection {
  const startX = e.start.x;
  const startY = e.start.y;
  const endX = isSelectionEvent(e) ? e.x : e.end.x;
  const endY = isSelectionEvent(e) ? e.y : e.end.y;
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
  const selection = window.getSelection();
  assertExists(selection);
  const curRange = getCurrentRange(selection);
  const direction = getDragDirection(e, selection);
  const isSelectedNothing =
    selection.type === 'Caret' ||
    // If you try to drag from back to front on an empty line,
    // you will get a empty range, but the `selection.type` is not 'Caret',
    // and the range has different startContainer and endContainer
    curRange.toString().length === 0;
  const selectedType: SelectedBlockType = isSelectedNothing ? 'Caret' : 'Text';
  const { anchorNode, anchorOffset, focusNode, focusOffset } = selection;
  const isStartAnchor = ['left-top', 'right-top'].includes(direction);
  const [targetNode, offset] = isStartAnchor
    ? [anchorNode, anchorOffset]
    : [focusNode, focusOffset];

  assertExists(targetNode);
  const range = document.createRange();
  range.setStart(targetNode, offset);
  // Workaround for select to the start of line
  // If not set end, the getBoundingClientRect of range will return the wrong value
  //
  // For example
  // line1↩
  //      ↑ range.getBoundingClientRect will return this position
  //        if you select `line2` from back to front,
  // line2↩
  if (isStartAnchor) {
    range.setEnd(targetNode, offset + 1);
  }

  // Workaround select to empty line will get empty range
  // If range is empty, range.getBoundingClientRect of range will return the empty value({ x: 0, y: 0 ...})
  const rangeRect = range.getBoundingClientRect();
  const isRangeIsWrong =
    rangeRect.x === 0 &&
    rangeRect.y === 0 &&
    rangeRect.width === 0 &&
    rangeRect.height === 0;

  if (isRangeIsWrong) {
    // Try to select something prevent range.getBoundingClientRect return empty value
    range.setEnd(targetNode, offset + 1);
  }
  // You can uncomment follow line to debug the positioning range
  // selection.removeAllRanges();
  // selection.addRange(range);
  return { selectedType, direction, anchor: range };
}
