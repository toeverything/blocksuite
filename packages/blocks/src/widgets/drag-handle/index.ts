import type {
  BaseSelection,
  BlockSelection,
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
  getClosestBlockElementByPoint,
  Point,
} from '../../__internal__/index.js';
import { DRAG_HANDLE_HEIGHT, DRAG_HANDLE_WIDTH, styles } from './styles.js';

@customElement('affine-drag-handle-widget')
export class DragHandleWidget extends WidgetElement {
  static override styles = styles;

  @query('.affine-drag-handle-container')
  private _dragHandleContainer!: HTMLDivElement;

  @query('.affine-drag-handle')
  private _dragHandle!: HTMLDivElement;

  @query('.affine-drag-preview')
  private _dragPreview!: HTMLDivElement;

  @state()
  private _indicatorRect: {
    width: number;
    height: number;
    left: number;
    top: number;
  } | null = null;

  private _scale = 1;

  private _hoveredBlockId = '';
  private _hoveredBlockPath: string[] | null = null;
  private _dropBlockId = '';

  private _dragging = false;

  protected get selectedBlocks() {
    return this.root.selectionManager.value;
  }

  hide(force = false) {
    this._dragHandleContainer.style.display = 'none';
    if (force) this.reset();
  }

  reset() {
    this._dragging = false;
    this._indicatorRect = null;
    this._dragPreview.style.display = 'none';
    this._hoveredBlockId = '';
    this._hoveredBlockPath = null;
  }

  setPointerEvents(value: 'auto' | 'none') {
    this.style.pointerEvents = value;
  }

  setScale(value = 1) {
    this._scale = value;
  }

  private _findBlockSelection(blockId: string) {
    const selections = this.selectedBlocks;
    return selections.find((selection): selection is BlockSelection => {
      return selection.blockId === blockId && selection.type === 'block';
    });
  }

  private _containBlock(selections: BaseSelection[], blockId: string) {
    return selections.some(selection => {
      return selection.blockId === blockId;
    });
  }

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

  override firstUpdated() {
    this.hide();
  }

  private _calcDragHandleY(
    clientY: number,
    startY: number,
    height: number,
    scale: number
  ) {
    return (
      Math.max(
        0,
        Math.min(
          clientY - startY - (DRAG_HANDLE_HEIGHT * scale) / 2,
          height - DRAG_HANDLE_HEIGHT * scale
        )
      ) / scale
    );
  }

  private _captureEventTarget = (target: EventTarget | null) => {
    const element =
      target instanceof Element
        ? target
        : target instanceof Node
        ? target.parentElement
        : null;

    if (!element) {
      return null;
    }

    return element;
  };

  /**
   * When pointer move on block, should show drag handle
   * @param ctx
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
    const { height, left, top, width } = blockElement.getBoundingClientRect();
    const block = this._findBlockSelection(blockId);
    this.toggleAttribute('data-selected', !!block);
    this._dragHandleContainer.style.display = 'block';
    this._dragHandleContainer.style.height = `${height / this._scale}px`;
    this._dragHandleContainer.style.width = `${DRAG_HANDLE_WIDTH}px`;

    // TODO: update drag handle position
    const posX =
      left - (DRAG_HANDLE_WIDTH + DRAG_HANDLE_OFFSET_LEFT) * this._scale;
    const posY = top;
    const offsetY = this._calcDragHandleY(state.y, top, height, this._scale);

    this._dragHandleContainer.style.transform = `translate(${posX}px, ${posY}px) scale(${this._scale})`;
    this._dragHandleContainer.style.opacity = `${(
      1 -
      (state.x - left) / width
    ).toFixed(2)}`;
    this._dragHandle.style.transform = `translateY(${offsetY}px)`;
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

    // When pointer not on note block, should hide drag handle
    if (!element.closest('affine-note')) {
      this.hide();
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
   * WHen drag start, should create drag preview
   * When dragging, should update drag preview position
   * @returns
   */
  private _createDragPreview() {
    const fragment = document.createDocumentFragment();
    const selections = this.root.selectionManager.value;
    selections
      .map(selection => {
        return this.root.blockViewMap.get(selection.path as string[]);
      })
      .filter((element): element is BlockElement<BaseBlockModel> => !!element)
      .forEach(element => {
        const container = document.createElement('div');
        render(element.render(), container);
        fragment.appendChild(container);
      });
    return fragment;
  }

  /**
   * When start dragging, should create drag preview
   * @param ctx
   * @returns
   */
  private _dragStartHandler: UIEventHandler = ctx => {
    const state = ctx.get('pointerState');
    const { target } = state.raw;
    const element = this._captureEventTarget(target);

    const inside = !!element?.closest('.affine-drag-handle-container');
    if (
      !inside ||
      !this._dragPreview ||
      !this._hoveredBlockId ||
      !this._hoveredBlockPath
    ) {
      return;
    }

    // Get current hover block eleemnt by path
    const blockElement = this.root.blockViewMap.get(this._hoveredBlockPath);
    if (!blockElement) {
      return;
    }

    // When there is no selected blocks
    // Or selected blocks not include current hover block
    // Set current hover block as selected
    const selections = this.selectedBlocks;
    if (
      selections.length === 0 ||
      !this._containBlock(selections, this._hoveredBlockId)
    ) {
      this._setSelectedBlock(this._hoveredBlockId, this._hoveredBlockPath);
    }

    // Create drag preview fragment and append it to drag preview element
    const fragment = this._createDragPreview();

    this._dragging = true;

    const { left, top, width } = blockElement.getBoundingClientRect();
    this._dragPreview.classList.add('grabbing');
    this._dragPreview.style.display = 'block';
    this._dragPreview.style.width = `${width}px`;

    // TODO: update drag preview div position
    const posX =
      left - (DRAG_HANDLE_WIDTH + DRAG_HANDLE_OFFSET_LEFT) * this._scale;
    const posY = top;

    this._dragPreview.style.transform = `translate(${posX}px, ${posY}px) scale(${this._scale})`;

    this._dragPreview.appendChild(fragment);
    return true;
  };

  /**
   * When dragging, should update indicator position
   * @param ctx
   * @returns
   */
  private _updateIndicator: UIEventHandler = ctx => {
    const state = ctx.get('pointerState');
    const point = new Point(state.point.x, state.point.y);
    const closestBlockElement = getClosestBlockElementByPoint(point.clone());
    if (!closestBlockElement) {
      this._indicatorRect = null;
      return;
    }

    const currentBlockElement = closestBlockElement as BlockElement;
    const blockId = closestBlockElement.getAttribute(this.root.blockIdAttr);
    const blockPath = currentBlockElement.path;
    assertExists(blockId);

    // Should make sure drop block id is not in selected blocks
    // Or in the children of selected blocks
    if (
      this._containBlock(this.selectedBlocks, blockId) ||
      this._containChildBlock(this.selectedBlocks, blockPath)
    ) {
      return;
    }

    this._dropBlockId = blockId;

    const rect = closestBlockElement.getBoundingClientRect();
    this._indicatorRect = {
      width: rect.width,
      height: 3 * this._scale,
      left: rect.left,
      top: rect.bottom,
    };
  };

  /**
   * When dragging, should update drag preview position
   * When dragging, should update indicator position
   * When dragging, should update drop block id
   * @param ctx
   * @returns
   */
  private _dragMoveHandler: UIEventHandler = ctx => {
    if (!this._dragging || !this._hoveredBlockPath) {
      return;
    }

    const state = ctx.get('pointerState');
    // TODO: should use block path
    const blockElement = this.root.blockViewMap.get(this._hoveredBlockPath);
    if (!blockElement) {
      return;
    }

    this._updateIndicator(ctx);
    const { width } = blockElement.getBoundingClientRect();
    this._dragPreview.style.display = 'block';
    this._dragPreview.style.width = `${width}px`;

    const posX = state.x;
    const posY = state.y;

    this._dragPreview.style.transform = `translate(${posX}px, ${posY}px) scale(${this._scale})`;
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
    // Before drop blocks, should clear drag preview
    this._dragPreview.textContent = '';

    const targetBlockId = this._dropBlockId;
    this._dragging = false;
    this._dragPreview.style.display = 'none';
    this._indicatorRect = null;
    this._dropBlockId = '';

    // Should make sure drop block id is not in selected blocks
    if (this._containBlock(this.selectedBlocks, targetBlockId)) {
      return;
    }

    const selectedBlocks = this.selectedBlocks
      .map(x => x.blockId)
      .map(id => this.page.getBlockById(id))
      .filter((x): x is BaseBlockModel => !!x);
    const targetBlock = this.page.getBlockById(targetBlockId);
    const parent = this.page.getParent(targetBlockId);
    if (targetBlock && parent && selectedBlocks.length > 0) {
      this.page.moveBlocks(selectedBlocks, parent, targetBlock, false);
    }

    return true;
  };

  override connectedCallback() {
    super.connectedCallback();
    this.handleEvent('pointerMove', this._pointerMoveHandler);
    this.handleEvent('click', this._clickHandler);
    this.handleEvent('dragStart', this._dragStartHandler);
    this.handleEvent('dragMove', this._dragMoveHandler, {
      global: true,
    });
    this.handleEvent('dragEnd', this._dragEndHandler);
  }

  override disconnectedCallback() {
    this.hide(true);

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
