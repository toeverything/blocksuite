import type {
  BaseSelection,
  PointerEventState,
  UIEventHandler,
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
  getClosestBlockElementByPoint,
  getModelByBlockElement,
  Point,
} from '../../__internal__/index.js';
import type { DefaultPageBlockComponent } from '../../page-block/index.js';
import { DRAG_HANDLE_WIDTH, styles } from './styles.js';

@customElement('affine-drag-handle-widget')
export class DragHandleWidget extends WidgetElement {
  static override styles = styles;

  @query('.affine-drag-handle-container')
  private _dragHandleContainer!: HTMLDivElement;

  // @query('.affine-drag-handle')
  // private _dragHandle!: HTMLDivElement;

  @query('.affine-drag-preview')
  private _dragPreview!: HTMLDivElement;

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
  private _offset: {
    top: number;
    left: number;
  } = {
    top: 0,
    left: 0,
  };

  private _draggingElements: BlockElement[] = [];
  private _dragging = false;

  protected get selectedBlocks() {
    return this.root.selectionManager.value;
  }

  private _hide(force = false) {
    this._dragHandleContainer.style.display = 'none';
    if (force) this._reset();
  }

  private _reset() {
    this._dragging = false;
    this._indicatorRect = null;
    this._dragPreview.textContent = '';
    this._dragPreview.style.display = 'none';
    this._hoveredBlockId = '';
    this._hoveredBlockPath = null;
    this._draggingElements = [];
    this._dropBlockId = '';
    this._dropBefore = false;
    this._offset = {
      left: 0,
      top: 0,
    };
  }

  /**
   * Show drag handle
   * @param blockElement BlockElement
   * @param state PointerEventState
   */
  private _show(blockElement: BlockElement, state: PointerEventState) {
    const { height, left, top } = blockElement.getBoundingClientRect();
    this._dragHandleContainer.style.display = 'block';
    this._dragHandleContainer.style.height = `${height / this._scale}px`;
    this._dragHandleContainer.style.width = `${DRAG_HANDLE_WIDTH}px`;

    // TODO: optimize drag handle position with different hover block
    const posX =
      left - (DRAG_HANDLE_WIDTH + DRAG_HANDLE_OFFSET_LEFT) * this._scale;
    const posY = top;

    this._dragHandleContainer.style.transform = `translate(${posX}px, ${posY}px) scale(${this._scale})`;
  }

  private _containBlock(selections: BaseSelection[], blockId: string) {
    return selections.some(selection => {
      return selection.blockId === blockId;
    });
  }

  // To check if the block is a child block of the selected blocks
  private _containChildBlock(selections: BaseSelection[], childPath: string[]) {
    return selections.some(selection => {
      const { path } = selection;
      if (path.length > childPath.length) {
        return false;
      }
      return path.join('|') === childPath.slice(0, -1).join('|');
    });
  }

  private _setSelectedBlock(blockId: string, path: string[]) {
    const { selectionManager } = this.root;
    selectionManager.set([
      selectionManager.getInstance('block', {
        blockId,
        path,
      }),
    ]);
  }

  private get _viewportElement() {
    const pageBlock = this.hostElement as DefaultPageBlockComponent;
    assertExists(pageBlock);

    return pageBlock.viewportElement;
  }

  private get _rangeController() {
    const pageBlock = this.hostElement as DefaultPageBlockComponent;
    assertExists(pageBlock);

    return pageBlock.rangeController;
  }

  private _captureEventTarget = (target: EventTarget | null) => {
    const isElementOrNode = target instanceof Element || target instanceof Node;
    return isElementOrNode
      ? target instanceof Element
        ? target
        : target.parentElement
      : null;
  };

  private _createDragPreview(
    blockElements: BlockElement[],
    hoverBlockElement: BlockElement
  ) {
    const fragment = document.createDocumentFragment();
    blockElements.forEach(element => {
      const container = document.createElement('div');
      container.classList.add('affine-block-element');
      render(element.render(), container);
      fragment.appendChild(container);
    });

    const viewportElement = this._viewportElement;
    this._offset = {
      left: viewportElement.scrollLeft,
      top: viewportElement.scrollTop,
    };

    const { left, top, width } = hoverBlockElement.getBoundingClientRect();
    const posX = left + this._offset.left;
    const posY = top + this._offset.top;
    this._dragPreview.style.width = `${width}px`;
    this._dragPreview.style.transform = `translate(${posX}px, ${posY}px) scale(${this._scale})`;
    this._dragPreview.classList.add('grabbing');
    this._dragPreview.style.display = 'block';

    this._dragPreview.appendChild(fragment);
  }

  private _updateDragPreviewPosition(state: PointerEventState) {
    const { scrollTop, scrollLeft } = this._viewportElement;
    const posX = state.x + scrollLeft;
    const posY = state.y + scrollTop;

    this._dragPreview.style.transform = `translate(${posX}px, ${posY}px) scale(${this._scale})`;
  }

  /**
   * When dragging, should update indicator position and target drop block id
   */
  private _updateIndicator: UIEventHandler = ctx => {
    const state = ctx.get('pointerState');
    const point = new Point(state.point.x, state.point.y);
    const closestBlockElement = getClosestBlockElementByPoint(
      point.clone()
    ) as BlockElement;
    if (!closestBlockElement) {
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
      this._containBlock(this.selectedBlocks, blockId) ||
      this._containChildBlock(this.selectedBlocks, blockPath)
    ) {
      return;
    }

    this._dropBlockId = blockId;

    let rect = null;
    let tragetElement = null;
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
      tragetElement = result.modelState.element;
      this._dropBefore = result.type === 'before' ? true : false;
    }

    if (tragetElement) {
      const targetBlockId = tragetElement.getAttribute(this.root.blockIdAttr);
      if (targetBlockId) this._dropBlockId = targetBlockId;
    }

    this._indicatorRect = rect;
  };

  /**
   * When pointer move on block, should show drag handle
   * And update hover block id and path
   * @param ctx UIEventStateContext
   * @returns
   */
  private _pointerMoveOnBlock: UIEventHandler = ctx => {
    const state = ctx.get('pointerState');
    const point = new Point(state.point.x, state.point.y);
    const blockElement = getClosestBlockElementByPoint(
      point.clone()
    ) as BlockElement;
    if (!blockElement) {
      this._hoveredBlockId = '';
      this._hoveredBlockPath = null;
      return;
    }

    const blockId = blockElement.getAttribute(this.root.blockIdAttr);
    const blockPath = blockElement.path;
    assertExists(blockId);
    assertExists(blockPath);

    this._hoveredBlockId = blockId;
    this._hoveredBlockPath = blockPath;
    // const block = this._findBlockSelection(blockId);
    // this.toggleAttribute('data-selected', !!block);
    this._show(blockElement, state);
  };

  /**
   * When pointer move on page, should hide the drag handle if not on block
   * When pointer move on block, should show drag handle
   * @param ctx
   * @returns
   */
  private _pointerMoveHandler: UIEventHandler = ctx => {
    const state = ctx.get('pointerState');
    const { target } = state.raw;
    const element = this._captureEventTarget(target);

    // WHen pointer not on block or on dragging, should do nothing
    if (!element || this._dragging) {
      return;
    }

    // When pointer on drag handle, should do nothing
    if (element.closest('.affine-drag-handle-container')) {
      return;
    }

    if (!element.closest('affine-note')) {
      this._hide();
      this._hoveredBlockId = '';
      this._hoveredBlockPath = null;
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
    const element = this._captureEventTarget(target);

    if (
      !this._hoveredBlockId ||
      !this._hoveredBlockPath ||
      !element ||
      !element.closest('.affine-drag-handle-container')
    ) {
      return;
    }

    const { selectionManager } = this.root;

    // Should clear selection if current block is the first selected block
    if (
      this.selectedBlocks.length > 0 &&
      this.selectedBlocks[0].blockId === this._hoveredBlockId
    ) {
      selectionManager.clear();
      return;
    }

    // Should select the block if current block is not selected
    this._setSelectedBlock(this._hoveredBlockId, this._hoveredBlockPath);

    // TODO: show slash menu

    return true;
  };

  /**
   * When start dragging, should set dragging elements and create drag preview
   */
  private _dragStartHandler: UIEventHandler = ctx => {
    const state = ctx.get('pointerState');
    const { target } = state.raw;
    const element = this._captureEventTarget(target);

    const inside = !!element?.closest('.affine-drag-handle-container');
    if (!inside || !this._hoveredBlockId || !this._hoveredBlockPath) {
      return;
    }

    // Get current hover block eleemnt by path
    const hoverBlockElement = this.root.blockViewMap.get(
      this._hoveredBlockPath
    );
    if (!hoverBlockElement) {
      return;
    }

    let selections = this.selectedBlocks;

    // When current selection is TextSelection
    // Should set BlockSelection for the blocks in native range
    if (selections.length > 0 && selections[0].type === 'text') {
      const nativeSelection = document.getSelection();
      if (nativeSelection && nativeSelection.rangeCount > 0) {
        const range = nativeSelection.getRangeAt(0);
        const blockElements =
          this._rangeController.findBlockElementsByRange(range);
        const blockSelections = blockElements.map(element => {
          return this.root.selectionManager.getInstance('block', {
            blockId: element.path[element.path.length - 1],
            path: element.path,
          });
        });
        this.root.selectionManager.set(blockSelections);
        selections = this.selectedBlocks;
      }
    }

    // When there is no selected blocks
    // Or selected blocks not including current hover block
    // Set current hover block as selected
    if (
      selections.length === 0 ||
      !this._containBlock(selections, this._hoveredBlockId)
    ) {
      this._setSelectedBlock(this._hoveredBlockId, this._hoveredBlockPath);
    }

    const blockElements = this.selectedBlocks
      .map(selection => {
        return this.root.blockViewMap.get(selection.path as string[]);
      })
      .filter((element): element is BlockElement<BaseBlockModel> => !!element);

    this._createDragPreview(blockElements, hoverBlockElement);
    this._draggingElements = blockElements;
    this._dragging = true;

    return true;
  };

  /**
   * When dragging, should:
   * Update drag preview position
   * Update indicator position
   * Update drop block id
   */
  private _dragMoveHandler: UIEventHandler = ctx => {
    if (
      !this._dragging ||
      !this._hoveredBlockPath ||
      this._draggingElements.length === 0
    ) {
      return;
    }

    const state = ctx.get('pointerState');
    const blockElement = this.root.blockViewMap.get(this._hoveredBlockPath);
    if (!blockElement) {
      return;
    }

    this._updateIndicator(ctx);
    this._updateDragPreviewPosition(state);
    return true;
  };

  /**
   * When drag end, should move blocks to drop position
   * @returns
   */
  private _dragEndHandler: UIEventHandler = () => {
    if (!this._dragging) {
      return;
    }

    const targetBlockId = this._dropBlockId;
    const shouldInsertBefore = this._dropBefore;
    const draggingElements = this._draggingElements;

    this._hide(true);

    // Should make sure drop block id is not in selected blocks
    if (this._containBlock(this.selectedBlocks, targetBlockId)) {
      return;
    }

    const selectedBlocks = draggingElements
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

    return true;
  };

  /**
   * TODO: should hide drag handle when wheel
   * Should update drag preview position when wheel if dragging
   * @param ctx UIEventStateContext
   * @returns
   */
  private _wheelHandler: UIEventHandler = ctx => {
    this._hide();
    if (!this._dragging) {
      return;
    }
  };

  override firstUpdated() {
    this._hide();
  }

  override connectedCallback() {
    super.connectedCallback();
    this.handleEvent('pointerMove', this._pointerMoveHandler);
    this.handleEvent('click', this._clickHandler);
    this.handleEvent('dragStart', this._dragStartHandler);
    this.handleEvent('dragMove', this._dragMoveHandler);
    this.handleEvent('dragEnd', this._dragEndHandler);
    this.handleEvent('wheel', this._wheelHandler);
  }

  override disconnectedCallback() {
    this._hide(true);
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
      <div class="affine-drag-handle-container">
        <div class="affine-drag-handle-line"></div>
        <div class="affine-drag-handle">
          <svg
            class="affine-drag-handle-normal"
            width="4"
            height="12"
            viewBox="0 0 4 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="4" height="12" rx="1" fill="#C0BFC1" />
          </svg>
          <svg
            class="affine-drag-handle-hover"
            xmlns="http://www.w3.org/2000/svg"
            width="3"
            height="16"
            viewBox="0 0 3 16"
            fill="none"
          >
            <rect width="3" height="16" rx="1" fill="#C0BFC1" />
          </svg>
        </div>
      </div>
      <div class="affine-drag-preview"></div>
      <div class="affine-drag-indicator" style=${indicatorStyle}></div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-drag-handle-widget': DragHandleWidget;
  }
}
