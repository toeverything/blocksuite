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
  | 'none';

// text can be applied both text and paragraph formatting actions, while others can only be applied paragraph actions
export type SelectedBlockType = 'Text' | 'Caret' | 'Other';

function isSelectionEvent(
  e: SelectionEvent | FrameSelectionState
): e is SelectionEvent {
  return (e as SelectionEvent).raw !== undefined;
}

export function getDragDirection(
  e: SelectionEvent | FrameSelectionState
): DragDirection {
  const startX = e.start.x;
  const startY = e.start.y;
  const endX = isSelectionEvent(e) ? e.x : e.end.x;
  const endY = isSelectionEvent(e) ? e.y : e.end.y;
  return endX > startX
    ? endY > startY
      ? 'right-bottom'
      : 'right-top'
    : endY > startY
    ? 'left-bottom'
    : 'left-top';
}

export function getNativeSelectionMouseDragInfo(e: SelectionEvent) {
  const direction: DragDirection = getDragDirection(e);
  const selection = window.getSelection();
  assertExists(selection);
  const selectedType: SelectedBlockType =
    selection.type === 'Caret' ? 'Caret' : 'Text';
  const { anchorNode, focusNode, focusOffset, anchorOffset } = selection;
  const [targetNode, offset] = ['left-top', 'right-top'].includes(direction)
    ? [anchorNode, anchorOffset]
    : [focusNode, focusOffset];

  assertExists(targetNode);
  const range = document.createRange();
  range.setStart(targetNode, offset);
  return { selectedType, direction, anchor: range };
}
