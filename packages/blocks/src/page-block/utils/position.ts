import { caretRangeFromPoint } from '@blocksuite/global/utils';
import type { PointerEventState } from '@blocksuite/lit';

import {
  clamp,
  getCurrentNativeRange,
  hasNativeSelection,
  isMultiLineRange,
  resetNativeSelection,
} from '../../__internal__/index.js';
import { isAtLineEdge } from '../../__internal__/utils/check-line.js';
import type { PageSelectionState } from '../default/selection-manager/index.js';

export function repairContextMenuRange(e: MouseEvent) {
  const selection = window.getSelection() as Selection;
  const currentRange =
    selection && selection.rangeCount && selection.getRangeAt(0);
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
  } else {
    e.preventDefault();
  }
}

export type DragDirection =
  | 'right-bottom'
  | 'right-top'
  | 'left-bottom'
  | 'left-top'
  | 'center-bottom'
  | 'center-top'
  // no select direction, for example select all by `ctrl + a`
  | 'directionless';

// XXX The type is not clear enough and needs to be redesigned
// text can be applied both text and paragraph formatting actions, while others can only be applied paragraph actions
export type SelectedBlockType = 'Text' | 'Caret' | 'Other';

export function getDragDirection(e: PointerEventState): DragDirection {
  const startX = e.start.x;
  const startY = e.start.y;
  const endX = e.point.x;
  const endY = e.point.y;
  // selection direction
  const isForwards = endX > startX;
  const range = getCurrentNativeRange();
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
 * const { selectedType, direction } = getNativeSelectionMouseDragInfo(e);
 * if (selectedType === 'Caret') {
 *   return;
 * }
 * ```
 */
export function getNativeSelectionMouseDragInfo(e: PointerEventState) {
  const curRange = getCurrentNativeRange();
  const direction = getDragDirection(e);

  const isSelectedNothing =
    curRange.collapsed ||
    // If you try to drag from back to front on an empty line,
    // you will get a empty range, but the `range.collapsed` is false,
    // and the range has different startContainer and endContainer.
    // So we need to check the length of the range
    curRange.toString().length === 0;
  const selectedType: SelectedBlockType = isSelectedNothing ? 'Caret' : 'Text';
  return { selectedType, direction };
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
    // Use target node
    lineRange.setStart(targetNode, offset);

    // Workaround select to empty line will get empty range
    // If range is empty, range.getBoundingClientRect of range will return the empty value({ x: 0, y: 0 ...})
    const isTextLikeNode =
      targetNode.nodeType === Node.TEXT_NODE ||
      targetNode.nodeType === Node.COMMENT_NODE ||
      targetNode.nodeType === Node.CDATA_SECTION_NODE;
    if (!isTextLikeNode) {
      // Fallback to use whole range
      lineRange.setStart(startContainer, startOffset);
      lineRange.setEnd(endContainer, endOffset);
    }

    // Workaround line edge range
    // When selecting from left to the end of right, the edge rect is expected
    // But when selecting from right to the start of left, the edge rect is not expected
    if (direction.includes('left')) {
      // Shift the range when the selection is selected to the left edge of the line
      const maybeShiftRange = isAtLineEdge(lineRange);
      if (maybeShiftRange) {
        lineRange.setStart(
          maybeShiftRange.startContainer,
          maybeShiftRange.startOffset
        );
        lineRange.setEnd(
          maybeShiftRange.endContainer,
          maybeShiftRange.endOffset
        );
      }
    }
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
/**
 * This function is used to calculate the position of the format bar.
 *
 * After update block type, the native selection may be change to block selection,
 * for example, update block to code block.
 * So we need to get the targe block's rect dynamic.
 */
export function calcCurrentSelectionPosition(
  direction: DragDirection,
  // Edgeless mode not have pageSelectionState
  pageSelectionState?: PageSelectionState
) {
  if (!pageSelectionState || !pageSelectionState.selectedBlocks.length) {
    if (!hasNativeSelection()) {
      throw new Error(
        "Failed to get anchor element! There's no block selection or native selection."
      );
    }
    // Native selection
    const range = getCurrentNativeRange();
    const positioningPoint = calcPositionPointByRange(range, direction);
    return positioningPoint;
  }
  // Block selection
  const blocks = pageSelectionState.selectedBlocks;
  const firstBlock = blocks[0];
  const lastBlock = blocks[blocks.length - 1];
  const targetBlock = direction.includes('bottom') ? lastBlock : firstBlock;
  // Block selection always use the center of the block
  const rect = targetBlock.getBoundingClientRect();
  const x = rect.x + rect.width / 2;
  const y = direction.includes('bottom') ? rect.bottom : rect.top;
  return { x, y };
}

type CollisionBox = {
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
};

export function calcSafeCoordinate({
  positioningPoint,
  objRect = { width: 0, height: 0 },
  boundaryRect = document.body.getBoundingClientRect(),
  offsetX = 0,
  offsetY = 0,
  edgeGap = 20,
}: CollisionBox) {
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
}

/**
 * Used to compare the space available
 * at the top and bottom of an element within a container.
 *
 * Please give preference to {@link getPopperPosition}
 */
export function compareTopAndBottomSpace(
  obj: { getBoundingClientRect: () => DOMRect },
  container = document.body,
  gap = 20
) {
  const objRect = obj.getBoundingClientRect();
  const spaceRect = container.getBoundingClientRect();
  const topSpace = objRect.top - spaceRect.top;
  const bottomSpace = spaceRect.bottom - objRect.bottom;
  const topOrBottom: 'top' | 'bottom' =
    topSpace > bottomSpace ? 'top' : 'bottom';
  return {
    placement: topOrBottom,
    // the height is the available space.
    height: (topOrBottom === 'top' ? topSpace : bottomSpace) - gap,
  };
}

/**
 * Get the position of the popper element with flip.
 */
export function getPopperPosition(
  popper: {
    getBoundingClientRect: () => DOMRect;
  },
  reference: {
    getBoundingClientRect: () => DOMRect;
  },
  { gap = 12, offsetY = 5 }: { gap?: number; offsetY?: number } = {}
) {
  if (!popper) {
    // foolproof, someone may use element with non-null assertion
    console.warn(
      'The popper element is not exist. Popper position maybe incorrect'
    );
  }
  const { placement, height } = compareTopAndBottomSpace(
    reference,
    document.body,
    gap + offsetY
  );

  const referenceRect = reference.getBoundingClientRect();
  const positioningPoint = {
    x: referenceRect.x,
    y: referenceRect.y + (placement === 'bottom' ? referenceRect.height : 0),
  };

  // TODO maybe use the editor container as the boundary rect to avoid the format bar being covered by other elements
  const boundaryRect = document.body.getBoundingClientRect();
  // Note: the popperRect.height maybe incorrect
  // because we are calculated its correct height
  const popperRect = popper?.getBoundingClientRect();

  const safeCoordinate = calcSafeCoordinate({
    positioningPoint,
    objRect: popperRect,
    boundaryRect,
    offsetY: placement === 'bottom' ? offsetY : -offsetY,
  });

  return {
    placement,
    /**
     * The height is the available space height.
     *
     * Note: it's a max height, not the real height,
     * because sometimes the popper's height is smaller than the available space.
     */
    height,
    x: `${safeCoordinate.x}px`,
    y:
      placement === 'bottom'
        ? `${safeCoordinate.y}px`
        : // We need to use `calc(-100%)` since the height of popper maybe incorrect
          `calc(${safeCoordinate.y}px - 100%)`,
  };
}
