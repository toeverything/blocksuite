import {
  PathFinder,
  type PointerEventState,
  type UIEventHandler,
  type UIEventStateContext,
} from '@blocksuite/block-std';
import { assertExists, DisposableGroup } from '@blocksuite/global/utils';
import type { BlockElement } from '@blocksuite/lit';
import { WidgetElement } from '@blocksuite/lit';
import type { BaseBlockModel } from '@blocksuite/store';
import { html, render } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import {
  calcDropTarget,
  findClosestBlockElement,
  getBlockElementByModel,
  getBlockElementsExcludeSubtrees,
  getClosestBlockElementByPoint,
  getHoveringNote,
  getModelByBlockElement,
  isEdgelessPage,
  isPageMode,
  matchFlavours,
  Point,
  Rect,
} from '../../__internal__/index.js';
import { DocPageBlockComponent } from '../../page-block/doc/doc-page-block.js';
import type { EdgelessPageBlockComponent } from '../../page-block/edgeless/edgeless-page-block.js';
import { autoScroll } from '../../page-block/text-selection/utils.js';
import {
  DRAG_HANDLE_GRABBER_BORDER_RADIUS,
  DRAG_HANDLE_GRABBER_HEIGHT,
  DRAG_HANDLE_GRABBER_WIDTH,
  DRAG_HANDLE_OFFSET_LEFT,
  DRAG_HOVER_RECT_PADDING,
  type DropIndicator,
  HOVER_DRAG_HANDLE_GRABBER_WIDTH,
  type IndicatorRect,
  NOTE_CONTAINER_PADDING,
} from './config.js';
import { DragPreview } from './drag-preview.js';
import { DRAG_HANDLE_WIDTH, styles } from './styles.js';
import {
  captureEventTarget,
  containBlock,
  containChildBlock,
  getDragHandleContainerHeight,
  getNoteId,
  includeTextSelection,
  insideDatabaseTable,
  isBlockPathEqual,
} from './utils.js';

@customElement('affine-drag-handle-widget')
export class DragHandleWidget extends WidgetElement {
  static override styles = styles;

  @query('.affine-drag-handle-container')
  private _dragHandleContainer!: HTMLDivElement;

  @query('.affine-drag-handle-grabber')
  private _dragHandleGrabber!: HTMLDivElement;

  @state()
  private _indicatorRect: IndicatorRect | null = null;

  @state()
  private _dragHoverRect: {
    width: number;
    height: number;
    left: number;
    top: number;
  } | null = null;

  private _hoveredBlockId = '';
  private _hoveredBlockPath: string[] | null = null;
  private _lastHoveredBlockPath: string[] | null = null;
  private _lastShowedBlock: { path: string[]; el: BlockElement } | null = null;
  private _hoverDragHandle = false;
  private _dragHandlePointerDown = false;
  private _dropBlockId = '';
  private _dropBefore = false;

  private _scale = 1;

  private _draggingElements: BlockElement[] = [];
  private _dragging = false;
  private _dragPreviewOffsetY = 0;
  private _dragPreview: DragPreview | null = null;

  private _rafID = 0;
  private _anchorModelDisposables: DisposableGroup | null = null;
  private _lastDragPointerState: PointerEventState | null = null;

  protected get _selectedBlocks() {
    return this.root.selection.find('text')
      ? this.root.selection.filter('text')
      : this.root.selection.filter('block');
  }

  private _handleAnchorModelDisposables(blockElement: BlockElement) {
    if (this._anchorModelDisposables) {
      this._anchorModelDisposables.dispose();
      this._anchorModelDisposables = null;
    }

    this._anchorModelDisposables = new DisposableGroup();
    this._anchorModelDisposables.add(
      blockElement.model.propsUpdated.on(() => this._hide())
    );

    this._anchorModelDisposables.add(
      blockElement.model.deleted.on(() => this._hide())
    );
  }

  private _getBlockElementFromViewStore(path: string[]) {
    return this.root.view.viewFromPath('block', path);
  }

  private get _viewportOffset() {
    if (!isPageMode(this.page)) {
      const pageBlock = this.pageElement as EdgelessPageBlockComponent;
      return {
        left: -pageBlock.surface.viewport.left,
        top: -pageBlock.surface.viewport.top,
      };
    } else {
      const pageBlock = this.pageElement as DocPageBlockComponent;
      return {
        left: pageBlock.viewport.scrollLeft - pageBlock.viewport.left,
        top: pageBlock.viewport.scrollTop - pageBlock.viewport.top,
      };
    }
  }

  // Need to consider block padding and scale
  private _getTopWithBlockElement(blockElement: BlockElement) {
    const computedStyle = getComputedStyle(blockElement);
    const { top } = blockElement.getBoundingClientRect();
    const paddingTop = parseInt(computedStyle.paddingTop) * this._scale;
    return top + paddingTop + this._viewportOffset.top;
  }

  private _hide(force = false) {
    if (!this._dragHandleContainer) return;

    this._hoverDragHandle = false;
    if (this._dragHandleContainer.style.display !== 'none')
      this._dragHandleContainer.style.display = 'none';

    if (force) this._reset();
  }

  private _reset() {
    this._dragging = false;
    this._indicatorRect = null;
    this._dragHoverRect = null;
    this._hoveredBlockId = '';
    this._hoveredBlockPath = null;
    this._lastHoveredBlockPath = null;
    this._lastShowedBlock = null;
    this._hoverDragHandle = false;
    this._dragHandlePointerDown = false;
    this._draggingElements = [];
    this._dropBlockId = '';
    this._dropBefore = false;
    this._dragPreviewOffsetY = 0;
    this._rafID = 0;
    this._lastDragPointerState = null;
  }

  private _clearRaf() {
    if (this._rafID) {
      cancelAnimationFrame(this._rafID);
      this._rafID = 0;
    }
  }

  private _resetDragHandleGrabber() {
    this._dragHandleGrabber.style.width = `${
      DRAG_HANDLE_GRABBER_WIDTH * this._scale
    }px`;
    this._dragHandleGrabber.style.borderRadius = `${
      DRAG_HANDLE_GRABBER_BORDER_RADIUS * this._scale
    }px`;
  }

  // Single block: drag handle should show on the vertical middle of the first line of element
  // Multiple blocks: drag handle should show on the vertical middle of all blocks
  private _show(blockElement: BlockElement) {
    const container = this._dragHandleContainer;
    const grabber = this._dragHandleGrabber;
    if (!container || !grabber) return;

    let { left } = blockElement.getBoundingClientRect();
    const draggingAreaRect = this._getDraggingAreaRect(blockElement);
    if (!draggingAreaRect) return;

    // Some blocks have padding, should consider padding when calculating position
    const computedStyle = getComputedStyle(blockElement);
    const paddingLeft = parseInt(computedStyle.paddingLeft) * this._scale;
    left += paddingLeft;

    const containerHeight = getDragHandleContainerHeight(blockElement.model);

    const posLeft =
      left -
      (DRAG_HANDLE_WIDTH + DRAG_HANDLE_OFFSET_LEFT) * this._scale +
      this._viewportOffset.left;
    const posTop = this._getTopWithBlockElement(blockElement);

    const rowPaddingY =
      ((containerHeight - DRAG_HANDLE_GRABBER_HEIGHT) / 2) * this._scale;

    // use padding to control grabber's height
    const paddingTop = rowPaddingY + posTop - draggingAreaRect.top;
    const paddingBottom =
      draggingAreaRect.height -
      paddingTop -
      DRAG_HANDLE_GRABBER_HEIGHT * this._scale;

    const applyStyle = (transition?: boolean) => {
      container.style.transition = transition ? 'padding 0.25s ease' : 'none';
      container.style.paddingTop = `${paddingTop}px`;
      container.style.paddingBottom = `${paddingBottom}px`;
      container.style.width = `${DRAG_HANDLE_WIDTH * this._scale}px`;
      container.style.left = `${posLeft}px`;
      container.style.top = `${draggingAreaRect.top}px`;
      container.style.display = 'flex';
      container.style.height = `${draggingAreaRect.height}px`;
    };

    if (isBlockPathEqual(blockElement.path, this._lastShowedBlock?.path)) {
      applyStyle(true);
    } else if (this._selectedBlocks.length) {
      if (this._isBlockSelected(blockElement))
        applyStyle(
          this._hoverDragHandle &&
            this._isBlockSelected(this._lastShowedBlock?.el)
        );
      else applyStyle(false);
    } else {
      applyStyle(false);
    }

    this._resetDragHandleGrabber();
    this._handleAnchorModelDisposables(blockElement);
    if (!isBlockPathEqual(blockElement.path, this._lastShowedBlock?.path)) {
      this._lastShowedBlock = {
        path: blockElement.path,
        el: blockElement,
      };
    }
  }

  /** Check if given blockElement is selected */
  private _isBlockSelected(block?: BlockElement) {
    if (!block) return false;
    return this._selectedBlocks.some(
      selection => selection.blockId === block.model.id
    );
  }

  private _showDragHandleOnHoverBlock(blockPath: string[]) {
    const blockElement = this._getBlockElementFromViewStore(blockPath);

    assertExists(blockElement);
    this._show(blockElement);
  }

  private _getDraggingAreaRect(blockElement: BlockElement) {
    if (!this._hoveredBlockPath) return;

    const selections = this._selectedBlocks;
    // When hover block is in selected blocks, should show hover rect on the selected blocks
    // Top: the top of the first selected block
    // Left: the left of the first selected block
    // Right: the largest right of the selected blocks
    // Bottom: the bottom of the last selected block
    let { left, top, right, bottom } = blockElement.getBoundingClientRect();

    // When current selection is TextSelection, should cover all the blocks in native range
    if (selections.length > 0 && includeTextSelection(selections)) {
      const nativeSelection = document.getSelection();
      if (nativeSelection && nativeSelection.rangeCount > 0) {
        const range = nativeSelection.getRangeAt(0);
        const blockElements =
          this._rangeManager.getSelectedBlockElementsByRange(range, {
            match: el => el.model.role === 'content',
            mode: 'highest',
          });

        if (
          containBlock(
            blockElements.map(block => PathFinder.id(block.path)),
            PathFinder.id(this._hoveredBlockPath)
          )
        ) {
          blockElements.forEach(blockElement => {
            left = Math.min(left, blockElement.getBoundingClientRect().left);
            top = Math.min(top, blockElement.getBoundingClientRect().top);
            right = Math.max(right, blockElement.getBoundingClientRect().right);
            bottom = Math.max(
              bottom,
              blockElement.getBoundingClientRect().bottom
            );
          });
        }
      }
    } else if (
      containBlock(
        selections.map(selection => selection.blockId),
        PathFinder.id(this._hoveredBlockPath)
      )
    ) {
      this._selectedBlocks.forEach(block => {
        const blockElement = this.root.view.viewFromPath(
          'block',
          block.path as string[]
        );
        if (!blockElement) return;
        left = Math.min(left, blockElement.getBoundingClientRect().left);
        top = Math.min(top, blockElement.getBoundingClientRect().top);
        right = Math.max(right, blockElement.getBoundingClientRect().right);
        bottom = Math.max(bottom, blockElement.getBoundingClientRect().bottom);
      });
    }

    // Add padding to hover rect
    left -= (DRAG_HANDLE_WIDTH + DRAG_HANDLE_OFFSET_LEFT) * this._scale;
    top -= DRAG_HOVER_RECT_PADDING * this._scale;
    right += DRAG_HOVER_RECT_PADDING * this._scale;
    bottom += DRAG_HOVER_RECT_PADDING * this._scale;

    left += this._viewportOffset.left;
    right += this._viewportOffset.left;
    top += this._viewportOffset.top;
    bottom += this._viewportOffset.top;

    return new Rect(left, top, right, bottom);
  }

  private _setSelectedBlocks(blockElements: BlockElement[], noteId?: string) {
    const { selection } = this.root;
    const selections = blockElements.map(blockElement =>
      selection.getInstance('block', {
        path: blockElement.path,
      })
    );

    // When current page is edgeless page
    // We need to remain surface selection and set editing as true
    if (isEdgelessPage(this._pageBlockElement)) {
      const surfaceElementId = noteId ? noteId : getNoteId(blockElements[0]);
      const surfaceSelection = selection.getInstance(
        'surface',
        [surfaceElementId],
        true
      );

      selections.push(surfaceSelection);
    }

    selection.set(selections);
  }

  private get _pageBlockElement() {
    const pageElement = this.pageElement;
    const pageBlock = isPageMode(this.page)
      ? (pageElement as DocPageBlockComponent)
      : (pageElement as EdgelessPageBlockComponent);
    assertExists(pageBlock);

    return pageBlock;
  }

  private get _rangeManager() {
    assertExists(this.root.rangeManager);
    return this.root.rangeManager;
  }

  private _getClosestBlockElementByPoint(point: Point) {
    const closestNoteBlock = this._getClosestNoteBlock(point);
    if (!closestNoteBlock) return null;
    const noteRect = Rect.fromDOM(closestNoteBlock);
    const blockElement = getClosestBlockElementByPoint(point, {
      container: closestNoteBlock,
      rect: noteRect,
    });
    const blockSelector =
      '.affine-note-block-container > .affine-block-children-container > [data-block-id]';
    const closestBlockElement = (
      blockElement
        ? blockElement
        : findClosestBlockElement(
            closestNoteBlock as BlockElement,
            point.clone(),
            blockSelector
          )
    ) as BlockElement;
    return closestBlockElement;
  }

  private _calculatePreviewOffsetY(
    blockElements: BlockElement[],
    hoverBlockElement: BlockElement
  ) {
    let offsetY = 0;
    for (let i = 0; i < blockElements.length; i++) {
      if (PathFinder.equals(blockElements[i].path, hoverBlockElement.path)) {
        break;
      }
      offsetY += blockElements[i].getBoundingClientRect().height;
    }

    return offsetY;
  }

  private _createDragPreview(
    blockElements: BlockElement[],
    hoverBlockElement: BlockElement
  ) {
    if (!this._dragPreview) this._dragPreview = new DragPreview();

    const fragment = document.createDocumentFragment();
    blockElements.forEach(element => {
      const container = document.createElement('div');
      container.classList.add('affine-block-element');
      render(element.render(), container);
      container.querySelector('.selected')?.classList.remove('selected');
      fragment.appendChild(container);
    });

    const { left, top, width } = hoverBlockElement.getBoundingClientRect();
    this._dragPreviewOffsetY = this._calculatePreviewOffsetY(
      blockElements,
      hoverBlockElement
    );
    const posX = left;
    const posY = top - this._dragPreviewOffsetY;
    this._dragPreview.style.width = `${width / this._scale}px`;
    this._dragPreview.style.transform = `translate(${posX}px, ${posY}px) scale(${this._scale})`;
    this._dragPreview.classList.add('grabbing');
    this._dragPreview.style.display = 'block';

    this._dragPreview.appendChild(fragment);
    this._pageBlockElement.appendChild(this._dragPreview);
  }

  private _removeDragPreview() {
    if (this._dragPreview) {
      this._dragPreview.remove();
      this._dragPreview = null;
    }
  }

  private _removeHoverRect() {
    this._dragHoverRect = null;
    this._dragHandlePointerDown = false;
  }

  private _updateDragPreviewPosition(dragPreview: DragPreview, point: Point) {
    const posX = point.x;
    const posY = point.y - this._dragPreviewOffsetY;

    dragPreview.style.transform = `translate(${posX}px, ${posY}px) scale(${this._scale})`;
  }

  private _canEditing = (noteBlock: BlockElement) => {
    if (isPageMode(this.page)) return true;
    const edgelessPage = this._pageBlockElement as EdgelessPageBlockComponent;
    const noteBlockId = noteBlock.path[noteBlock.path.length - 1];
    return (
      edgelessPage.selectionManager.editing &&
      edgelessPage.selectionManager.state.elements[0] === noteBlockId
    );
  };

  private _getClosestNoteBlock = (point: Point) => {
    return isPageMode(this.page)
      ? findClosestBlockElement(this._pageBlockElement, point, 'affine-note')
      : getHoveringNote(point)?.querySelector('affine-note');
  };

  private _getContainerOffsetPoint = (state: PointerEventState) => {
    const x = state.point.x + state.containerOffset.x;
    const y = state.point.y + state.containerOffset.y;
    return new Point(x, y);
  };

  private _outOfNoteBlock = (noteBlock: Element, point: Point) => {
    // TODO: need to find a better way to check if the point is out of note block
    const rect = noteBlock.getBoundingClientRect();
    const padding = NOTE_CONTAINER_PADDING * this._scale;
    return rect
      ? isPageMode(this.page)
        ? point.y < rect.top ||
          point.y > rect.bottom ||
          point.x > rect.right + padding
        : point.y < rect.top ||
          point.y > rect.bottom ||
          point.x < rect.left - padding ||
          point.x > rect.right + padding
      : true;
  };

  /**
   * When dragging, should update indicator position and target drop block id
   */
  private _getDropIndicator = (
    state: PointerEventState
  ): DropIndicator | null => {
    let dropIndicator = null;
    const point = this._getContainerOffsetPoint(state);
    const closestBlockElement = this._getClosestBlockElementByPoint(point);
    if (!closestBlockElement) {
      return dropIndicator;
    }

    const blockId = closestBlockElement.model.id;
    const blockPath = closestBlockElement.path;
    assertExists(blockId);
    assertExists(blockPath);

    // Should make sure that target drop block is
    // neither within the selected block
    // nor a child-block of any selected block
    if (
      containBlock(
        this._selectedBlocks.map(selection => selection.blockId),
        blockId
      ) ||
      containChildBlock(this._selectedBlocks, blockPath)
    ) {
      return dropIndicator;
    }

    this._dropBlockId = blockId;

    let rect = null;
    let targetElement = null;
    const model = closestBlockElement.model;

    // Handle special case at this iteration
    // TODO: should consider drop in database next iteration
    const isDatabase = matchFlavours(model, ['affine:database'] as const);
    if (isDatabase) {
      return dropIndicator;
    }

    const result = calcDropTarget(
      point,
      model,
      closestBlockElement,
      this._draggingElements,
      this._scale
    );

    if (result) {
      rect = result.rect;
      targetElement = result.modelState.element;
      this._dropBefore = result.type === 'before' ? true : false;
    }

    if (targetElement) {
      const targetBlockId = targetElement.getAttribute(this.root.blockIdAttr);
      if (targetBlockId) this._dropBlockId = targetBlockId;
    }

    dropIndicator = {
      rect,
      dropBlockId: this._dropBlockId,
      dropBefore: this._dropBefore,
    };

    return dropIndicator;
  };

  private _updateDropIndicator = (indicator: DropIndicator | null) => {
    this._dropBlockId = indicator?.dropBlockId ?? '';
    this._dropBefore = indicator?.dropBefore ?? false;
    this._indicatorRect = indicator?.rect ?? null;
  };

  private _updateIndicator = (
    state: PointerEventState,
    shouldAutoScroll: boolean
  ) => {
    const point = this._getContainerOffsetPoint(state);
    const closestNoteBlock = this._getClosestNoteBlock(point);
    if (!closestNoteBlock || this._outOfNoteBlock(closestNoteBlock, point)) {
      this._dropBlockId = '';
      this._indicatorRect = null;
    } else {
      const dropIndicator = this._getDropIndicator(state);
      this._updateDropIndicator(dropIndicator);
    }

    const previewPos = new Point(state.x, state.y);
    if (this._dragPreview)
      this._updateDragPreviewPosition(this._dragPreview, previewPos);

    this._lastDragPointerState = state;
    if (this._pageBlockElement instanceof DocPageBlockComponent) {
      if (!shouldAutoScroll) return;

      const result = autoScroll(
        this._pageBlockElement.viewportElement,
        state.y
      );
      if (!result) {
        this._clearRaf();
        return;
      }
      this._rafID = requestAnimationFrame(() =>
        this._updateIndicator(state, true)
      );
    } else {
      this._clearRaf();
    }
  };

  private _scrollToUpdateIndicator = () => {
    if (
      !this._dragging ||
      this._draggingElements.length === 0 ||
      !this._lastDragPointerState
    )
      return;

    const state = this._lastDragPointerState;
    this._rafID = requestAnimationFrame(() =>
      this._updateIndicator(state, false)
    );
  };

  /**
   * When pointer move on block, should show drag handle
   * And update hover block id and path
   */
  private _pointerMoveOnBlock = (ctx: UIEventStateContext) => {
    const state = ctx.get('pointerState');
    const point = this._getContainerOffsetPoint(state);
    const closestBlockElement = this._getClosestBlockElementByPoint(point);
    if (!closestBlockElement) {
      this._hoveredBlockId = '';
      this._hoveredBlockPath = null;
      return;
    }

    const blockId = closestBlockElement.getAttribute(this.root.blockIdAttr);
    const blockPath = closestBlockElement.path;
    assertExists(blockId);
    assertExists(blockPath);

    this._hoveredBlockId = blockId;
    this._hoveredBlockPath = blockPath;

    if (insideDatabaseTable(closestBlockElement) || this.page.readonly) {
      this._hide();
      return;
    }

    // If current block is not the last hovered block, show drag handle beside the hovered block
    if (
      (!this._lastHoveredBlockPath ||
        this._hoveredBlockPath.join('|') !==
          this._lastHoveredBlockPath?.join('|') ||
        this._dragHandleContainer.style.display === 'none') &&
      !this._hoverDragHandle
    ) {
      this._show(closestBlockElement);
      this._lastHoveredBlockPath = this._hoveredBlockPath;
    }
  };

  private _pointerMoveHandler: UIEventHandler = ctx => {
    const state = ctx.get('pointerState');

    const { target } = state.raw;
    const element = captureEventTarget(target);
    // WHen pointer not on block or on dragging, should do nothing
    if (!element || this._dragging) {
      return;
    }

    // When pointer on drag handle, should do nothing
    if (element.closest('.affine-drag-handle-container')) {
      return;
    }

    // TODO: need to optimize
    // When pointer out of note block hover area or inside database, should hide drag handle
    const point = this._getContainerOffsetPoint(state);
    const closestNoteBlock = this._getClosestNoteBlock(point);
    if (
      !closestNoteBlock ||
      !this._canEditing(closestNoteBlock as BlockElement) ||
      this._outOfNoteBlock(closestNoteBlock, point)
    ) {
      this._hide();
      return;
    }

    this._pointerMoveOnBlock(ctx);
    return true;
  };

  /**
   * When click on drag handle
   * Should select the block and show slash menu if current block is not selected
   * Should clear selection if current block is the first selected block
   */
  private _clickHandler: UIEventHandler = ctx => {
    const state = ctx.get('pointerState');
    const { target } = state.raw;
    const element = captureEventTarget(target);
    if (
      !element ||
      !element.closest('affine-drag-handle-widget') ||
      !this._hoveredBlockId ||
      !this._hoveredBlockPath
    ) {
      return;
    }

    const { selection } = this.root;
    const selectedBlocks = this._selectedBlocks;

    // Should clear selection if current block is the first selected block
    if (
      selectedBlocks.length > 0 &&
      !includeTextSelection(selectedBlocks) &&
      selectedBlocks[0].blockId === this._hoveredBlockId
    ) {
      selection.clear(['block']);
      this._dragHoverRect = null;
      this._showDragHandleOnHoverBlock(this._hoveredBlockPath);
      return;
    }

    // Should select the block if current block is not selected
    const blockElement = this.root.view.viewFromPath(
      'block',
      this._hoveredBlockPath
    );

    assertExists(blockElement);
    if (selectedBlocks.length > 1) this._show(blockElement);
    this._setSelectedBlocks([blockElement]);

    return true;
  };

  /**
   * When start dragging, should set dragging elements and create drag preview
   */
  private _dragStartHandler: UIEventHandler = ctx => {
    const state = ctx.get('pointerState');
    const event = state.raw;
    const { target, button } = event;
    const element = captureEventTarget(target);
    const inside = !!element?.closest('affine-drag-handle-widget');
    // Should only start dragging when pointer down on drag handle
    // And current mouse button is left button
    if (
      button !== 0 ||
      !inside ||
      !this._hoveredBlockId ||
      !this._hoveredBlockPath
    ) {
      return;
    }

    // Get current hover block element by path
    const hoverBlockElement = this.root.view.viewFromPath(
      'block',
      this._hoveredBlockPath
    );
    if (!hoverBlockElement) {
      return;
    }

    let selections = this._selectedBlocks;

    // When current selection is TextSelection
    // Should set BlockSelection for the blocks in native range
    if (selections.length > 0 && includeTextSelection(selections)) {
      const nativeSelection = document.getSelection();
      if (nativeSelection && nativeSelection.rangeCount > 0) {
        const range = nativeSelection.getRangeAt(0);
        const blockElements =
          this._rangeManager.getSelectedBlockElementsByRange(range, {
            match: el => el.model.role === 'content',
            mode: 'highest',
          });
        this._setSelectedBlocks(blockElements);
        selections = this._selectedBlocks;
      }
    }

    // When there is no selected blocks
    // Or selected blocks not including current hover block
    // Set current hover block as selected
    if (
      selections.length === 0 ||
      !containBlock(
        selections.map(selection => selection.blockId),
        this._hoveredBlockId
      )
    ) {
      const blockElement = this.root.view.viewFromPath(
        'block',
        this._hoveredBlockPath
      );
      assertExists(blockElement);

      this._setSelectedBlocks([blockElement]);
    }

    const blockElements = this._selectedBlocks
      .map(selection => {
        return this.root.view.viewFromPath('block', selection.path as string[]);
      })
      .filter((element): element is BlockElement<BaseBlockModel> => !!element);

    // This could be skip if we can ensure that all selected blocks are on the same level
    // Which means not selecting parent block and child block at the same time
    const blockElementsExcludingChildren = getBlockElementsExcludeSubtrees(
      blockElements
    ) as BlockElement[];

    this._createDragPreview(blockElementsExcludingChildren, hoverBlockElement);
    this._draggingElements = blockElementsExcludingChildren;
    this._dragging = true;
    this._hide();

    return true;
  };

  /**
   * When dragging, should:
   * Update drag preview position
   * Update indicator position
   * Update drop block id
   */
  private _dragMoveHandler: UIEventHandler = ctx => {
    if (!this._dragging || this._draggingElements.length === 0) {
      return;
    }

    this._clearRaf();
    ctx.get('defaultState').event.preventDefault();
    const state = ctx.get('pointerState');
    this._rafID = requestAnimationFrame(() =>
      this._updateIndicator(state, true)
    );

    return true;
  };

  /**
   * When drag end, should move blocks to drop position
   * @returns
   */
  private _dragEndHandler: UIEventHandler = () => {
    this._clearRaf();
    this._removeDragPreview();
    if (!this._dragging || this._draggingElements.length === 0) {
      this._hide(true);
      return;
    }

    const targetBlockId = this._dropBlockId;
    const shouldInsertBefore = this._dropBefore;
    const draggingElements = this._draggingElements;

    this._hide(true);
    if (!targetBlockId) return;

    // Should make sure drop block id is not in selected blocks
    if (
      containBlock(
        this._selectedBlocks.map(selection => selection.blockId),
        targetBlockId
      )
    ) {
      return;
    }

    const selectedBlocks = getBlockElementsExcludeSubtrees(draggingElements)
      .map(element => getModelByBlockElement(element))
      .filter((x): x is BaseBlockModel => !!x);
    const targetBlock = this.page.getBlockById(targetBlockId);
    const parent = this.page.getParent(targetBlockId);
    if (targetBlock && parent && selectedBlocks.length > 0) {
      this.page.moveBlocks(
        selectedBlocks,
        parent,
        targetBlock,
        shouldInsertBefore
      );
    }

    // TODO: need a better way to update selection
    // Should update selection after moving blocks
    // In doc page mode, update selected blocks
    // In edgeless mode, focus on the first block
    setTimeout(() => {
      assertExists(parent);
      // Need to update selection when moving blocks successfully
      // Because the block path may be changed after moving
      const parentElement = getBlockElementByModel(parent);
      if (parentElement) {
        const newSelectedBlocks = selectedBlocks
          .map(block => parentElement.path.concat(block.id))
          .map(path => this.root.view.viewFromPath('block', path));

        if (!newSelectedBlocks) return;

        const noteId = getNoteId(parentElement);
        this._setSelectedBlocks(newSelectedBlocks as BlockElement[], noteId);
      }
    }, 0);

    return true;
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
    const outOfPageViewPort = element.classList.contains('affine-doc-viewport');
    const inPage = !!relatedElement?.closest('.affine-doc-viewport');

    const inDragHandle = !!relatedElement?.closest('affine-drag-handle-widget');
    if (outOfPageViewPort && !inDragHandle && !inPage) {
      this._hide();
    }
  };

  override firstUpdated() {
    this._hide(true);

    // When pointer enter drag handle grabber
    // Extend drag handle grabber to the height of the hovered block
    this._disposables.addFromEvent(
      this._dragHandleContainer,
      'pointerenter',
      () => {
        if (!this._hoveredBlockPath || !this._dragHandleGrabber) return;

        const blockElement = this._getBlockElementFromViewStore(
          this._hoveredBlockPath
        );
        if (!blockElement) return;

        const draggingAreaRect = this._getDraggingAreaRect(blockElement);
        if (!draggingAreaRect) return;

        const padding = 8 * this._scale;
        this._dragHandleContainer.style.paddingTop = `${padding}px`;
        this._dragHandleContainer.style.paddingBottom = `${padding}px`;
        this._dragHandleContainer.style.transition = `padding 0.25s ease`;

        this._dragHandleGrabber.style.width = `${
          HOVER_DRAG_HANDLE_GRABBER_WIDTH * this._scale
        }px`;
        this._dragHandleGrabber.style.borderRadius = `${
          DRAG_HANDLE_GRABBER_BORDER_RADIUS * this._scale
        }px`;

        this._hoverDragHandle = true;
      }
    );

    this._disposables.addFromEvent(
      this._dragHandleContainer,
      'pointerdown',
      () => {
        if (!this._hoveredBlockPath || !this._dragHandleGrabber) return;

        const blockElement = this._getBlockElementFromViewStore(
          this._hoveredBlockPath
        );
        if (!blockElement) return;
        this._dragHandlePointerDown = true;

        // Show drag hover rect only when pointer down on drag handle for a while
        // Do not show when just click on drag handle
        setTimeout(() => {
          if (this._dragHandlePointerDown) {
            this._dragHoverRect =
              this._getDraggingAreaRect(blockElement) ?? null;
          }
        }, 100);
      }
    );

    this._disposables.addFromEvent(
      this._dragHandleContainer,
      'pointerup',
      () => {
        if (this._dragHandlePointerDown) this._removeHoverRect();
      }
    );

    // When pointer leave drag handle grabber, should reset drag handle grabber style
    this._disposables.addFromEvent(
      this._dragHandleContainer,
      'pointerleave',
      () => {
        if (this._dragHandlePointerDown) this._removeHoverRect();

        if (!this._hoveredBlockPath) return;

        const blockElement = this._getBlockElementFromViewStore(
          this._hoveredBlockPath
        );
        if (!blockElement) return;

        if (this._dragging) return;
        this._show(blockElement);
        this._hoverDragHandle = false;
      }
    );

    if (isEdgelessPage(this._pageBlockElement)) {
      const edgelessPage = this._pageBlockElement;
      this._disposables.add(
        edgelessPage.slots.edgelessToolUpdated.on(newTool => {
          if (newTool.type !== 'default') this._hide();
        })
      );
      this._disposables.add(
        edgelessPage.slots.viewportUpdated.on(() => {
          this._hide();
          this._scale = edgelessPage.surface.viewport.zoom;

          this._scrollToUpdateIndicator();
        })
      );
    } else {
      const docPage = this._pageBlockElement;
      this._disposables.add(
        docPage.slots.viewportUpdated.on(() => this._hide())
      );

      this._disposables.addFromEvent(docPage.viewportElement, 'scroll', () => {
        this._scrollToUpdateIndicator();
      });
    }
  }

  override connectedCallback() {
    super.connectedCallback();
    this.handleEvent('pointerMove', this._pointerMoveHandler);
    this.handleEvent('click', this._clickHandler);
    this.handleEvent('dragStart', this._dragStartHandler);
    this.handleEvent('dragMove', this._dragMoveHandler);
    this.handleEvent('dragEnd', this._dragEndHandler);
    this.handleEvent('wheel', () => this._hide());
    this.handleEvent('pointerOut', this._pointerOutHandler);
    this.handleEvent('beforeInput', () => this._hide());
  }

  override disconnectedCallback() {
    this._hide(true);
    this._removeDragPreview();
    this._disposables.dispose();
    this._anchorModelDisposables?.dispose();
    super.disconnectedCallback();
  }

  override render() {
    const indicatorStyle = styleMap(
      this._indicatorRect
        ? {
            width: `${this._indicatorRect.width}px`,
            height: `${this._indicatorRect.height}px`,
            transform: `translate(${this._indicatorRect.left}px, ${this._indicatorRect.top}px)`,
          }
        : {
            display: 'none',
          }
    );

    const hoverRectStyle = styleMap(
      this._dragHoverRect
        ? {
            width: `${this._dragHoverRect.width}px`,
            height: `${this._dragHoverRect.height}px`,
            top: `${this._dragHoverRect.top}px`,
            left: `${this._dragHoverRect.left}px`,
          }
        : {
            display: 'none',
          }
    );

    return html`
      <div class="affine-drag-handle-widget">
        <div class="affine-drag-handle-container">
          <div class="affine-drag-handle-grabber"></div>
        </div>
        <div class="affine-drag-indicator" style=${indicatorStyle}></div>
        <div class="affine-drag-hover-rect" style=${hoverRectStyle}></div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-drag-handle-widget': DragHandleWidget;
  }
}
