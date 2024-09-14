import type { BlockComponent } from '@blocksuite/block-std';

import { getCurrentNativeRange } from '@blocksuite/affine-shared/utils';
import { Rect } from '@blocksuite/global/utils';

import type { AffineDragHandleWidget } from '../drag-handle.js';

import {
  DRAG_HANDLE_CONTAINER_WIDTH,
  DRAG_HOVER_RECT_PADDING,
} from '../config.js';
import {
  containBlock,
  getDragHandleLeftPadding,
  includeTextSelection,
} from '../utils.js';

export class RectHelper {
  private _getHoveredBlocks = (): BlockComponent[] => {
    if (!this.widget.isHoverDragHandleVisible || !this.widget.anchorBlockId)
      return [];

    const hoverBlock = this.widget.anchorBlockComponent;
    if (!hoverBlock) return [];

    const selections = this.widget.selectedBlocks;
    let blocks: BlockComponent[] = [];

    // When current selection is TextSelection, should cover all the blocks in native range
    if (selections.length > 0 && includeTextSelection(selections)) {
      const range = getCurrentNativeRange();
      if (!range) return [];
      const rangeManager = this.widget.std.range;
      if (!rangeManager) return [];
      blocks = rangeManager.getSelectedBlockComponentsByRange(range, {
        match: el => el.model.role === 'content',
        mode: 'highest',
      });
    } else {
      blocks = this.widget.selectedBlocks
        .map(block => this.widget.std.view.getBlock(block.blockId))
        .filter((block): block is BlockComponent => !!block);
    }

    if (
      containBlock(
        blocks.map(block => block.blockId),
        this.widget.anchorBlockId
      )
    ) {
      return blocks;
    }

    return [hoverBlock];
  };

  getDraggingAreaRect = (block: BlockComponent): Rect => {
    // When hover block is in selected blocks, should show hover rect on the selected blocks
    // Top: the top of the first selected block
    // Left: the left of the first selected block
    // Right: the largest right of the selected blocks
    // Bottom: the bottom of the last selected block
    let { left, top, right, bottom } = block.getBoundingClientRect();

    const blocks = this._getHoveredBlocks();

    blocks.forEach(block => {
      left = Math.min(left, block.getBoundingClientRect().left);
      top = Math.min(top, block.getBoundingClientRect().top);
      right = Math.max(right, block.getBoundingClientRect().right);
      bottom = Math.max(bottom, block.getBoundingClientRect().bottom);
    });

    const offsetLeft = getDragHandleLeftPadding(blocks);

    const offsetParentRect =
      this.widget.dragHandleContainerOffsetParent.getBoundingClientRect();
    if (!offsetParentRect) return new Rect(0, 0, 0, 0);

    left -= offsetParentRect.left;
    right -= offsetParentRect.left;
    top -= offsetParentRect.top;
    bottom -= offsetParentRect.top;

    left /= this.widget.cumulativeParentScale;
    right /= this.widget.cumulativeParentScale;
    top /= this.widget.cumulativeParentScale;
    bottom /= this.widget.cumulativeParentScale;

    // Add padding to hover rect
    left -=
      (DRAG_HANDLE_CONTAINER_WIDTH + offsetLeft) *
      this.widget.scale *
      this.widget.noteScale;
    top -= DRAG_HOVER_RECT_PADDING * this.widget.scale;
    right += DRAG_HOVER_RECT_PADDING * this.widget.scale;
    bottom += DRAG_HOVER_RECT_PADDING * this.widget.scale;

    return new Rect(left, top, right, bottom);
  };

  // Need to consider block padding and scale
  getTopWithBlockComponent = (block: BlockComponent) => {
    const computedStyle = getComputedStyle(block);
    const { top } = block.getBoundingClientRect();
    const paddingTop = parseInt(computedStyle.paddingTop) * this.widget.scale;
    return (
      (top +
        paddingTop -
        this.widget.dragHandleContainerOffsetParent.getBoundingClientRect()
          .top) /
      this.widget.cumulativeParentScale
    );
  };

  constructor(readonly widget: AffineDragHandleWidget) {}
}
