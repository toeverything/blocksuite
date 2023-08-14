import {
  type PointerEventState,
  type UIEventHandler,
  type UIEventStateContext,
} from '@blocksuite/block-std';
import { DRAG_HANDLE_OFFSET_LEFT } from '@blocksuite/global/config';
import { assertExists } from '@blocksuite/global/utils';
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
  getModelByBlockElement,
  isPageMode,
  Point,
  Rect,
} from '../../__internal__/index.js';
import { DocPageBlockComponent } from '../../page-block/doc/doc-page-block.js';
import { EdgelessPageBlockComponent } from '../../page-block/edgeless/edgeless-page-block.js';
import { autoScroll } from '../../page-block/text-selection/utils.js';
import {
  DRAG_HANDLE_GRABBER_BORDER_RADIUS,
  DRAG_HANDLE_GRABBER_HEIGHT,
  DRAG_HANDLE_GRABBER_WIDTH,
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
} from './utils.js';

@customElement('affine-drag-handle-widget')
export class DragHandleWidget extends WidgetElement {
  static override styles = styles;

  @query('.affine-drag-handle-container')
  private _dragHandleContainer!: HTMLDivElement;

  @query('.affine-drag-handle-grabber')
  private _dragHandleGrabber!: HTMLDivElement;

  @state()
  private _indicatorRect: {
    width: number;
    height: number;
    left: number;
    top: number;
  } | null = null;

  private _hoveredBlockId = '';
  private _hoveredBlockPath: string[] | null = null;
  private _dropBlockId = '';
  private _dropBefore = false;

  private _scale = 1;

  private _draggingElements: BlockElement[] = [];
  private _dragging = false;
  private _dragPreviewOffsetY = 0;
  private _dragPreview: DragPreview | null = null;

  private _rafID = 0;

  protected get _selectedBlocks() {
    return this.root.selectionManager.value.filter(
      selection => selection.type !== 'surface'
    );
  }

  public hide(force = false) {
    this._dragHandleContainer.style.display = 'none';
    if (force) this.reset();
  }

  public reset() {
    this._dragging = false;
    this._indicatorRect = null;
    this._hoveredBlockId = '';
    this._hoveredBlockPath = null;
    this._draggingElements = [];
    this._dropBlockId = '';
    this._dropBefore = false;
    this._dragPreviewOffsetY = 0;
    this._rafID = 0;
  }

  private _clearRaf() {
    if (this._rafID) {
      cancelAnimationFrame(this._rafID);
      this._rafID = 0;
    }
  }

  // drag handle should show on the vertical middle of the first line of element
  private _show(point: Point, blockElement: BlockElement) {
    const { left, top, width } = blockElement.getBoundingClientRect();

    const containerHeight = getDragHandleContainerHeight(blockElement.model);
    this._dragHandleContainer.style.display = 'flex';
    this._dragHandleContainer.style.height = `${
      containerHeight * this._scale
    }px`;
    this._dragHandleContainer.style.width = `${
      DRAG_HANDLE_WIDTH * this._scale
    }px`;

    // TODO: optimize drag handle position with different hover block
    const posLeft =
      left - (DRAG_HANDLE_WIDTH + DRAG_HANDLE_OFFSET_LEFT) * this._scale;
    const posTop = top;
    this._dragHandleContainer.style.left = `${posLeft}px`;
    this._dragHandleContainer.style.top = `${posTop}px`;
    this._dragHandleContainer.style.opacity = `${(
      1 -
      (point.x - left) / width
    ).toFixed(2)}`;

    this._dragHandleGrabber.style.height = `${
      DRAG_HANDLE_GRABBER_HEIGHT * this._scale
    }px`;
    this._dragHandleGrabber.style.width = `${
      DRAG_HANDLE_GRABBER_WIDTH * this._scale
    }px`;
    this._dragHandleGrabber.style.borderRadius = `${
      DRAG_HANDLE_GRABBER_BORDER_RADIUS * this._scale
    }px`;
  }

  private _setSelectedBlocks(blockElements: BlockElement[], noteId?: string) {
    const { selectionManager } = this.root;
    const selections = blockElements.map(blockElement =>
      selectionManager.getInstance('block', {
        path: blockElement.path,
      })
    );

    // When current page is edgeless page
    // We need to remain surface selection and set editing as true
    if (this._pageBlockElement instanceof EdgelessPageBlockComponent) {
      const surfaceElementId = noteId ? noteId : getNoteId(blockElements[0]);
      const surfaceSelection = selectionManager.getInstance(
        'surface',
        [surfaceElementId],
        true
      );

      selections.push(surfaceSelection);
    }

    selectionManager.set(selections);
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
    const noteSelector = 'affine-note';
    const closeNoteBlock = findClosestBlockElement(
      this._pageBlockElement,
      point,
      noteSelector
    );
    if (!closeNoteBlock) return null;
    const noteRect = Rect.fromDOM(closeNoteBlock);
    const blockElement = getClosestBlockElementByPoint(point, {
      container: closeNoteBlock,
      rect: noteRect,
    });
    const blockSelector =
      '.affine-note-block-container > .affine-block-children-container > [data-block-id]';
    const closestBlockElement = (
      blockElement
        ? blockElement
        : findClosestBlockElement(
            closeNoteBlock as BlockElement,
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
      if (
        blockElements[i].path.join('|') === hoverBlockElement.path.join('|')
      ) {
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
      edgelessPage.selection.editing &&
      edgelessPage.selection.state.elements[0] === noteBlockId
    );
  };

  private _getClosestNoteBlock = (point: Point) => {
    const noteSelector = 'affine-note';
    return findClosestBlockElement(this._pageBlockElement, point, noteSelector);
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
        ? point.y < rect.top || point.y > rect.bottom
        : point.y < rect.top ||
          point.y > rect.bottom ||
          point.x < rect.left - padding ||
          point.x > rect.right + padding
      : true;
  };

  /**
   * When dragging, should update indicator position and target drop block id
   */
  private _updateIndicator = (ctx: UIEventStateContext) => {
    const state = ctx.get('pointerState');
    const point = this._getContainerOffsetPoint(state);
    const closestBlockElement = this._getClosestBlockElementByPoint(point);
    if (!closestBlockElement) {
      this._dropBlockId = '';
      this._indicatorRect = null;
      return;
    }

    const blockId = closestBlockElement.getAttribute(this.root.blockIdAttr);
    const blockPath = closestBlockElement.path;
    assertExists(blockId);
    assertExists(blockPath);

    // Should make sure that target drop block is
    // neither within the selected block
    // nor a child-block of any selected block
    if (
      containBlock(this._selectedBlocks, blockId) ||
      containChildBlock(this._selectedBlocks, blockPath)
    ) {
      this._dropBlockId = '';
      return;
    }

    this._dropBlockId = blockId;

    let rect = null;
    let targetElement = null;
    const model = getModelByBlockElement(closestBlockElement);
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

    this._indicatorRect = rect;
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

    if (insideDatabaseTable(closestBlockElement)) {
      this.hide();
      return;
    }
    this._show(point, closestBlockElement);
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

    const { selectionManager } = this.root;
    const selectedBlocks = this._selectedBlocks;

    // Should clear selection if current block is the first selected block
    if (
      selectedBlocks.length > 0 &&
      !includeTextSelection(selectedBlocks) &&
      selectedBlocks[0].blockId === this._hoveredBlockId
    ) {
      selectionManager.clear(['block']);
      return;
    }

    // Should select the block if current block is not selected
    const blockElement = this.root.viewStore.viewFromPath(
      'block',
      this._hoveredBlockPath
    );

    assertExists(blockElement);

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
    const hoverBlockElement = this.root.viewStore.viewFromPath(
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
            match: el => el.role === 'content',
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
      !containBlock(selections, this._hoveredBlockId)
    ) {
      const blockElement = this.root.viewStore.viewFromPath(
        'block',
        this._hoveredBlockPath
      );
      assertExists(blockElement);

      this._setSelectedBlocks([blockElement]);
    }

    const blockElements = this._selectedBlocks
      .map(selection => {
        return this.root.viewStore.viewFromPath(
          'block',
          selection.path as string[]
        );
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
    this.hide();

    return true;
  };

  /**
   * When dragging, should:
   * Update drag preview position
   * Update indicator position
   * Update drop block id
   */
  private _dragMoveHandler: UIEventHandler = ctx => {
    this._clearRaf();
    if (!this._dragging || this._draggingElements.length === 0) {
      return;
    }

    ctx.get('defaultState').event.preventDefault();

    const runner = () => {
      const state = ctx.get('pointerState');
      const point = this._getContainerOffsetPoint(state);
      const closestNoteBlock = this._getClosestNoteBlock(point);
      if (!closestNoteBlock || this._outOfNoteBlock(closestNoteBlock, point)) {
        this._dropBlockId = '';
        this._indicatorRect = null;
      } else {
        this._updateIndicator(ctx);
      }

      const previewPos = new Point(state.point.x, state.point.y);
      if (this._dragPreview)
        this._updateDragPreviewPosition(this._dragPreview, previewPos);

      if (this._pageBlockElement instanceof DocPageBlockComponent) {
        const result = autoScroll(
          this._pageBlockElement.viewportElement,
          state.y
        );
        if (!result) {
          this._clearRaf();
          return;
        }
        this._rafID = requestAnimationFrame(runner);
      } else {
        this._clearRaf();
      }
    };

    this._rafID = requestAnimationFrame(runner);

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
      this.hide(true);
      return;
    }

    const targetBlockId = this._dropBlockId;
    const shouldInsertBefore = this._dropBefore;
    const draggingElements = this._draggingElements;

    this.hide(true);
    if (!targetBlockId) return;

    // Should make sure drop block id is not in selected blocks
    if (containBlock(this._selectedBlocks, targetBlockId)) {
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
          .map(path => this.root.viewStore.viewFromPath('block', path));

        if (!newSelectedBlocks) return;

        const noteId = getNoteId(parentElement);
        this._setSelectedBlocks(newSelectedBlocks as BlockElement[], noteId);
      }
    }, 0);

    return true;
  };

  /**
   * Should hide drag handle when wheel
   */
  private _wheelHandler: UIEventHandler = ctx => {
    this.hide();
    if (!this._dragging || this._draggingElements.length === 0) {
      return;
    }

    const state = ctx.get('defaultState');
    const event = state.event as WheelEvent;
    event.preventDefault();

    return true;
  };

  private _pointerOutHandler: UIEventHandler = ctx => {
    const state = ctx.get('pointerState');
    state.raw.preventDefault();

    const { target } = state.raw;
    const element = captureEventTarget(target);
    if (!element) return;

    const { relatedTarget } = state.raw;
    const relatedElement = captureEventTarget(relatedTarget);
    const outOfPage = element.classList.contains('affine-doc-viewport');
    const inDragHandle = !!relatedElement?.closest('affine-drag-handle-widget');
    if (outOfPage && !inDragHandle) {
      this.hide();
    }

    return true;
  };

  override firstUpdated() {
    this.hide(true);
  }

  override connectedCallback() {
    super.connectedCallback();
    this.handleEvent('pointerMove', this._pointerMoveHandler);
    this.handleEvent('click', this._clickHandler);
    this.handleEvent('dragStart', this._dragStartHandler);
    this.handleEvent('dragMove', this._dragMoveHandler);
    this.handleEvent('dragEnd', this._dragEndHandler);
    this.handleEvent('wheel', this._wheelHandler);
    this.handleEvent('pointerOut', this._pointerOutHandler);
    this.handleEvent('beforeInput', () => this.hide());

    if (this._pageBlockElement instanceof EdgelessPageBlockComponent) {
      const edgelessPage = this._pageBlockElement;
      this._disposables.add(
        edgelessPage.slots.edgelessToolUpdated.on(newTool => {
          if (newTool.type !== 'default') this.hide();
        })
      );
      this._disposables.add(
        edgelessPage.slots.viewportUpdated.on(() => {
          this.hide();
          this._scale = edgelessPage.surface.viewport.zoom;
        })
      );
    }
  }

  override disconnectedCallback() {
    this.hide(true);
    this._removeDragPreview();
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

    return html`
      <div class="affine-drag-handle-widget">
        <div class="affine-drag-handle-container">
          <div class="affine-drag-handle">
            <div class="affine-drag-handle-grabber"></div>
          </div>
        </div>
        <div class="affine-drag-indicator" style=${indicatorStyle}></div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-drag-handle-widget': DragHandleWidget;
  }
}
