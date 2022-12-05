import {
  assertExists,
  caretRangeFromPoint,
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

/**
 * Determine if the selection contains only one line
 */
function isOnlyOneLineSelected(selection: Selection) {
  // Before the user has clicked a freshly loaded page, the rangeCount is 0.
  if (selection.rangeCount === 0) {
    return true;
  }
  // The rangeCount will usually be 1.
  // Scripting can be used to make the selection contain more than one range.
  if (selection.rangeCount > 1) {
    return false;
  }
  const range = selection.getRangeAt(0);
  // Get the selection height
  const { height } = range.getBoundingClientRect();

  const oneLineRange = document.createRange();
  const { anchorNode, anchorOffset } = selection;
  assertExists(anchorNode);
  oneLineRange.setStart(anchorNode, anchorOffset);
  // Get the base line height
  const { height: oneLineHeight } = oneLineRange.getBoundingClientRect();
  return height <= oneLineHeight;
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
  const selectedOneLine = isOnlyOneLineSelected(selection);

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

export function getNativeSelectionMouseDragInfo(e: SelectionEvent) {
  const selection = window.getSelection();
  assertExists(selection);
  const direction = getDragDirection(e, selection);
  const selectedType: SelectedBlockType =
    selection.type === 'Caret' ? 'Caret' : 'Text';
  const { anchorNode, anchorOffset, focusNode, focusOffset } = selection;
  const [targetNode, offset] = ['left-top', 'right-top'].includes(direction)
    ? [anchorNode, anchorOffset]
    : [focusNode, focusOffset];

  assertExists(targetNode);
  const range = document.createRange();
  range.setStart(targetNode, offset);
  return { selectedType, direction, anchor: range };
}
