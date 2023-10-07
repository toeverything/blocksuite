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
  getBlockElementByModel,
  getBlockElementsExcludeSubtrees,
  getCurrentNativeRange,
  getModelByBlockElement,
  isEdgelessPage,
  isPageMode,
  matchFlavours,
  Point,
  Rect,
} from '../../../_common/utils/index.js';
import { DocPageBlockComponent } from '../../../page-block/doc/doc-page-block.js';
import { EdgelessPageBlockComponent } from '../../../page-block/edgeless/edgeless-page-block.js';
import { autoScroll } from '../../../page-block/text-selection/utils.js';
import { DragPreview } from './components/drag-preview.js';
import { DropIndicator } from './components/drop-indicator.js';
import {
  DRAG_HANDLE_GRABBER_BORDER_RADIUS,
  DRAG_HANDLE_GRABBER_HEIGHT,
  DRAG_HANDLE_GRABBER_WIDTH,
  DRAG_HOVER_RECT_PADDING,
  type DragHandleOption,
  DragHandleOptionsRunner,
  type DropResult,
  HOVER_DRAG_HANDLE_GRABBER_WIDTH,
  NOTE_CONTAINER_PADDING,
} from './config.js';
import { DRAG_HANDLE_WIDTH, styles } from './styles.js';
import {
  captureEventTarget,
  containBlock,
  containChildBlock,
  getClosestBlockByPoint,
  getClosestNoteBlock,
  getContainerOffsetPoint,
  getDragHandleContainerHeight,
  getDragHandleLeftPadding,
  getNoteId,
  includeTextSelection,
  insideDatabaseTable,
  isBlockPathEqual,
  updateDragHandleClassName,
} from './utils.js';

export const AFFINE_DRAG_HANDLE_WIDGET = 'affine-drag-handle-widget';

@customElement(AFFINE_DRAG_HANDLE_WIDGET)
export class AffineDragHandleWidget extends WidgetElement<
  EdgelessPageBlockComponent | DocPageBlockComponent
> {
  static override styles = styles;

  static staticOptionRunner = new DragHandleOptionsRunner();

  static registerOption(option: DragHandleOption) {
    return AffineDragHandleWidget.staticOptionRunner.register(option);
  }

  @query('.affine-drag-handle-container')
  private _dragHandleContainer!: HTMLDivElement;

  @query('.affine-drag-handle-grabber')
  private _dragHandleGrabber!: HTMLDivElement;

  draggingElements: BlockElement[] = [];
  dropBlockId = '';
  dropBefore = false;
  dropIn = false;
  dragging = false;
  dragPreview: DragPreview | null = null;
  dropIndicator: DropIndicator | null = null;
  lastDragPointerState: PointerEventState | null = null;
  scale = 1;
  rafID = 0;
  dragPreviewOffset = {
    x: 0,
    y: 0,
  };

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

  private _anchorModelDisposables: DisposableGroup | null = null;

  get optionRunner() {
    return AffineDragHandleWidget.staticOptionRunner;
  }

  get pageBlockElement() {
    const pageElement = this.blockElement;
    const pageBlock = isPageMode(this.page)
      ? (pageElement as DocPageBlockComponent)
      : (pageElement as EdgelessPageBlockComponent);
    assertExists(pageBlock);

    return pageBlock;
  }

  get selectedBlocks() {
    return this.root.selection.find('text')
      ? this.root.selection.filter('text')
      : this.root.selection.filter('block');
  }

  clearRaf() {
    if (this.rafID) {
      cancelAnimationFrame(this.rafID);
      this.rafID = 0;
    }
  }

  outOfNoteBlock = (noteBlock: Element, point: Point) => {
    // TODO: need to find a better way to check if the point is out of note block
    const rect = noteBlock.getBoundingClientRect();
    const padding = NOTE_CONTAINER_PADDING * this.scale;
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
  getDropResult = (state: PointerEventState): DropResult | null => {
    let dropIndicator = null;
    const point = getContainerOffsetPoint(state);
    const closestBlockElement = getClosestBlockByPoint(
      this.page,
      this.pageBlockElement,
      point
    );
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
        this.selectedBlocks.map(selection => selection.blockId),
        blockId
      ) ||
      containChildBlock(this.selectedBlocks, blockPath)
    ) {
      return dropIndicator;
    }

    this.dropBlockId = blockId;

    let rect = null;
    let targetElement = null;
    const model = closestBlockElement.model;

    const isDatabase = matchFlavours(model, ['affine:database'] as const);
    if (isDatabase) {
      return dropIndicator;
    }

    const result = calcDropTarget(
      point,
      model,
      closestBlockElement,
      this.draggingElements,
      this.scale
    );

    if (result) {
      rect = result.rect;
      if (rect) {
        rect.left = rect.left - state.containerOffset.x;
        rect.top = rect.top - state.containerOffset.y;
        rect.right = rect.right - state.containerOffset.x;
        rect.bottom = rect.bottom - state.containerOffset.y;
      }
      targetElement = result.modelState.element;
      this.dropBefore = result.type === 'before' ? true : false;
      this.dropIn = result.type === 'in' ? true : false;
    }

    if (targetElement) {
      const targetBlockId = targetElement.getAttribute(this.root.blockIdAttr);
      if (targetBlockId) this.dropBlockId = targetBlockId;
    }

    dropIndicator = {
      rect,
      dropBlockId: this.dropBlockId,
      dropBefore: this.dropBefore,
      dropIn: this.dropIn,
    };

    return dropIndicator;
  };

  createDropIndicator = () => {
    if (!this.dropIndicator) this.dropIndicator = new DropIndicator();
    this.blockElement.append(this.dropIndicator);
  };

  updateDropIndicator = (indicator: DropResult | null) => {
    this.dropBlockId = indicator?.dropBlockId ?? '';
    this.dropBefore = indicator?.dropBefore ?? false;
    if (this.dropIndicator) {
      this.dropIndicator.rect = indicator?.rect ?? null;
    }
  };

  removeDropIndicator = () => {
    if (this.dropIndicator) {
      this.dropIndicator.remove();
      this.dropIndicator = null;
    }
  };

  resetDropResult = () => {
    this.dropBlockId = '';
    this.dropBefore = false;
    if (this.dropIndicator) this.dropIndicator.rect = null;
  };

  updateIndicator = (
    state: PointerEventState,
    shouldAutoScroll: boolean = false
  ) => {
    const point = getContainerOffsetPoint(state);
    const closestNoteBlock = getClosestNoteBlock(
      this.page,
      this.pageBlockElement,
      point
    );
    if (!closestNoteBlock || this.outOfNoteBlock(closestNoteBlock, point)) {
      this.resetDropResult();
    } else {
      const dropIndicator = this.getDropResult(state);
      this.updateDropIndicator(dropIndicator);
    }

    this.lastDragPointerState = state;
    if (this.pageBlockElement instanceof DocPageBlockComponent) {
      if (!shouldAutoScroll) return;

      const result = autoScroll(this.pageBlockElement.viewportElement, state.y);
      if (!result) {
        this.clearRaf();
        return;
      }
      this.rafID = requestAnimationFrame(() =>
        this.updateIndicator(state, true)
      );
    } else {
      this.clearRaf();
    }
  };

  calculatePreviewOffset = (
    blockElements: BlockElement[],
    state: PointerEventState
  ) => {
    const { top, left } = blockElements[0].getBoundingClientRect();
    const { x: offsetX, y: offsetY } = state.containerOffset;
    const { x, y } = state.point;
    return {
      x: x - left + offsetX,
      y: y - top + offsetY,
    };
  };

  createDragPreview = (
    blockElements: BlockElement[],
    state: PointerEventState
  ) => {
    if (!this.dragPreview) this.dragPreview = new DragPreview();

    const fragment = document.createDocumentFragment();
    let width = 0;
    blockElements.forEach(element => {
      width = Math.max(width, element.getBoundingClientRect().width);
      const container = document.createElement('div');
      container.classList.add('affine-block-element');
      render(this.root.renderModel(element.model), container);
      fragment.appendChild(container);
    });

    this.dragPreviewOffset = this.calculatePreviewOffset(blockElements, state);
    const posX = state.x - this.dragPreviewOffset.x;
    const posY = state.y - this.dragPreviewOffset.y;
    this.dragPreview.style.width = `${width / this.scale}px`;
    this.dragPreview.style.transform = `translate(${posX}px, ${posY}px) scale(${this.scale})`;
    this.dragPreview.classList.add('grabbing');
    this.dragPreview.style.display = 'block';

    this.dragPreview.appendChild(fragment);
    this.pageBlockElement.appendChild(this.dragPreview);
  };

  updateDragPreviewPosition = (
    dragPreview: DragPreview | null,
    state: PointerEventState
  ) => {
    if (!this.dragging || this.draggingElements.length === 0 || !dragPreview)
      return;

    const point = new Point(state.x, state.y);
    const posX = point.x - this.dragPreviewOffset.x;
    const posY = point.y - this.dragPreviewOffset.y;

    dragPreview.style.transform = `translate(${posX}px, ${posY}px) scale(${this.scale})`;
  };

  removeDragPreview = () => {
    if (this.dragPreview) {
      this.dragPreview.remove();
      this.dragPreview = null;
    }
  };

  startDragging = (blockElements: BlockElement[], state: PointerEventState) => {
    this.draggingElements = blockElements;
    this.createDragPreview(blockElements, state);
    this.dragging = true;
    this.createDropIndicator();
    this.hide();
  };

  hide = (force = false) => {
    updateDragHandleClassName();
    if (!this._dragHandleContainer) return;

    this._hoverDragHandle = false;
    if (this._dragHandleContainer.style.display !== 'none')
      this._dragHandleContainer.style.display = 'none';

    if (force) this._reset();
  };

  private _handleAnchorModelDisposables(blockElement: BlockElement) {
    if (this._anchorModelDisposables) {
      this._anchorModelDisposables.dispose();
      this._anchorModelDisposables = null;
    }

    this._anchorModelDisposables = new DisposableGroup();
    this._anchorModelDisposables.add(
      blockElement.model.propsUpdated.on(() => this.hide())
    );

    this._anchorModelDisposables.add(
      blockElement.model.deleted.on(() => this.hide())
    );
  }

  private _getBlockElementFromViewStore(path: string[]) {
    return this.root.view.viewFromPath('block', path);
  }

  private get _viewportOffset() {
    if (this.blockElement instanceof EdgelessPageBlockComponent) {
      const pageBlock = this.blockElement;
      return {
        left: -pageBlock.surface.viewport.left,
        top: -pageBlock.surface.viewport.top,
      };
    } else {
      const pageBlock = this.blockElement;
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
    const paddingTop = parseInt(computedStyle.paddingTop) * this.scale;
    return top + paddingTop + this._viewportOffset.top;
  }

  private _reset() {
    this.draggingElements = [];
    this.dropBlockId = '';
    this.dropBefore = false;
    this.lastDragPointerState = null;
    this.rafID = 0;
    this.dragging = false;
    this.dragPreviewOffset = {
      x: 0,
      y: 0,
    };

    this._dragHoverRect = null;
    this._hoveredBlockId = '';
    this._hoveredBlockPath = null;
    this._lastHoveredBlockPath = null;
    this._lastShowedBlock = null;
    this._hoverDragHandle = false;
    this._dragHandlePointerDown = false;

    this.removeDragPreview();
    this.removeDropIndicator();
  }

  private _resetDragHandleGrabber() {
    this._dragHandleGrabber.style.width = `${
      DRAG_HANDLE_GRABBER_WIDTH * this.scale
    }px`;
    this._dragHandleGrabber.style.borderRadius = `${
      DRAG_HANDLE_GRABBER_BORDER_RADIUS * this.scale
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
    const paddingLeft = parseInt(computedStyle.paddingLeft) * this.scale;
    left += paddingLeft;

    const containerHeight = getDragHandleContainerHeight(blockElement.model);

    // Ad-hoc solution for list with toggle icon
    const blockElements = this._getHoveredBlocks();
    const offsetLeft = getDragHandleLeftPadding(blockElements);
    updateDragHandleClassName(blockElements);
    // End of ad-hoc solution

    const posLeft =
      left -
      (DRAG_HANDLE_WIDTH + offsetLeft) * this.scale +
      this._viewportOffset.left;
    const posTop = this._getTopWithBlockElement(blockElement);

    const rowPaddingY =
      ((containerHeight - DRAG_HANDLE_GRABBER_HEIGHT) / 2) * this.scale;

    // use padding to control grabber's height
    const paddingTop = rowPaddingY + posTop - draggingAreaRect.top;
    const paddingBottom =
      draggingAreaRect.height -
      paddingTop -
      DRAG_HANDLE_GRABBER_HEIGHT * this.scale;

    const applyStyle = (transition?: boolean) => {
      container.style.transition = transition ? 'padding 0.25s ease' : 'none';
      container.style.paddingTop = `${paddingTop}px`;
      container.style.paddingBottom = `${paddingBottom}px`;
      container.style.width = `${DRAG_HANDLE_WIDTH * this.scale}px`;
      container.style.left = `${posLeft}px`;
      container.style.top = `${draggingAreaRect.top}px`;
      container.style.display = 'flex';
      container.style.height = `${draggingAreaRect.height}px`;
    };

    if (isBlockPathEqual(blockElement.path, this._lastShowedBlock?.path)) {
      applyStyle(true);
    } else if (this.selectedBlocks.length) {
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
    return this.selectedBlocks.some(
      selection => selection.blockId === block.model.id
    );
  }

  private _showDragHandleOnHoverBlock(blockPath: string[]) {
    const blockElement = this._getBlockElementFromViewStore(blockPath);

    assertExists(blockElement);
    this._show(blockElement);
  }

  private _getHoveredBlocks(): BlockElement[] {
    if (!this._hoveredBlockPath) return [];
    const hoverBlock = this._getBlockElementFromViewStore(
      this._hoveredBlockPath
    );
    if (!hoverBlock) return [];
    const selections = this.selectedBlocks;
    let blockElements: BlockElement[] = [];
    // When current selection is TextSelection, should cover all the blocks in native range
    if (selections.length > 0 && includeTextSelection(selections)) {
      const range = getCurrentNativeRange();
      blockElements = this._rangeManager.getSelectedBlockElementsByRange(
        range,
        {
          match: el => el.model.role === 'content',
          mode: 'highest',
        }
      );
    } else {
      blockElements = this.selectedBlocks
        .map(block => this._getBlockElementFromViewStore(block.path))
        .filter((block): block is BlockElement => !!block);
    }

    if (
      containBlock(
        blockElements.map(block => PathFinder.id(block.path)),
        PathFinder.id(this._hoveredBlockPath)
      )
    ) {
      return blockElements;
    }
    return [hoverBlock];
  }

  private _getDraggingAreaRect(blockElement: BlockElement) {
    if (!this._hoveredBlockPath) return;

    // When hover block is in selected blocks, should show hover rect on the selected blocks
    // Top: the top of the first selected block
    // Left: the left of the first selected block
    // Right: the largest right of the selected blocks
    // Bottom: the bottom of the last selected block
    let { left, top, right, bottom } = blockElement.getBoundingClientRect();

    const blockElements = this._getHoveredBlocks();

    blockElements.forEach(blockElement => {
      left = Math.min(left, blockElement.getBoundingClientRect().left);
      top = Math.min(top, blockElement.getBoundingClientRect().top);
      right = Math.max(right, blockElement.getBoundingClientRect().right);
      bottom = Math.max(bottom, blockElement.getBoundingClientRect().bottom);
    });

    const offsetLeft = getDragHandleLeftPadding(blockElements);

    // Add padding to hover rect
    left -= (DRAG_HANDLE_WIDTH + offsetLeft) * this.scale;
    top -= DRAG_HOVER_RECT_PADDING * this.scale;
    right += DRAG_HOVER_RECT_PADDING * this.scale;
    bottom += DRAG_HOVER_RECT_PADDING * this.scale;

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
    if (isEdgelessPage(this.pageBlockElement)) {
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

  private get _rangeManager() {
    assertExists(this.root.rangeManager);
    return this.root.rangeManager;
  }

  private _removeHoverRect() {
    this._dragHoverRect = null;
    this._dragHandlePointerDown = false;
  }

  private _canEditing = (noteBlock: BlockElement) => {
    if (isPageMode(this.page)) return true;
    const edgelessPage = this.pageBlockElement as EdgelessPageBlockComponent;
    const noteBlockId = noteBlock.path[noteBlock.path.length - 1];
    return (
      edgelessPage.selectionManager.editing &&
      edgelessPage.selectionManager.state.elements[0] === noteBlockId
    );
  };

  private _scrollToUpdateIndicator = () => {
    if (
      !this.dragging ||
      this.draggingElements.length === 0 ||
      !this.lastDragPointerState
    )
      return;

    const state = this.lastDragPointerState;
    this.rafID = requestAnimationFrame(() =>
      this.updateIndicator(state, false)
    );
  };

  /**
   * When pointer move on block, should show drag handle
   * And update hover block id and path
   */
  private _pointerMoveOnBlock = (ctx: UIEventStateContext) => {
    const state = ctx.get('pointerState');
    const point = getContainerOffsetPoint(state);
    const closestBlockElement = getClosestBlockByPoint(
      this.page,
      this.pageBlockElement,
      point
    );
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
      this.hide();
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
    if (!element || this.dragging) {
      return;
    }

    // When pointer on drag handle, should do nothing
    if (element.closest('.affine-drag-handle-container')) {
      return;
    }

    // TODO: need to optimize
    // When pointer out of note block hover area or inside database, should hide drag handle
    const point = getContainerOffsetPoint(state);
    const closestNoteBlock = getClosestNoteBlock(
      this.page,
      this.pageBlockElement,
      point
    );
    if (
      !closestNoteBlock ||
      !this._canEditing(closestNoteBlock as BlockElement) ||
      this.outOfNoteBlock(closestNoteBlock, point)
    ) {
      this.hide();
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
    const selectedBlocks = this.selectedBlocks;

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
    const blockElement = this._getBlockElementFromViewStore(
      this._hoveredBlockPath
    );

    assertExists(blockElement);
    if (selectedBlocks.length > 1) this._show(blockElement);
    this._setSelectedBlocks([blockElement]);

    return true;
  };

  private _onDragStart = (state: PointerEventState) => {
    const event = state.raw;
    const { target } = event;
    const element = captureEventTarget(target);
    const inside = !!element?.closest('affine-drag-handle-widget');
    // Should only start dragging when pointer down on drag handle
    // And current mouse button is left button
    if (!inside || !this._hoveredBlockId || !this._hoveredBlockPath) {
      return false;
    }

    // Get current hover block element by path
    const hoverBlockElement = this._getBlockElementFromViewStore(
      this._hoveredBlockPath
    );
    if (!hoverBlockElement) {
      return false;
    }

    let selections = this.selectedBlocks;

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
        selections = this.selectedBlocks;
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
      const blockElement = this._getBlockElementFromViewStore(
        this._hoveredBlockPath
      );
      assertExists(blockElement);

      this._setSelectedBlocks([blockElement]);
    }

    const blockElements = this.selectedBlocks
      .map(selection => {
        return this._getBlockElementFromViewStore(selection.path);
      })
      .filter((element): element is BlockElement<BaseBlockModel> => !!element);

    // This could be skip if we can ensure that all selected blocks are on the same level
    // Which means not selecting parent block and child block at the same time
    const blockElementsExcludingChildren = getBlockElementsExcludeSubtrees(
      blockElements
    ) as BlockElement[];

    if (blockElementsExcludingChildren.length === 0) return false;

    this.startDragging(blockElementsExcludingChildren, state);

    return true;
  };

  private _onDragMove = (ctx: UIEventStateContext) => {
    this.clearRaf();

    const state = ctx.get('pointerState');
    this.rafID = requestAnimationFrame(() => this.updateIndicator(state, true));

    return true;
  };

  private _onDragEnd = () => {
    const targetBlockId = this.dropBlockId;
    const shouldInsertBefore = this.dropBefore;
    const shouldInsertIn = this.dropIn;
    const draggingElements = this.draggingElements;

    this.hide(true);
    if (!targetBlockId) return false;

    // Should make sure drop block id is not in selected blocks
    if (
      containBlock(
        this.selectedBlocks.map(selection => selection.blockId),
        targetBlockId
      )
    ) {
      return false;
    }

    const selectedBlocks = getBlockElementsExcludeSubtrees(draggingElements)
      .map(element => getModelByBlockElement(element))
      .filter((x): x is BaseBlockModel => !!x);
    const targetBlock = this.page.getBlockById(targetBlockId);

    const parent = shouldInsertIn
      ? targetBlock
      : this.page.getParent(targetBlockId);

    if (targetBlock && parent && selectedBlocks.length > 0) {
      if (!shouldInsertIn) {
        this.page.moveBlocks(
          selectedBlocks,
          parent,
          targetBlock,
          shouldInsertBefore
        );
      } else {
        this.page.moveBlocks(selectedBlocks, targetBlock);
      }
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
          .map(path => this._getBlockElementFromViewStore(path));

        if (!newSelectedBlocks) return;

        const noteId = getNoteId(parentElement);
        this._setSelectedBlocks(newSelectedBlocks as BlockElement[], noteId);
      }
    }, 0);

    return true;
  };

  /**
   * When start dragging, should set dragging elements and create drag preview
   */
  private _dragStartHandler: UIEventHandler = ctx => {
    const state = ctx.get('pointerState');
    // If not click left button to start dragging, should do nothing
    const { button } = state.raw;
    if (button !== 0) return false;

    // call default drag start handler if no option return true
    for (const option of this.optionRunner.options) {
      if (option.onDragStart?.(state, this.startDragging)) {
        return true;
      }
    }

    return this._onDragStart(state);
  };

  /**
   * When dragging, should:
   * Update drag preview position
   * Update indicator position
   * Update drop block id
   */
  private _dragMoveHandler: UIEventHandler = ctx => {
    if (!this.dragging || this.draggingElements.length === 0) {
      return false;
    }

    ctx.get('defaultState').event.preventDefault();

    const state = ctx.get('pointerState');
    this.updateDragPreviewPosition(this.dragPreview, state);

    for (const option of this.optionRunner.options) {
      if (option.onDragMove?.(state, this.draggingElements)) {
        return true;
      }
    }

    // call default drag move handler if no option return true
    return this._onDragMove(ctx);
  };

  /**
   * When drag end, should move blocks to drop position
   * @returns
   */
  private _dragEndHandler: UIEventHandler = ctx => {
    this.clearRaf();
    if (!this.dragging || this.draggingElements.length === 0) {
      this.hide(true);
      return false;
    }
    const state = ctx.get('pointerState');

    for (const option of this.optionRunner.options) {
      if (option.onDragEnd?.(state, this.draggingElements)) {
        this.hide(true);
        return true;
      }
    }

    //call default drag end handler if no option return true
    return this._onDragEnd();
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
      this.hide();
    }
  };

  private _onDragHandleHover = () => {
    if (!this._hoveredBlockPath || !this._dragHandleGrabber) return;

    const blockElement = this._getBlockElementFromViewStore(
      this._hoveredBlockPath
    );
    if (!blockElement) return;

    const draggingAreaRect = this._getDraggingAreaRect(blockElement);
    if (!draggingAreaRect) return;

    const padding = 8 * this.scale;
    this._dragHandleContainer.style.paddingTop = `${padding}px`;
    this._dragHandleContainer.style.paddingBottom = `${padding}px`;
    this._dragHandleContainer.style.transition = `padding 0.25s ease`;

    this._dragHandleGrabber.style.width = `${
      HOVER_DRAG_HANDLE_GRABBER_WIDTH * this.scale
    }px`;
    this._dragHandleGrabber.style.borderRadius = `${
      DRAG_HANDLE_GRABBER_BORDER_RADIUS * this.scale
    }px`;

    this._hoverDragHandle = true;
  };

  private _onDragHandlePointerDown = () => {
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
        this._dragHoverRect = this._getDraggingAreaRect(blockElement) ?? null;
      }
    }, 100);
  };

  private _onDragHandlePointerLeave = () => {
    if (this._dragHandlePointerDown) this._removeHoverRect();

    if (!this._hoveredBlockPath) return;

    const blockElement = this._getBlockElementFromViewStore(
      this._hoveredBlockPath
    );
    if (!blockElement) return;

    if (this.dragging) return;
    this._show(blockElement);
    this._hoverDragHandle = false;
  };

  override firstUpdated() {
    this.hide(true);

    // When pointer enter drag handle grabber
    // Extend drag handle grabber to the height of the hovered block
    this._disposables.addFromEvent(
      this._dragHandleContainer,
      'pointerenter',
      this._onDragHandleHover
    );

    this._disposables.addFromEvent(
      this._dragHandleContainer,
      'pointerdown',
      this._onDragHandlePointerDown
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
      this._onDragHandlePointerLeave
    );

    if (isEdgelessPage(this.pageBlockElement)) {
      const edgelessPage = this.pageBlockElement;
      this._disposables.add(
        edgelessPage.slots.edgelessToolUpdated.on(newTool => {
          if (newTool.type !== 'default') this.hide();
        })
      );
      this._disposables.add(
        edgelessPage.slots.viewportUpdated.on(() => {
          this.hide();
          this.scale = edgelessPage.surface.viewport.zoom;

          this._scrollToUpdateIndicator();
        })
      );
    } else {
      const docPage = this.pageBlockElement;
      this._disposables.add(
        docPage.slots.viewportUpdated.on(() => this.hide())
      );

      const viewportElement = docPage.viewportElement;
      assertExists(viewportElement);
      this._disposables.addFromEvent(viewportElement, 'scroll', () => {
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
    this.handleEvent('wheel', () => this.hide());
    this.handleEvent('pointerOut', this._pointerOutHandler);
    this.handleEvent('beforeInput', () => this.hide());
  }

  override disconnectedCallback() {
    this.hide(true);
    this.removeDragPreview();
    this.removeDropIndicator();
    this._disposables.dispose();
    this._anchorModelDisposables?.dispose();
    super.disconnectedCallback();
  }

  override render() {
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
        <div class="affine-drag-hover-rect" style=${hoverRectStyle}></div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    [AFFINE_DRAG_HANDLE_WIDGET]: AffineDragHandleWidget;
  }
}
