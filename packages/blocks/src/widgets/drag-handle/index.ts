import type { BlockSelection, UIEventHandler } from '@blocksuite/block-std';
import { DRAG_HANDLE_OFFSET_LEFT } from '@blocksuite/global/config';
import { assertExists } from '@blocksuite/global/utils';
import type { BlockElement } from '@blocksuite/lit';
import { WidgetElement } from '@blocksuite/lit';
import type { BaseBlockModel } from '@blocksuite/store';
import { css, html, render } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { Rect } from '../../__internal__/index.js';
import {
  getClosestBlockElementByPoint,
  Point,
} from '../../__internal__/index.js';

const DRAG_HANDLE_HEIGHT = 16; // px FIXME
const DRAG_HANDLE_WIDTH = 24; // px

@customElement('affine-drag-handle-widget')
export class DragHandleWidget extends WidgetElement {
  static override styles = css`
    .affine-drag-indicator {
      position: fixed;
      top: 0;
      left: 0;
      background: var(--affine-primary-color);
      transition-property: width, height, transform;
      transition-duration: 100ms;
      transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
      transition-delay: 0s;
      transform-origin: 0 0;
      pointer-events: none;
      z-index: 2;
    }

    .affine-drag-preview {
      top: 0;
      left: 0;
      position: fixed;
      overflow: hidden;
    }

    .affine-drag-handle-container {
      top: 0;
      left: 0;
      position: fixed;
      overflow: hidden;
      width: ${DRAG_HANDLE_WIDTH + 8}px;
      transform-origin: 0 0;
      pointer-events: none;
      user-select: none;
    }

    .affine-drag-handle-line {
      opacity: 0;
      width: 1px;
      height: 100%;
      position: absolute;
      left: ${(DRAG_HANDLE_WIDTH - 1) / 2}px;
      background-color: var(--affine-icon-color);
      transition: opacity ease-in-out 300ms;
      pointer-events: none;
    }

    .affine-drag-handle {
      position: absolute;
      display: flex;
      align-items: center;
      justify-content: center;
      width: ${DRAG_HANDLE_WIDTH}px;
      height: ${DRAG_HANDLE_HEIGHT}px;
      pointer-events: auto;
      color: var(--affine-icon-color);
    }

    @media print {
      .affine-drag-handle-line {
        display: none;
      }

      .affine-drag-handle {
        display: none;
      }
    }

    .affine-drag-handle-normal {
      display: flex;
      stroke: currentcolor;
    }

    .affine-drag-handle-hover {
      fill: currentcolor;
      transition: opacity ease-in-out 300ms;
    }

    .affine-drag-handle-hover path.ok {
      stroke: var(--affine-white-90);
    }

    .affine-drag-handle-hover {
      display: none;
    }

    .affine-drag-handle-container:hover > .affine-drag-handle {
      cursor: grab;
    }

    .affine-drag-handle-container:hover > .affine-drag-handle-line {
      opacity: 1;
    }

    .affine-drag-handle-container:hover .affine-drag-handle-normal,
    .affine-drag-handle-container[data-selected] .affine-drag-handle-normal {
      display: none !important;
    }

    .affine-drag-handle-container:hover .affine-drag-handle-hover,
    .affine-drag-handle-container[data-selected] .affine-drag-handle-hover {
      display: flex !important;
    }
  `;

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
  private _dropBlockId = '';

  private _dragging = false;

  protected get selectedBlocks() {
    return this.root.selectionManager.selections;
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
  }

  setPointerEvents(value: 'auto' | 'none') {
    this.style.pointerEvents = value;
  }

  setScale(value = 1) {
    this._scale = value;
  }

  private _findBlockSelection(blockId: string) {
    const selections = this.root.selectionManager.selections;
    return selections.find((selection): selection is BlockSelection => {
      return selection.blockId === blockId && selection.type === 'block';
    });
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

  private _pointerMoveOnBlock: UIEventHandler = ctx => {
    const state = ctx.get('pointerState');
    const point = new Point(state.point.x, state.point.y);
    const blockElement = getClosestBlockElementByPoint(point.clone());
    if (!blockElement) {
      this._hoveredBlockId = '';
      return;
    }

    const blockId = blockElement.getAttribute(this.root.blockIdAttr);
    assertExists(blockId);

    this._hoveredBlockId = blockId;
    const { height, left, top, width } = blockElement.getBoundingClientRect();
    const block = this._findBlockSelection(blockId);
    this.toggleAttribute('data-selected', !!block);
    this._dragHandleContainer.style.display = 'block';
    this._dragHandleContainer.style.height = `${height / this._scale}px`;
    this._dragHandleContainer.style.width = `${DRAG_HANDLE_WIDTH}px`;

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

  private _pointerMoveHandler: UIEventHandler = ctx => {
    const state = ctx.get('pointerState');
    const { target } = state.raw;
    const element = this._captureEventTarget(target);

    if (!element || this._dragging) {
      return;
    }

    if (element.closest('.affine-drag-handle-container')) {
      return;
    }

    if (!element.closest('affine-note')) {
      this.hide();
      this._hoveredBlockId = '';
      return;
    }

    this._pointerMoveOnBlock(ctx);
  };

  private _clickHandler: UIEventHandler = ctx => {
    const state = ctx.get('pointerState');
    const { target } = state.raw;
    const element = this._captureEventTarget(target);

    if (
      !this._hoveredBlockId ||
      !element ||
      !element.closest('.affine-drag-handle-container')
    ) {
      return;
    }

    const { selectionManager } = this.root;

    selectionManager.set([
      selectionManager.getInstance('block', this._hoveredBlockId),
    ]);

    return true;
  };

  private _createDragPreview() {
    const fragment = document.createDocumentFragment();
    const selections = this.root.selectionManager.selections;
    selections
      .filter(selection => {
        return selection.type === 'block';
      })
      .map(selection => {
        return this.root.blockViewMap.get(selection.blockId);
      })
      .filter((x): x is BlockElement<BaseBlockModel> => !!x)
      .forEach(element => {
        const container = document.createElement('div');
        render(element.render(), container);
        fragment.appendChild(container);
      });
    return fragment;
  }

  private _dragStartHandler: UIEventHandler = ctx => {
    const state = ctx.get('pointerState');
    const { target } = state.raw;
    const element = this._captureEventTarget(target);

    const inside = !!element?.closest('.affine-drag-handle-container');
    if (!inside || !this._dragPreview || !this._hoveredBlockId) {
      return;
    }

    const fragment = this._createDragPreview();

    const blockElement = this.root.blockViewMap.get(this._hoveredBlockId);
    if (!blockElement) {
      return;
    }

    this._dragging = true;

    const { left, top, width } = blockElement.getBoundingClientRect();
    this._dragPreview.style.display = 'block';
    this._dragPreview.style.width = `${width}px`;

    const posX =
      left - (DRAG_HANDLE_WIDTH + DRAG_HANDLE_OFFSET_LEFT) * this._scale;
    const posY = top;

    this._dragPreview.style.transform = `translate(${posX}px, ${posY}px) scale(${this._scale})`;

    while (this._dragPreview.firstChild) {
      this._dragPreview.removeChild(this._dragPreview.firstChild);
    }
    this._dragPreview.appendChild(fragment);

    return true;
  };

  private _updateIndicator: UIEventHandler = ctx => {
    const state = ctx.get('pointerState');
    const point = new Point(state.point.x, state.point.y);
    const closestBlockElement = getClosestBlockElementByPoint(point.clone());
    if (!closestBlockElement) {
      this._indicatorRect = null;
      return;
    }

    const blockId = closestBlockElement.getAttribute(this.root.blockIdAttr);
    assertExists(blockId);

    this._dropBlockId = blockId;

    const rect = closestBlockElement.getBoundingClientRect();
    this._indicatorRect = {
      width: rect.width,
      height: 3 * this._scale,
      left: rect.left,
      top: rect.bottom,
    };
  };

  private _dragMoveHandler: UIEventHandler = ctx => {
    if (!this._dragging) {
      return;
    }

    const state = ctx.get('pointerState');
    const blockElement = this.root.blockViewMap.get(this._hoveredBlockId);
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

  private _dragEndHandler: UIEventHandler = ctx => {
    if (!this._dragging) {
      return;
    }
    const target = this._dropBlockId;
    this._dragging = false;
    this._dragPreview.style.display = 'none';
    this._indicatorRect = null;
    this._dropBlockId = '';

    const selectedBlocks = this.selectedBlocks
      .filter(x => x.type === 'block')
      .map(x => x.blockId)
      .map(id => this.page.getBlockById(id))
      .filter((x): x is BaseBlockModel => !!x);
    const targetBlock = this.page.getBlockById(target);
    const parent = this.page.getParent(target);
    if (targetBlock && parent && selectedBlocks.length > 0) {
      this.page.moveBlocks(selectedBlocks, parent, targetBlock, false);
    }
    return true;
  };

  override connectedCallback() {
    super.connectedCallback();
    this._addEvent('pointerMove', this._pointerMoveHandler);
    this._addEvent('click', this._clickHandler);
    this._addEvent('dragStart', this._dragStartHandler);
    this._addEvent('dragMove', this._dragMoveHandler);
    this._addEvent('dragEnd', this._dragEndHandler);
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
            width="16"
            height="18"
            viewBox="0 0 16 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect
              x="7.7782"
              y="0.707107"
              width="10"
              height="10"
              rx="2.5"
              transform="rotate(45 7.7782 0.707107)"
            />
          </svg>

          <svg
            class="affine-drag-handle-hover"
            width="16"
            height="18"
            viewBox="0 0 16 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M2.41421 6.58579L6.58579 2.41421C7.36684 1.63317 8.63316 1.63316 9.41421 2.41421L13.5858 6.58579C14.3668 7.36684 14.3668 8.63316 13.5858 9.41421L9.41421 13.5858C8.63316 14.3668 7.36684 14.3668 6.58579 13.5858L2.41421 9.41421C1.63317 8.63316 1.63316 7.36684 2.41421 6.58579Z"
              stroke-width="1.5"
            />
            <path
              class="ok"
              d="M5 8.5L7.5 10.5L10.5 7"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
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
