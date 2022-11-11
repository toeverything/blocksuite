import {
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
  | 'rightDown'
  | 'rightUp'
  | 'leftDown'
  | 'leftUp'
  // no select direction, for example select all by `ctrl + a`
  | 'none';

// text can be applied both text and paragraph formatting actions, while others can only be applied paragraph actions
export type SelectedBlockType = 'text' | 'other';

function isSelectionEvent(
  e: SelectionEvent | FrameSelectionState
): e is SelectionEvent {
  return (e as SelectionEvent).raw !== undefined;
}

export function getDragDirection(e: SelectionEvent): DragDirection;
export function getDragDirection(e: FrameSelectionState): DragDirection;
export function getDragDirection(
  e: SelectionEvent | FrameSelectionState
): DragDirection {
  const startX = e.start.x;
  const startY = e.start.y;
  const endX = isSelectionEvent(e) ? e.x : e.end.x;
  const endY = isSelectionEvent(e) ? e.y : e.end.y;
  return endX > startX
    ? endY > startY
      ? 'rightDown'
      : 'rightUp'
    : endY > startY
    ? 'leftDown'
    : 'leftUp';
}

export function getNativeSelectionMouseDragInfo(e: SelectionEvent) {
  const selectedType: SelectedBlockType = 'text';
  console.log(`selectedType: ${selectedType}`);
  const direction: DragDirection = getDragDirection(e);
  console.log(`direction: ${direction}`);
  const selection = window.getSelection();
  let anchor = selection?.focusNode;
  // Ensure that the anchor has `getBoundingClientRect` method
  while (anchor && !(anchor instanceof Element)) {
    anchor = anchor.parentElement;
  }
  if (!anchor) {
    throw new Error('Cannot get anchor element from native selection');
  }
  console.log(anchor);

  return { selectedType, direction, anchor };
}
