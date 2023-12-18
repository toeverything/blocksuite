import {
  PathFinder,
  type PointerEventState,
  type UIEventHandler,
} from '@blocksuite/block-std';
import {
  assertExists,
  assertInstanceOf,
  DisposableGroup,
} from '@blocksuite/global/utils';
import type { BlockElement } from '@blocksuite/lit';
import { WidgetElement } from '@blocksuite/lit';
import { type BaseBlockModel } from '@blocksuite/store';
import { html, render } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import { BLOCK_ID_ATTR } from '../../../_common/consts.js';
import {
  buildPath,
  type EdgelessTool,
  getBlockElementsExcludeSubtrees,
  getCurrentNativeRange,
  getModelByBlockComponent,
  isInsideDocEditor,
  isInsideEdgelessEditor,
  matchFlavours,
  Point,
  Rect,
  type TopLevelBlockModel,
} from '../../../_common/utils/index.js';
import { DocPageBlockComponent } from '../../../page-block/doc/doc-page-block.js';
import { EdgelessPageBlockComponent } from '../../../page-block/edgeless/edgeless-page-block.js';
import {
  getSelectedRect,
  isTopLevelBlock,
} from '../../../page-block/edgeless/utils/query.js';
import { autoScroll } from '../../../page-block/text-selection/utils.js';
import { DragPreview } from './components/drag-preview.js';
import { DropIndicator } from './components/drop-indicator.js';
import type { DragHandleOption, DropResult, DropType } from './config.js';
import { DragHandleOptionsRunner } from './config.js';
import {
  DRAG_HANDLE_CONTAINER_OFFSET_LEFT_TOP_LEVEL,
  DRAG_HANDLE_CONTAINER_PADDING,
  DRAG_HANDLE_CONTAINER_WIDTH,
  DRAG_HANDLE_CONTAINER_WIDTH_TOP_LEVEL,
  DRAG_HANDLE_GRABBER_BORDER_RADIUS,
  DRAG_HANDLE_GRABBER_HEIGHT,
  DRAG_HANDLE_GRABBER_WIDTH,
  DRAG_HANDLE_GRABBER_WIDTH_HOVERED,
  DRAG_HOVER_RECT_PADDING,
  HOVER_AREA_RECT_PADDING_TOP_LEVEL,
} from './config.js';
import { styles } from './styles.js';
import {
  calcDropTarget,
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
  isOutOfNoteBlock,
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
  dropType: DropType | null = null;
  dragging = false;
  dragPreview: DragPreview | null = null;
  dropIndicator: DropIndicator | null = null;
  lastDragPointerState: PointerEventState | null = null;
  scale = 1;
  rafID = 0;

  @state()
  private _dragHoverRect: {
    width: number;
    height: number;
    left: number;
    top: number;
  } | null = null;

  private _lastHoveredBlockPath: string[] | null = null;
  private _lastShowedBlock: { path: string[]; el: BlockElement } | null = null;

  private _isHoverDragHandleVisible = false;
  private _isDragHandleHovered = false;
  private _isTopLevelDragHandleVisible = false;

  private _anchorBlockId = '';
  private _anchorBlockPath: string[] | null = null;

  private _anchorModelDisposables: DisposableGroup | null = null;

  get optionRunner() {
    return AffineDragHandleWidget.staticOptionRunner;
  }

  get pageBlockElement() {
    return this.blockElement as
      | DocPageBlockComponent
      | EdgelessPageBlockComponent;
  }

  get selectedBlocks() {
    return this.host.selection.find('text')
      ? this.host.selection.filter('text')
      : this.host.selection.filter('block');
  }

  get anchorBlockElement(): BlockElement | null {
    if (!this._anchorBlockPath) return null;
    return this._getBlockElementFromViewStore(this._anchorBlockPath);
  }

  get anchorEdgelessElement(): TopLevelBlockModel | null {
    if (isInsideDocEditor(this.host) || !this._anchorBlockId) return null;
    const { surface } = this.pageBlockElement as EdgelessPageBlockComponent;
    const edgelessElement = surface.pickById(this._anchorBlockId);
    return isTopLevelBlock(edgelessElement) ? edgelessElement : null;
  }

  clearRaf() {
    if (this.rafID) {
      cancelAnimationFrame(this.rafID);
      this.rafID = 0;
    }
  }

  /**
   * When dragging, should update indicator position and target drop block id
   */
  getDropResult = (state: PointerEventState): DropResult | null => {
    const point = getContainerOffsetPoint(state);
    const closestBlockElement = getClosestBlockByPoint(
      this.host,
      this.pageBlockElement,
      point
    );
    if (!closestBlockElement) {
      return null;
    }

    const blockId = closestBlockElement.model.id;
    const blockPath = closestBlockElement.path;
    const model = closestBlockElement.model;

    const isDatabase = matchFlavours(model, ['affine:database']);
    if (isDatabase) {
      return null;
    }

    // note block can only be dropped into another note block
    // prevent note block from being dropped into other blocks
    const isDraggedElementNote =
      this.draggingElements.length === 1 &&
      matchFlavours(this.draggingElements[0].model, ['affine:note']);

    if (isDraggedElementNote) {
      const parentElement = this._getBlockElementFromViewStore(
        PathFinder.parent(closestBlockElement.path)
      );
      if (!parentElement) return null;
      if (!matchFlavours(parentElement.model, ['affine:note'])) return null;
    }

    // Should make sure that target drop block is
    // neither within the dragging elements
    // nor a child-block of any dragging elements
    if (
      containBlock(
        this.draggingElements.map(blockElement => blockElement.model.id),
        blockId
      ) ||
      containChildBlock(this.draggingElements, blockPath)
    ) {
      return null;
    }

    let rect = null;
    let dropType: DropType = 'before';

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
      dropType = result.dropType;
    }

    if (isDraggedElementNote && dropType === 'in') return null;

    const dropIndicator = {
      rect,
      dropBlockId: blockId,
      dropType,
    };

    return dropIndicator;
  };

  updateDropResult = (dropResult: DropResult | null) => {
    this.dropBlockId = dropResult?.dropBlockId ?? '';
    this.dropType = dropResult?.dropType ?? null;
    if (this.dropIndicator) this.dropIndicator.rect = dropResult?.rect ?? null;
  };

  resetDropResult = () => {
    this.dropBlockId = '';
    this.dropType = null;
    if (this.dropIndicator) this.dropIndicator.rect = null;
  };

  createDropIndicator = () => {
    if (!this.dropIndicator) {
      this.dropIndicator = new DropIndicator();
      this.blockElement.append(this.dropIndicator);
    }
  };

  updateDropIndicator = (
    state: PointerEventState,
    shouldAutoScroll: boolean = false
  ) => {
    const point = getContainerOffsetPoint(state);
    const closestNoteBlock = getClosestNoteBlock(
      this.host,
      this.pageBlockElement,
      point
    );
    if (
      !closestNoteBlock ||
      isOutOfNoteBlock(this.host, closestNoteBlock, point, this.scale)
    ) {
      this.resetDropResult();
    } else {
      const dropResult = this.getDropResult(state);
      this.updateDropResult(dropResult);
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
        this.updateDropIndicator(state, true)
      );
    } else {
      this.clearRaf();
    }
  };

  private _updateDropIndicatorOnScroll = () => {
    if (
      !this.dragging ||
      this.draggingElements.length === 0 ||
      !this.lastDragPointerState
    )
      return;

    const state = this.lastDragPointerState;
    this.rafID = requestAnimationFrame(() =>
      this.updateDropIndicator(state, false)
    );
  };

  removeDropIndicator = () => {
    if (this.dropIndicator) {
      this.dropIndicator.remove();
      this.dropIndicator = null;
    }
  };

  calculatePreviewOffset = (
    blockElements: BlockElement[],
    state: PointerEventState
  ) => {
    const { top, left } = blockElements[0].getBoundingClientRect();
    const point = getContainerOffsetPoint(state);
    const previewOffset = new Point(point.x - left, point.y - top);
    return previewOffset;
  };

  createDragPreview = (
    blockElements: BlockElement[],
    state: PointerEventState,
    dragPreviewEl?: HTMLElement,
    dragPreviewOffset?: Point
  ): DragPreview => {
    let dragPreview: DragPreview;
    if (dragPreviewEl) {
      dragPreview = new DragPreview(dragPreviewOffset);
      dragPreview.appendChild(dragPreviewEl);
    } else {
      const fragment = document.createDocumentFragment();
      let width = 0;
      blockElements.forEach(element => {
        width = Math.max(width, element.getBoundingClientRect().width);
        const container = document.createElement('div');
        container.classList.add('affine-block-element');
        render(this.host.renderModel(element.model), container);
        fragment.appendChild(container);
      });

      const offset = this.calculatePreviewOffset(blockElements, state);
      const posX = state.x - offset.x;
      const posY = state.y - offset.y;

      dragPreview = new DragPreview(offset);
      dragPreview.style.width = `${width / this.scale}px`;
      dragPreview.style.transform = `translate(${posX}px, ${posY}px) scale(${this.scale})`;
      dragPreview.appendChild(fragment);
    }
    dragPreview.classList.add('grabbing');
    dragPreview.style.display = 'block';
    this.pageBlockElement.appendChild(dragPreview);
    return dragPreview;
  };

  updateDragPreviewPosition = (state: PointerEventState) => {
    if (!this.dragPreview) return;

    const dragPreviewOffset = this.dragPreview.offset;
    const posX = state.x - dragPreviewOffset.x;
    const posY = state.y - dragPreviewOffset.y;
    this.dragPreview.style.transform = `translate(${posX}px, ${posY}px) scale(${this.scale})`;
  };

  private _updateDragPreviewOnZoom = () => {
    if (this.dragPreview && this.lastDragPointerState) {
      this.updateDragPreviewPosition(this.lastDragPointerState);
    }
  };

  removeDragPreview = () => {
    if (this.dragPreview) {
      this.dragPreview.remove();
      this.dragPreview = null;
    }
  };

  changeCursorToGrabbing = () => {
    document.documentElement.classList.add('affine-drag-preview-grabbing');
  };

  resetCursor = () => {
    document.documentElement.classList.remove('affine-drag-preview-grabbing');
  };

  startDragging = (
    blockElements: BlockElement[],
    state: PointerEventState,
    dragPreviewEl?: HTMLElement,
    dragPreviewOffset?: Point
  ) => {
    if (!blockElements.length) return;

    this.draggingElements = blockElements;

    if (this.dragPreview) this.removeDragPreview();
    this.dragPreview = this.createDragPreview(
      blockElements,
      state,
      dragPreviewEl,
      dragPreviewOffset
    );

    this.dragging = true;
    this.changeCursorToGrabbing();
    this.createDropIndicator();
    this._hide();
  };

  private _hide = (force = false) => {
    updateDragHandleClassName();

    this._isHoverDragHandleVisible = false;
    this._isTopLevelDragHandleVisible = false;
    this._isDragHandleHovered = false;

    this._anchorBlockId = '';
    this._anchorBlockPath = null;

    if (this._dragHandleContainer)
      this._dragHandleContainer.style.display = 'none';

    if (force) this._reset();
  };

  private _reset() {
    this.draggingElements = [];
    this.dropBlockId = '';
    this.dropType = null;
    this.lastDragPointerState = null;
    this.rafID = 0;
    this.dragging = false;

    this._dragHoverRect = null;
    this._lastHoveredBlockPath = null;
    this._lastShowedBlock = null;
    this._anchorBlockId = '';
    this._anchorBlockPath = null;
    this._isHoverDragHandleVisible = false;
    this._isDragHandleHovered = false;
    this._isTopLevelDragHandleVisible = false;

    this.removeDragPreview();
    this.removeDropIndicator();
    this.resetCursor();
  }

  private _handleAnchorModelDisposables(blockModel: BaseBlockModel) {
    if (this._anchorModelDisposables) {
      this._anchorModelDisposables.dispose();
      this._anchorModelDisposables = null;
    }

    this._anchorModelDisposables = new DisposableGroup();
    this._anchorModelDisposables.add(
      blockModel.propsUpdated.on(() => this._hide())
    );

    this._anchorModelDisposables.add(blockModel.deleted.on(() => this._hide()));
  }

  private _getBlockElementFromViewStore(path: string[]) {
    return this.host.view.viewFromPath('block', path);
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

  /** Check if given blockElement is selected */
  private _isBlockSelected(block?: BlockElement) {
    if (!block) return false;
    return this.selectedBlocks.some(
      selection => selection.blockId === block.model.id
    );
  }

  // Single block: drag handle should show on the vertical middle of the first line of element
  // Multiple blocks: drag handle should show on the vertical middle of all blocks
  private async _showDragHandleOnHoverBlock(blockPath: string[]) {
    const blockElement = this._getBlockElementFromViewStore(blockPath);
    assertExists(blockElement);

    const container = this._dragHandleContainer;
    const grabber = this._dragHandleGrabber;
    if (!container || !grabber) return;

    let { left } = blockElement.getBoundingClientRect();
    const draggingAreaRect = this._getDraggingAreaRect(blockElement);

    // Some blocks have padding, should consider padding when calculating position
    const computedStyle = getComputedStyle(blockElement);
    const paddingLeft = parseInt(computedStyle.paddingLeft) * this.scale;
    left += paddingLeft;

    const containerHeight = getDragHandleContainerHeight(blockElement.model);

    // Ad-hoc solution for list with toggle icon
    updateDragHandleClassName([blockElement]);
    const offsetLeft = getDragHandleLeftPadding([blockElement]);
    // End of ad-hoc solution

    const posLeft =
      left -
      (DRAG_HANDLE_CONTAINER_WIDTH + offsetLeft) * this.scale +
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
      container.style.width = `${DRAG_HANDLE_CONTAINER_WIDTH * this.scale}px`;
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
          this._isDragHandleHovered &&
            this._isBlockSelected(this._lastShowedBlock?.el)
        );
      else applyStyle(false);
    } else {
      applyStyle(false);
    }

    grabber.style.width = `${DRAG_HANDLE_GRABBER_WIDTH * this.scale}px`;
    grabber.style.borderRadius = `${
      DRAG_HANDLE_GRABBER_BORDER_RADIUS * this.scale
    }px`;

    this._handleAnchorModelDisposables(blockElement.model);
    if (!isBlockPathEqual(blockElement.path, this._lastShowedBlock?.path)) {
      this._lastShowedBlock = {
        path: blockElement.path,
        el: blockElement,
      };
    }

    this._isHoverDragHandleVisible = true;
  }

  private _showDragHandleOnTopLevelBlocks() {
    if (isInsideDocEditor(this.host)) return;
    const edgelessPage = this.pageBlockElement as EdgelessPageBlockComponent;

    if (!this._anchorBlockPath) return;
    const blockElement = this.anchorBlockElement;
    assertExists(blockElement);

    const edgelessElement = edgelessPage.surface.pickById(
      blockElement.model.id
    );
    assertExists(edgelessElement);

    const container = this._dragHandleContainer;
    const grabber = this._dragHandleGrabber;
    if (!container || !grabber) return;

    const rect = getSelectedRect([edgelessElement]);
    const [left, top] = edgelessPage.surface.toViewCoord(rect.left, rect.top);
    const height = rect.height * this.scale;

    const posLeft =
      left -
      (DRAG_HANDLE_CONTAINER_WIDTH_TOP_LEVEL +
        DRAG_HANDLE_CONTAINER_OFFSET_LEFT_TOP_LEVEL) *
        this.scale +
      this._viewportOffset.left;

    const posTop = top + this._viewportOffset.top;

    container.style.transition = 'none';
    container.style.paddingTop = `0px`;
    container.style.paddingBottom = `0px`;
    container.style.width = `${
      DRAG_HANDLE_CONTAINER_WIDTH_TOP_LEVEL * this.scale
    }px`;
    container.style.left = `${posLeft}px`;
    container.style.top = `${posTop}px`;
    container.style.display = 'flex';
    container.style.height = `${height}px`;

    grabber.style.width = `${DRAG_HANDLE_GRABBER_WIDTH_HOVERED * this.scale}px`;
    grabber.style.borderRadius = `${
      DRAG_HANDLE_GRABBER_BORDER_RADIUS * this.scale
    }px`;

    this._handleAnchorModelDisposables(blockElement.model);

    this._isTopLevelDragHandleVisible = true;
  }

  private _getHoveredBlocks(): BlockElement[] {
    if (!this._isHoverDragHandleVisible || !this._anchorBlockPath) return [];

    const hoverBlock = this.anchorBlockElement;
    assertExists(hoverBlock);

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
        PathFinder.id(this._anchorBlockPath)
      )
    ) {
      return blockElements;
    }

    return [hoverBlock];
  }

  private _getDraggingAreaRect(blockElement: BlockElement): Rect {
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
    left -= (DRAG_HANDLE_CONTAINER_WIDTH + offsetLeft) * this.scale;
    top -= DRAG_HOVER_RECT_PADDING * this.scale;
    right += DRAG_HOVER_RECT_PADDING * this.scale;
    bottom += DRAG_HOVER_RECT_PADDING * this.scale;

    left += this._viewportOffset.left;
    right += this._viewportOffset.left;
    top += this._viewportOffset.top;
    bottom += this._viewportOffset.top;

    return new Rect(left, top, right, bottom);
  }

  private _getHoverAreaRectTopLevelBlock(
    edgelessElement: TopLevelBlockModel
  ): Rect | null {
    if (isInsideDocEditor(this.host)) return null;
    const edgelessPage = this.pageBlockElement as EdgelessPageBlockComponent;

    const rect = getSelectedRect([edgelessElement]);
    let [left, top] = edgelessPage.surface.toViewCoord(rect.left, rect.top);
    const width = rect.width * this.scale;
    const height = rect.height * this.scale;

    let [right, bottom] = [left + width, top + height];

    const offsetLeft = DRAG_HANDLE_CONTAINER_OFFSET_LEFT_TOP_LEVEL * this.scale;
    const padding = HOVER_AREA_RECT_PADDING_TOP_LEVEL * this.scale;

    left -= DRAG_HANDLE_CONTAINER_WIDTH_TOP_LEVEL * this.scale + offsetLeft;
    top -= padding;
    right += padding;
    bottom += padding;

    left += this._viewportOffset.left;
    top += this._viewportOffset.top;
    right += this._viewportOffset.left;
    bottom += this._viewportOffset.top;

    return new Rect(left, top, right, bottom);
  }

  private _updateDragHoverRectTopLevelBlock() {
    if (!this._dragHoverRect) return;

    const edgelessElement = this.anchorEdgelessElement;

    if (edgelessElement) {
      this._dragHoverRect =
        this._getHoverAreaRectTopLevelBlock(edgelessElement);
    }
  }

  private _setSelectedBlocks(blockElements: BlockElement[], noteId?: string) {
    const { selection } = this.host;
    const selections = blockElements.map(blockElement =>
      selection.getInstance('block', {
        path: blockElement.path,
      })
    );

    // When current page is edgeless page
    // We need to remain surface selection and set editing as true
    if (isInsideEdgelessEditor(this.host)) {
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
    assertExists(this.host.rangeManager);
    return this.host.rangeManager;
  }

  private _canEditing = (noteBlock: BlockElement) => {
    if (noteBlock.page.id !== this.page.id) return false;

    if (isInsideDocEditor(this.host)) return true;
    const edgelessPage = this.pageBlockElement as EdgelessPageBlockComponent;

    const noteBlockId = noteBlock.path[noteBlock.path.length - 1];
    return (
      edgelessPage.selectionManager.editing &&
      edgelessPage.selectionManager.state.elements[0] === noteBlockId
    );
  };

  private _checkTopLevelBlockSelection = () => {
    if (this.page.readonly || isInsideDocEditor(this.host)) {
      this._hide();
      return;
    }

    const edgelessPage = this.pageBlockElement as EdgelessPageBlockComponent;
    const selection = edgelessPage.selectionManager;
    const selectedElements = selection.elements;
    if (selection.editing || selectedElements.length !== 1) {
      this._hide();
      return;
    }

    const selectedElement = selectedElements[0];
    if (!isTopLevelBlock(selectedElement)) {
      this._hide();
      return;
    }

    const flavour = selectedElement.flavour;
    const dragHandleOptions = this.optionRunner.getOption(flavour);
    if (!dragHandleOptions || !dragHandleOptions.edgeless) {
      this._hide();
      return;
    }

    // FIXME: this is a workaround for the bug that the path of selected element is not correct
    // ref: Github issues #5623, #5624
    const blockElement = this.pageBlockElement.querySelector(
      `[${BLOCK_ID_ATTR}="${selectedElement.id}"]`
    ) as BlockElement | null;
    if (!blockElement) {
      this._hide();
      return;
    }

    this._anchorBlockId = selectedElement.id;
    this._anchorBlockPath = blockElement.path;

    this._showDragHandleOnTopLevelBlocks();
  };

  /**
   * When pointer move on block, should show drag handle
   * And update hover block id and path
   */
  private _pointerMoveOnBlock = (state: PointerEventState) => {
    if (this._isTopLevelDragHandleVisible) return;

    const point = getContainerOffsetPoint(state);
    const closestBlockElement = getClosestBlockByPoint(
      this.host,
      this.pageBlockElement,
      point
    );
    if (!closestBlockElement) {
      this._anchorBlockId = '';
      this._anchorBlockPath = null;
      return;
    }

    const blockId = closestBlockElement.getAttribute(this.host.blockIdAttr);
    assertExists(blockId);

    this._anchorBlockId = blockId;
    this._anchorBlockPath = closestBlockElement.path;

    if (insideDatabaseTable(closestBlockElement) || this.page.readonly) {
      this._hide();
      return;
    }

    // If current block is not the last hovered block, show drag handle beside the hovered block
    if (
      (!this._lastHoveredBlockPath ||
        !isBlockPathEqual(this._anchorBlockPath, this._lastHoveredBlockPath) ||
        !this._isHoverDragHandleVisible) &&
      !this._isDragHandleHovered
    ) {
      this._showDragHandleOnHoverBlock(this._anchorBlockPath).catch(
        console.error
      );
      this._lastHoveredBlockPath = this._anchorBlockPath;
    }
  };

  private _pointerMoveHandler: UIEventHandler = ctx => {
    if (this.page.readonly || this.dragging) {
      this._hide();
      return;
    }
    if (this._isTopLevelDragHandleVisible) return;

    const state = ctx.get('pointerState');
    const { target } = state.raw;
    const element = captureEventTarget(target);
    // When pointer not on block or on dragging, should do nothing
    if (!element) return;

    // When pointer on drag handle, should do nothing
    if (element.closest('.affine-drag-handle-container')) return;

    // TODO: need to optimize
    // When pointer out of note block hover area or inside database, should hide drag handle
    const point = getContainerOffsetPoint(state);
    const closestNoteBlock = getClosestNoteBlock(
      this.host,
      this.pageBlockElement,
      point
    ) as BlockElement | null;
    if (
      closestNoteBlock &&
      this._canEditing(closestNoteBlock) &&
      !isOutOfNoteBlock(this.host, closestNoteBlock, point, this.scale)
    ) {
      this._pointerMoveOnBlock(state);
      return true;
    }

    this._hide();
    return false;
  };

  /**
   * When click on drag handle
   * Should select the block and show slash menu if current block is not selected
   * Should clear selection if current block is the first selected block
   */
  private _clickHandler: UIEventHandler = ctx => {
    if (!this._isHoverDragHandleVisible) return;

    const state = ctx.get('pointerState');
    const { target } = state.raw;
    const element = captureEventTarget(target);
    const insideDragHandle = !!element?.closest('affine-drag-handle-widget');
    if (!insideDragHandle) return;

    if (!this._anchorBlockId || !this._anchorBlockPath) return;

    const { selection } = this.host;
    const selectedBlocks = this.selectedBlocks;

    // Should clear selection if current block is the first selected block
    if (
      selectedBlocks.length > 0 &&
      !includeTextSelection(selectedBlocks) &&
      selectedBlocks[0].blockId === this._anchorBlockId
    ) {
      selection.clear(['block']);
      this._dragHoverRect = null;
      this._showDragHandleOnHoverBlock(this._anchorBlockPath).catch(
        console.error
      );
      return;
    }

    // Should select the block if current block is not selected
    const blockElement = this.anchorBlockElement;
    assertExists(blockElement);

    if (selectedBlocks.length > 1) {
      this._showDragHandleOnHoverBlock(this._anchorBlockPath).catch(
        console.error
      );
    }

    this._setSelectedBlocks([blockElement]);

    return true;
  };

  private _onDragStart = (state: PointerEventState) => {
    const event = state.raw;
    const { target } = event;
    const element = captureEventTarget(target);
    const insideDragHandle = !!element?.closest('affine-drag-handle-widget');
    // Should only start dragging when pointer down on drag handle
    // And current mouse button is left button
    if (!insideDragHandle) {
      this._hide();
      return false;
    }

    if (!this._isHoverDragHandleVisible) return;
    // Get current hover block element by path
    assertExists(this._anchorBlockId);
    assertExists(this._anchorBlockPath);
    const hoverBlockElement = this.anchorBlockElement;
    if (!hoverBlockElement) return false;

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
        this._anchorBlockId
      )
    ) {
      const blockElement = this.anchorBlockElement;
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

    this._hide();
    return true;
  };

  private _onDragMove = (state: PointerEventState) => {
    this.clearRaf();
    this.rafID = requestAnimationFrame(() =>
      this.updateDropIndicator(state, true)
    );
    return true;
  };

  private _onDragEnd = (state: PointerEventState) => {
    const targetBlockId = this.dropBlockId;
    const dropType = this.dropType;
    const draggingElements = this.draggingElements;
    this._hide(true);

    // handle drop of blocks from note onto edgeless container
    if (!targetBlockId) {
      const target = captureEventTarget(state.raw.target);

      const isTargetEdgelessContainer =
        target?.classList.contains('edgeless') &&
        target?.classList.contains('affine-block-children-container');
      if (!isTargetEdgelessContainer) return false;

      const selectedBlocks = getBlockElementsExcludeSubtrees(draggingElements)
        .map(element => getModelByBlockComponent(element))
        .filter((x): x is BaseBlockModel => !!x);
      if (selectedBlocks.length === 0) return false;

      const isSurfaceComponent = selectedBlocks.some(block => {
        const parent = this.page.getParent(block.id);
        return matchFlavours(parent, ['affine:surface']);
      });
      if (isSurfaceComponent) return true;

      const edgelessPage = this.pageBlockElement;
      assertInstanceOf(edgelessPage, EdgelessPageBlockComponent);

      const newNoteId = edgelessPage.addNoteWithPoint(
        new Point(state.x, state.y)
      );
      const newNoteBlock = this.page.getBlockById(newNoteId);
      assertExists(newNoteBlock);

      this.page.moveBlocks(selectedBlocks, newNoteBlock);

      return true;
    }

    // Should make sure drop block id is not in selected blocks
    if (
      containBlock(
        this.selectedBlocks.map(selection => selection.blockId),
        targetBlockId
      )
    )
      return false;

    const selectedBlocks = getBlockElementsExcludeSubtrees(draggingElements)
      .map(element => getModelByBlockComponent(element))
      .filter((x): x is BaseBlockModel => !!x);
    if (!selectedBlocks.length) return false;

    const targetBlock = this.page.getBlockById(targetBlockId);
    assertExists(targetBlock);

    const shouldInsertIn = dropType === 'in';

    const parent = shouldInsertIn
      ? targetBlock
      : this.page.getParent(targetBlockId);
    assertExists(parent);

    if (shouldInsertIn) {
      this.page.moveBlocks(selectedBlocks, targetBlock);
    } else {
      this.page.moveBlocks(
        selectedBlocks,
        parent,
        targetBlock,
        dropType === 'before'
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
      const parentElement = this._getBlockElementFromViewStore(
        buildPath(parent)
      );
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
      if (
        option.onDragStart?.({
          state,
          startDragging: this.startDragging,
          anchorBlockId: this._anchorBlockId,
          anchorBlockPath: this._anchorBlockPath,
        })
      ) {
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
    if (this._isHoverDragHandleVisible || this._isTopLevelDragHandleVisible) {
      this._hide();
    }

    if (!this.dragging || this.draggingElements.length === 0) {
      return false;
    }

    ctx.get('defaultState').event.preventDefault();

    const state = ctx.get('pointerState');
    this.updateDragPreviewPosition(state);

    for (const option of this.optionRunner.options) {
      if (option.onDragMove?.(state, this.draggingElements)) {
        return true;
      }
    }

    // call default drag move handler if no option return true
    return this._onDragMove(state);
  };

  /**
   * When drag end, should move blocks to drop position
   * @returns
   */
  private _dragEndHandler: UIEventHandler = ctx => {
    this.clearRaf();
    if (
      !this.dragging ||
      !this.dragPreview ||
      this.draggingElements.length === 0 ||
      this.page.readonly
    ) {
      this._hide(true);
      return false;
    }

    const state = ctx.get('pointerState');

    for (const option of this.optionRunner.options) {
      if (
        option.onDragEnd?.({
          state,
          draggingElements: this.draggingElements,
          dropBlockId: this.dropBlockId,
          dropType: this.dropType,
          dragPreview: this.dragPreview,
        })
      ) {
        this._hide(true);
        return true;
      }
    }

    // call default drag end handler if no option return true
    this._onDragEnd(state);
    if (isInsideEdgelessEditor(this.host)) this._checkTopLevelBlockSelection();
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
    if (outOfPageViewPort && !inDragHandle && !inPage) this._hide();
  };

  private _onDragHandlePointerEnter = () => {
    const container = this._dragHandleContainer;
    const grabber = this._dragHandleGrabber;
    if (!container || !grabber) return;

    if (this._isHoverDragHandleVisible) {
      assertExists(this._anchorBlockPath);
      const blockElement = this.anchorBlockElement;
      if (!blockElement) return;

      const padding = DRAG_HANDLE_CONTAINER_PADDING * this.scale;
      container.style.paddingTop = `${padding}px`;
      container.style.paddingBottom = `${padding}px`;
      container.style.transition = `padding 0.25s ease`;

      grabber.style.width = `${
        DRAG_HANDLE_GRABBER_WIDTH_HOVERED * this.scale
      }px`;
      grabber.style.borderRadius = `${
        DRAG_HANDLE_GRABBER_BORDER_RADIUS * this.scale
      }px`;

      this._isDragHandleHovered = true;
    } else if (this._isTopLevelDragHandleVisible) {
      const edgelessElement = this.anchorEdgelessElement;
      if (!edgelessElement) return;

      this._dragHoverRect =
        this._getHoverAreaRectTopLevelBlock(edgelessElement);
      this._isDragHandleHovered = true;
    }
  };

  private _onDragHandlePointerDown = () => {
    if (!this._isHoverDragHandleVisible || !this._anchorBlockPath) return;

    const blockElement = this.anchorBlockElement;
    if (!blockElement) return;

    this._dragHoverRect = this._getDraggingAreaRect(blockElement) ?? null;
  };

  private _onDragHandlePointerUp = () => {
    if (!this._isHoverDragHandleVisible) return;
    this._dragHoverRect = null;
  };

  private _onDragHandlePointerLeave = () => {
    this._isDragHandleHovered = false;
    this._dragHoverRect = null;

    if (this._isTopLevelDragHandleVisible) return;

    if (this.dragging) return;

    if (!this._anchorBlockPath) return;
    this._showDragHandleOnHoverBlock(this._anchorBlockPath).catch(
      console.error
    );
  };

  private _handleEdgelessToolUpdated = (newTool: EdgelessTool) => {
    if (newTool.type === 'default') {
      this._checkTopLevelBlockSelection();
    } else {
      this._hide();
    }
  };

  private _handleEdgelessViewPortUpdated = (zoom: number) => {
    this.scale = zoom;

    this._updateDragPreviewOnZoom();
    this._updateDropIndicatorOnScroll();

    if (this._isTopLevelDragHandleVisible) {
      this._showDragHandleOnTopLevelBlocks();
      this._updateDragHoverRectTopLevelBlock();
    } else {
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
      this._onDragHandlePointerEnter
    );

    this._disposables.addFromEvent(
      this._dragHandleContainer,
      'pointerdown',
      this._onDragHandlePointerDown
    );

    this._disposables.addFromEvent(
      this._dragHandleContainer,
      'pointerup',
      this._onDragHandlePointerUp
    );

    // When pointer leave drag handle grabber, should reset drag handle grabber style
    this._disposables.addFromEvent(
      this._dragHandleContainer,
      'pointerleave',
      this._onDragHandlePointerLeave
    );

    if (isInsideDocEditor(this.host)) {
      const docPage = this.pageBlockElement as DocPageBlockComponent;

      this._disposables.add(
        docPage.slots.viewportUpdated.on(() => this._hide())
      );

      const viewportElement = docPage.viewportElement;
      assertExists(viewportElement);

      this._disposables.addFromEvent(viewportElement, 'scrollend', () => {
        this._updateDropIndicatorOnScroll();
      });
    } else {
      const edgelessPage = this.pageBlockElement as EdgelessPageBlockComponent;

      this._disposables.add(
        edgelessPage.slots.edgelessToolUpdated.on(
          this._handleEdgelessToolUpdated
        )
      );

      this._disposables.add(
        edgelessPage.slots.viewportUpdated.on(({ zoom }) => {
          this._handleEdgelessViewPortUpdated(zoom);
        })
      );

      this._disposables.add(
        edgelessPage.selectionManager.slots.updated.on(() => {
          this._checkTopLevelBlockSelection();
        })
      );

      this._disposables.add(
        edgelessPage.slots.readonlyUpdated.on(() => {
          this._checkTopLevelBlockSelection();
        })
      );

      this._disposables.add(
        edgelessPage.slots.draggingAreaUpdated.on(() => {
          this._checkTopLevelBlockSelection();
        })
      );

      this._disposables.add(
        edgelessPage.slots.elementResizeStart.on(() => {
          this._hide();
        })
      );

      this._disposables.add(
        edgelessPage.slots.elementResizeEnd.on(() => {
          this._checkTopLevelBlockSelection();
        })
      );
    }
  }

  override connectedCallback() {
    super.connectedCallback();
    this.handleEvent('pointerMove', this._pointerMoveHandler);
    this.handleEvent('click', this._clickHandler);
    this.handleEvent('dragStart', this._dragStartHandler);
    this.handleEvent('dragMove', this._dragMoveHandler);
    this.handleEvent('dragEnd', this._dragEndHandler);
    this.handleEvent('pointerOut', this._pointerOutHandler);
    this.handleEvent('beforeInput', () => this._hide());
  }

  override disconnectedCallback() {
    this._hide(true);
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
