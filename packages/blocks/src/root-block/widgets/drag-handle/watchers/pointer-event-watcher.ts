import { captureEventTarget } from '@blocksuite/affine-shared/utils';
import {
  BLOCK_ID_ATTR,
  type BlockComponent,
  type PointerEventState,
  type UIEventHandler,
} from '@blocksuite/block-std';
import { Point, throttle } from '@blocksuite/global/utils';
import { computed } from '@preact/signals-core';

import type { NoteBlockComponent } from '../../../../note-block/index.js';
import type { EdgelessRootBlockComponent } from '../../../edgeless/index.js';
import type { AffineDragHandleWidget } from '../drag-handle.js';

import {
  DRAG_HANDLE_CONTAINER_WIDTH,
  DRAG_HANDLE_GRABBER_BORDER_RADIUS,
  DRAG_HANDLE_GRABBER_HEIGHT,
  DRAG_HANDLE_GRABBER_WIDTH,
} from '../config.js';
import { AFFINE_DRAG_HANDLE_WIDGET } from '../consts.js';
import {
  getClosestBlockByPoint,
  getClosestNoteBlock,
  getDragHandleContainerHeight,
  includeTextSelection,
  insideDatabaseTable,
  isBlockIdEqual,
  isOutOfNoteBlock,
  updateDragHandleClassName,
} from '../utils.js';

export class PointerEventWatcher {
  private _canEditing = (noteBlock: BlockComponent) => {
    if (noteBlock.doc.id !== this.widget.doc.id) return false;

    if (this.widget.mode === 'page') return true;

    const edgelessRoot = this.widget
      .rootComponent as EdgelessRootBlockComponent;

    const noteBlockId = noteBlock.model.id;
    return (
      edgelessRoot.service.selection.editing &&
      edgelessRoot.service.selection.selectedIds[0] === noteBlockId
    );
  };

  /**
   * When click on drag handle
   * Should select the block and show slash menu if current block is not selected
   * Should clear selection if current block is the first selected block
   */
  private _clickHandler: UIEventHandler = ctx => {
    if (!this.widget.isHoverDragHandleVisible) return;

    const state = ctx.get('pointerState');
    const { target } = state.raw;
    const element = captureEventTarget(target);
    const insideDragHandle = !!element?.closest(AFFINE_DRAG_HANDLE_WIDGET);
    if (!insideDragHandle) return;

    const anchorBlockId = this.widget.anchorBlockId.peek();

    if (!anchorBlockId) return;

    const { selection } = this.widget.std;
    const selectedBlocks = this.widget.selectionHelper.selectedBlocks;

    // Should clear selection if current block is the first selected block
    if (
      selectedBlocks.length > 0 &&
      !includeTextSelection(selectedBlocks) &&
      selectedBlocks[0].blockId === anchorBlockId
    ) {
      selection.clear(['block']);
      this.widget.dragHoverRect = null;
      this.showDragHandleOnHoverBlock();
      return;
    }

    // Should select the block if current block is not selected
    const block = this.widget.anchorBlockComponent.peek();
    if (!block) return;

    if (selectedBlocks.length > 1) {
      this.showDragHandleOnHoverBlock();
    }

    this.widget.selectionHelper.setSelectedBlocks([block]);
  };

  private _containerStyle = computed(() => {
    const draggingAreaRect = this.widget.draggingAreaRect.value;
    if (!draggingAreaRect) return null;

    const block = this.widget.anchorBlockComponent.value;
    if (!block) return null;

    const containerHeight = getDragHandleContainerHeight(block.model);

    const posTop = this._getTopWithBlockComponent(block);

    const scaleInNote = this.widget.scaleInNote.value;

    const rowPaddingY =
      ((containerHeight - DRAG_HANDLE_GRABBER_HEIGHT) / 2) * scaleInNote;

    // use padding to control grabber's height
    const paddingTop = rowPaddingY + posTop - draggingAreaRect.top;
    const paddingBottom =
      draggingAreaRect.height -
      paddingTop -
      DRAG_HANDLE_GRABBER_HEIGHT * scaleInNote;

    return {
      paddingTop: `${paddingTop}px`,
      paddingBottom: `${paddingBottom}px`,
      width: `${DRAG_HANDLE_CONTAINER_WIDTH * scaleInNote}px`,
      left: `${draggingAreaRect.left}px`,
      top: `${draggingAreaRect.top}px`,
      height: `${draggingAreaRect.height}px`,
    };
  });

  // Need to consider block padding and scale
  private _getTopWithBlockComponent = (block: BlockComponent) => {
    const computedStyle = getComputedStyle(block);
    const { top } = block.getBoundingClientRect();
    const paddingTop =
      parseInt(computedStyle.paddingTop) * this.widget.scale.peek();
    return (
      top +
      paddingTop -
      this.widget.dragHandleContainerOffsetParent.getBoundingClientRect().top
    );
  };

  private _grabberStyle = computed(() => {
    const scaleInNote = this.widget.scaleInNote.value;
    return {
      width: `${DRAG_HANDLE_GRABBER_WIDTH * scaleInNote}px`,
      borderRadius: `${DRAG_HANDLE_GRABBER_BORDER_RADIUS * scaleInNote}px`,
    };
  });

  private _lastHoveredBlockId: string | null = null;

  private _lastShowedBlock: { id: string; el: BlockComponent } | null = null;

  /**
   * When pointer move on block, should show drag handle
   * And update hover block id and path
   */
  private _pointerMoveOnBlock = (state: PointerEventState) => {
    if (this.widget.isTopLevelDragHandleVisible) return;

    const point = new Point(state.raw.x, state.raw.y);
    const closestBlock = getClosestBlockByPoint(
      this.widget.host,
      this.widget.rootComponent,
      point
    );
    if (!closestBlock) {
      this.widget.anchorBlockId.value = null;
      return;
    }

    const blockId = closestBlock.getAttribute(BLOCK_ID_ATTR);
    if (!blockId) return;

    this.widget.anchorBlockId.value = blockId;

    if (insideDatabaseTable(closestBlock) || this.widget.doc.readonly) {
      this.widget.hide();
      return;
    }

    // If current block is not the last hovered block, show drag handle beside the hovered block
    if (
      (!this._lastHoveredBlockId ||
        !isBlockIdEqual(
          this.widget.anchorBlockId.peek(),
          this._lastHoveredBlockId
        ) ||
        !this.widget.isHoverDragHandleVisible) &&
      !this.widget.isDragHandleHovered
    ) {
      this.showDragHandleOnHoverBlock();
      this._lastHoveredBlockId = this.widget.anchorBlockId.peek();
    }
  };

  private _pointerOutHandler: UIEventHandler = ctx => {
    const state = ctx.get('pointerState');
    state.raw.preventDefault();

    const { target } = state.raw;
    const element = captureEventTarget(target);
    if (!element) return;

    const { relatedTarget } = state.raw;
    // TODO: when pointer out of page viewport, should hide drag handle
    // But the pointer out event is not as expected
    // Need to be optimized
    const relatedElement = captureEventTarget(relatedTarget);
    const outOfPageViewPort = element.classList.contains(
      'affine-page-viewport'
    );
    const inPage = !!relatedElement?.closest('.affine-page-viewport');

    const inDragHandle = !!relatedElement?.closest(AFFINE_DRAG_HANDLE_WIDGET);
    if (outOfPageViewPort && !inDragHandle && !inPage) {
      this.widget.hide();
    }
  };

  private _throttledPointerMoveHandler = throttle<UIEventHandler>(ctx => {
    if (
      this.widget.doc.readonly ||
      this.widget.dragging ||
      !this.widget.isConnected
    ) {
      this.widget.hide();
      return;
    }
    if (this.widget.isTopLevelDragHandleVisible) return;

    const state = ctx.get('pointerState');
    const { target } = state.raw;
    const element = captureEventTarget(target);
    // When pointer not on block or on dragging, should do nothing
    if (!element) return;

    // When pointer on drag handle, should do nothing
    if (element.closest('.affine-drag-handle-container')) return;

    // When pointer out of note block hover area or inside database, should hide drag handle
    const point = new Point(state.raw.x, state.raw.y);

    const closestNoteBlock = getClosestNoteBlock(
      this.widget.host,
      this.widget.rootComponent,
      point
    ) as NoteBlockComponent | null;

    this.widget.noteScale.value =
      this.widget.mode === 'page'
        ? 1
        : (closestNoteBlock?.model.edgeless.scale ?? 1);

    if (
      closestNoteBlock &&
      this._canEditing(closestNoteBlock) &&
      !isOutOfNoteBlock(
        this.widget.host,
        closestNoteBlock,
        point,
        this.widget.scaleInNote.peek()
      )
    ) {
      this._pointerMoveOnBlock(state);
      return true;
    }

    this.widget.hide();
    return false;
  }, 1000 / 60);

  // Multiple blocks: drag handle should show on the vertical middle of all blocks
  showDragHandleOnHoverBlock = () => {
    const block = this.widget.anchorBlockComponent.peek();
    if (!block) return;

    const container = this.widget.dragHandleContainer;
    const grabber = this.widget.dragHandleGrabber;
    if (!container || !grabber) return;

    this.widget.isHoverDragHandleVisible = true;

    const draggingAreaRect = this.widget.draggingAreaRect.peek();
    if (!draggingAreaRect) return;

    // Ad-hoc solution for list with toggle icon
    updateDragHandleClassName([block]);
    // End of ad-hoc solution

    const applyStyle = (transition?: boolean) => {
      const containerStyle = this._containerStyle.value;
      if (!containerStyle) return;

      container.style.transition = transition ? 'padding 0.25s ease' : 'none';
      Object.assign(container.style, containerStyle);

      container.style.display = 'flex';
    };

    if (isBlockIdEqual(block.blockId, this._lastShowedBlock?.id)) {
      applyStyle(true);
    } else if (this.widget.selectionHelper.selectedBlocks.length) {
      if (this.widget.selectionHelper.isBlockSelected(block))
        applyStyle(
          this.widget.isDragHandleHovered &&
            this.widget.selectionHelper.isBlockSelected(
              this._lastShowedBlock?.el
            )
        );
      else applyStyle(false);
    } else {
      applyStyle(false);
    }

    const grabberStyle = this._grabberStyle.value;
    Object.assign(grabber.style, grabberStyle);

    this.widget.handleAnchorModelDisposables();
    if (!isBlockIdEqual(block.blockId, this._lastShowedBlock?.id)) {
      this._lastShowedBlock = {
        id: block.blockId,
        el: block,
      };
    }
  };

  constructor(readonly widget: AffineDragHandleWidget) {}

  reset() {
    this._lastHoveredBlockId = null;
    this._lastShowedBlock = null;
  }

  watch() {
    this.widget.disposables.addFromEvent(this.widget, 'pointerdown', e => {
      e.preventDefault();
    });

    this.widget.handleEvent('click', this._clickHandler);
    this.widget.handleEvent('pointerMove', this._throttledPointerMoveHandler);
    this.widget.handleEvent('pointerOut', this._pointerOutHandler);
  }
}
