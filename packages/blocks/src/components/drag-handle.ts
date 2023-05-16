import { DRAG_HANDLE_OFFSET_LEFT } from '@blocksuite/global/config';
import {
  assertExists,
  type Disposable,
  isFirefox,
} from '@blocksuite/global/utils';
import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import type { BaseBlockModel } from '@blocksuite/store';
import { css, html, LitElement, render, svg } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import {
  type BlockComponentElement,
  calcDropTarget,
  type DroppingType,
  type EditingState,
  getBlockElementsExcludeSubtrees,
  getModelByBlockElement,
  getRectByBlockElement,
  isContainedIn,
  Point,
  type Rect,
  type SelectionEvent,
} from '../__internal__/index.js';

const handleIcon = svg`
<path d="M2.41421 6.58579L6.58579 2.41421C7.36684 1.63317 8.63316 1.63316 9.41421 2.41421L13.5858 6.58579C14.3668 7.36684 14.3668 8.63316 13.5858 9.41421L9.41421 13.5858C8.63316 14.3668 7.36684 14.3668 6.58579 13.5858L2.41421 9.41421C1.63317 8.63316 1.63316 7.36684 2.41421 6.58579Z"
fill="var(--affine-icon-color)" stroke="var(--affine-icon-color)"
stroke-width="1.5"/>
<path d="M5 8.5L7.5 10.5L10.5 7"
stroke="var(--affine-white-90)"
stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
`;

const handlePreventDocumentDragOverDelay = (event: MouseEvent) => {
  // Refs: https://stackoverflow.com/a/65910078
  event.preventDefault();
};

@customElement('affine-drag-indicator')
export class DragIndicator extends LitElement {
  static override styles = css`
    .affine-drag-indicator {
      position: absolute;
      top: 0;
      left: 0;
      background: var(--affine-primary-color);
      transition-property: width, height, transform;
      transition-duration: 100ms;
      transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
      transition-delay: 0s;
      transform-origin: 0 0;
      pointer-events: none;
      z-index: 1;
    }
  `;

  @property()
  rect: Rect | null = null;

  override render() {
    if (!this.rect) {
      return null;
    }
    const { left, top, width, height } = this.rect;
    const style = styleMap({
      width: `${width}px`,
      height: `${height}px`,
      transform: `translate(${left}px, ${top}px)`,
    });
    return html`<div class="affine-drag-indicator" style=${style}></div>`;
  }
}

@customElement('affine-drag-preview')
export class DragPreview extends ShadowlessElement {
  @property()
  offset = { x: 0, y: 0 };

  override render() {
    return html`<style>
      affine-drag-preview {
        --x: 0px;
        --y: 0px;
        height: auto;
        display: block;
        position: absolute;
        box-sizing: border-box;
        font-family: var(--affine-font-family);
        font-size: var(--affine-font-base);
        line-height: var(--affine-line-height);
        color: var(--affine-text-primary-color);
        font-weight: 400;
        top: 0;
        left: 0;
        opacity: 0.843;
        cursor: none;
        user-select: none;
        pointer-events: none;
        caret-color: transparent;
        transform-origin: 0 0;
        z-index: 2;
      }

      affine-drag-preview > .affine-block-element {
        pointer-events: none;
      }

      affine-drag-preview > .affine-block-element:first-child > *:first-child {
        margin-top: 0;
      }

      affine-drag-preview .affine-rich-text {
        user-modify: read-only;
        -webkit-user-modify: read-only;
      }

      affine-drag-preview.grabbing {
        cursor: grabbing;
        pointer-events: auto;
      }

      affine-drag-preview.grabbing:after {
        content: '';
        display: block;
        position: absolute;
        top: 0;
        left: 0;
        width: 24px;
        height: 24px;
        transform: translate(var(--x), var(--y));
      }
    </style>`;
  }
}

const DRAG_HANDLE_HEIGHT = 16; // px FIXME
const DRAG_HANDLE_WIDTH = 24; // px

@customElement('affine-drag-handle')
export class DragHandle extends WithDisposable(LitElement) {
  static override styles = css`
    :host {
      top: 0;
      left: 0;
      overflow: hidden;
      width: ${DRAG_HANDLE_WIDTH + 8}px;
      transform-origin: 0 0;
      pointer-events: none;
      user-select: none;
    }

    :host(:hover) > .affine-drag-handle-line {
      opacity: 1;
    }

    .affine-drag-handle-line {
      opacity: 0;
      height: 100%;
      position: absolute;
      left: ${DRAG_HANDLE_WIDTH / 2 - 1}px;
      border-right: 1px solid var(--affine-icon-color);
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
      /* background-color: var(--affine-white-90); */
      pointer-events: auto;
    }

    .affine-drag-handle-normal {
      display: block;
    }

    .affine-drag-handle-hover {
      display: none;
      transition: opacity ease-in-out 300ms;
    }

    :host(:hover) .affine-drag-handle-normal,
    :host([data-selected]) .affine-drag-handle-normal {
      display: none !important;
    }

    :host(:hover) .affine-drag-handle-hover,
    :host([data-selected]) .affine-drag-handle-hover {
      display: block !important;
      /* padding-top: 5px !important; FIXME */
    }
  `;

  constructor(options: {
    container: HTMLElement;
    onDropCallback: (
      point: Point,
      draggingBlockElements: BlockComponentElement[],
      lastModelState: EditingState | null,
      lastType: DroppingType
    ) => void;
    setDragType: (dragging: boolean) => void;
    setSelectedBlock: (selectedBlock: EditingState | null) => void;
    getSelectedBlocks: () => BlockComponentElement[] | null;
    getClosestBlockElement: (point: Point) => Element | null;
  }) {
    super();
    this.getDropAllowedBlocks = () => {
      console.warn('you may forget to set `getAllowedBlocks`');
      return [];
    };
    this.onDropCallback = options.onDropCallback;
    this.setDragType = options.setDragType;
    this.setSelectedBlock = options.setSelectedBlock;
    this._getSelectedBlocks = options.getSelectedBlocks;
    this._getClosestBlockElement = options.getClosestBlockElement;
    options.container.appendChild(this);
    this._container = options.container;
  }

  /**
   * A function that returns all blocks that are allowed to be moved to
   *
   * If there is `draggingBlock`, the user is dragging a block to another place
   *
   */
  public getDropAllowedBlocks: (
    draggingBlockIds: string[] | null
  ) => BaseBlockModel[];

  public onDropCallback: (
    point: Point,
    draggingBlockElements: BlockComponentElement[],
    lastModelState: EditingState | null,
    lastType: DroppingType
  ) => void;

  public setDragType: (dragging: boolean) => void;

  public setSelectedBlock: (selectedBlock: EditingState | null) => void;

  private _getSelectedBlocks: () => BlockComponentElement[] | null;

  private _getClosestBlockElement: (point: Point) => Element | null;

  @query('.affine-drag-handle')
  private _dragHandle!: HTMLDivElement;

  private _draggingElements: BlockComponentElement[] = [];

  private _scale = 1;
  private _currentClientX = 0;
  private _currentClientY = 0;
  private _stopPropagation = false;

  /**
   * Current drag handle model state
   */
  private _handleAnchorState: EditingState | null = null;
  private _handleAnchorDisposable: Disposable | null = null;

  /**
   * Last drag handle dropping target state
   */
  private _lastDroppingTarget: EditingState | null = null;
  private _lastDroppingType: DroppingType = 'none';
  private _indicator: DragIndicator | null = null;
  private _container: HTMLElement;
  private _dragPreview: DragPreview | null = null;

  protected get selectedBlocks() {
    return this._getSelectedBlocks() ?? [];
  }

  onContainerMouseMove(event: SelectionEvent, modelState: EditingState | null) {
    const frameBlock = this._container.querySelector(
      '.affine-frame-block-container'
    );
    assertExists(frameBlock);
    const frameBlockRect = frameBlock.getBoundingClientRect();
    // See https://github.com/toeverything/blocksuite/issues/1611
    if (event.raw.clientY < frameBlockRect.y) {
      this.hide();
    }

    if (modelState) {
      const { rect, element } = modelState;
      let startX = rect.left;
      let startY = rect.top;
      let height = rect.height;
      let selected = false;
      const selectedBlocks = this.selectedBlocks;
      if (selectedBlocks.includes(element)) {
        selected = true;

        if (selectedBlocks.length > 1) {
          const tempSelectedBlocks =
            getBlockElementsExcludeSubtrees(selectedBlocks);
          const first = getRectByBlockElement(tempSelectedBlocks[0]);
          const last = getRectByBlockElement(
            tempSelectedBlocks[tempSelectedBlocks.length - 1]
          );
          startX = first.left;
          startY = first.top;
          height = last.bottom - first.top;
        }
      }
      this.toggleAttribute('data-selected', selected);
      this._handleAnchorState = modelState;
      this.style.display = 'block';
      this.style.height = `${height / this._scale}px`;
      this.style.width = `${DRAG_HANDLE_WIDTH}px`;

      const containerRect = this._container.getBoundingClientRect();
      const posX =
        startX -
        containerRect.left -
        (DRAG_HANDLE_WIDTH + DRAG_HANDLE_OFFSET_LEFT) * this._scale;
      const posY = startY - containerRect.top;

      this.style.transform = `translate(${posX}px, ${posY}px) scale(${this._scale})`;
      this.style.opacity = `${(
        1 -
        (event.raw.clientX - startX) / rect.width
      ).toFixed(2)}`;

      const top = this._calcDragHandleY(
        event.raw.clientY,
        startY,
        height,
        this._scale
      );
      this._dragHandle.style.transform = `translateY(${top}px)`;

      if (this._handleAnchorDisposable) {
        this._handleAnchorDisposable.dispose();
      }

      this._handleAnchorDisposable = modelState.model.propsUpdated.on(() => {
        this.hide();
      });

      return;
    }

    this.hide();
  }

  hide(force = false) {
    this.style.display = 'none';
    if (force) this.reset();
  }

  reset() {
    this._handleAnchorState = null;
    this._lastDroppingType = 'none';
    this._lastDroppingTarget = null;

    if (this._indicator) {
      this._indicator.rect = null;
    }

    this._draggingElements.forEach(e => {
      e.style.opacity = '1';
    });

    this._draggingElements = [];
  }

  setPointerEvents(value: 'auto' | 'none') {
    this.style.pointerEvents = value;
  }

  setScale(value = 1) {
    this._scale = value;
  }

  override firstUpdated() {
    this.style.display = 'none';
    this.style.position = 'absolute';
    this._indicator = <DragIndicator>(
      document.querySelector('affine-drag-indicator')
    );
    if (!this._indicator) {
      this._indicator = <DragIndicator>(
        document.createElement('affine-drag-indicator')
      );
      document.body.appendChild(this._indicator);
    }

    const disposables = this._disposables;

    // event bindings

    // document
    if (isFirefox) {
      disposables.addFromEvent(
        this._container,
        'dragover',
        this._onDragOverDocument
      );
    }

    // document.body
    disposables.addFromEvent(
      document.body,
      'dragover',
      handlePreventDocumentDragOverDelay,
      false
    );

    // host
    disposables.addFromEvent(this, 'mousemove', this._onMouseMoveOnHost);

    // drag handle
    disposables.addFromEvent(this._dragHandle, 'click', this._onClick);
    // 1. In edgeless, native DnD will work fine.
    // 2. In page, hosted with editor-container mouse events and scroll wheel support.
    disposables.addFromEvent(this._dragHandle, 'dragstart', this.onDragStart);
    disposables.addFromEvent(this._dragHandle, 'drag', this.onDrag);
    disposables.addFromEvent(this._dragHandle, 'dragend', this.onDragEnd);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();

    // cleanup
    this.hide(true);

    this._handleAnchorDisposable?.dispose();
  }

  private _onMouseMoveOnHost(e: MouseEvent) {
    if (isFirefox) {
      this._currentClientX = e.clientX;
      this._currentClientY = e.clientY;
    }

    if (this._stopPropagation) {
      e.stopPropagation();
    }

    if (!this._handleAnchorState) {
      return;
    }

    const { rect, element } = this._handleAnchorState;
    const selectedBlocks = this.selectedBlocks;
    let startY = rect.top;
    let height = rect.height;

    if (selectedBlocks.includes(element) && selectedBlocks.length > 1) {
      const tempSelectedBlocks =
        getBlockElementsExcludeSubtrees(selectedBlocks);
      const first = getRectByBlockElement(tempSelectedBlocks[0]);
      const last = getRectByBlockElement(
        tempSelectedBlocks[tempSelectedBlocks.length - 1]
      );
      startY = first.top;
      height = last.bottom - first.top;
    }

    const top = this._calcDragHandleY(e.clientY, startY, height, this._scale);

    this._dragHandle.style.cursor = 'grab';
    this._dragHandle.style.transform = `translateY(${top}px)`;
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
          height - DRAG_HANDLE_HEIGHT
        )
      ) / scale
    );
  }

  private _createDragPreview(
    e: DragEvent,
    blockElements: BlockComponentElement[],
    grabbing = false
  ) {
    const dragPreview = (this._dragPreview = new DragPreview());
    const containerRect = this._container.getBoundingClientRect();
    const rect = blockElements[0].getBoundingClientRect();
    const { clientX, clientY } = e;
    const s = this._scale;

    const l = rect.left - containerRect.left;
    const t = rect.top - containerRect.top;
    dragPreview.offset.x = l - clientX;
    dragPreview.offset.y = t - clientY;
    dragPreview.style.width = `${rect.width / s}px`;
    dragPreview.style.transform = `translate(${l}px, ${t}px) scale(${s})`;
    const x = -dragPreview.offset.x - containerRect.left - 24 / 2;
    const y = -dragPreview.offset.y - containerRect.top - 24 / 2;
    dragPreview.style.setProperty('--x', `${x}px`);
    dragPreview.style.setProperty('--y', `${y}px`);

    const fragment = document.createDocumentFragment();

    blockElements.forEach(e => {
      const c = document.createElement('div');
      c.classList.add('affine-block-element');
      render(e.render(), c);
      fragment.appendChild(c);
    });

    dragPreview.appendChild(fragment);
    this._container.appendChild(dragPreview);

    if (grabbing) {
      dragPreview.classList.add('grabbing');
    }

    requestAnimationFrame(() => {
      dragPreview.querySelector('rich-text')?.vEditor?.rootElement.blur();
    });
  }

  private _removeDragPreview() {
    if (this._dragPreview) {
      this._dragPreview.remove();
      this._dragPreview = null;
    }
  }

  // - select current block
  // - trigger slash menu
  private _onClick = (e: MouseEvent) => {
    const { selectedBlocks } = this;
    let { _handleAnchorState: modelState } = this;
    if (
      modelState &&
      selectedBlocks.length &&
      modelState.element === selectedBlocks[0]
    ) {
      modelState = null;
    }
    this.setSelectedBlock(modelState);
    this.toggleAttribute('data-selected', Boolean(modelState));
    e.stopPropagation();
  };

  private _onDragOverDocument = (e: DragEvent) => {
    if (!isFirefox) {
      throw new Error('FireFox only');
    }
    this._currentClientX = e.clientX;
    this._currentClientY = e.clientY;
  };

  onDragStart = (e: DragEvent, draggable = false) => {
    if (this._dragPreview || !e.dataTransfer) return;

    e.dataTransfer.effectAllowed = 'move';

    const modelState = this._handleAnchorState;
    let draggingBlockElements = this.selectedBlocks;

    if (modelState && !draggingBlockElements.includes(modelState.element)) {
      draggingBlockElements = [modelState.element];
      // select current block
      this.setSelectedBlock(modelState);
    }

    this._draggingElements = draggingBlockElements;

    this._createDragPreview(
      e,
      getBlockElementsExcludeSubtrees(
        draggingBlockElements
      ) as BlockComponentElement[],
      draggable
    );

    this.setDragType(true);
  };

  onDrag = (e: DragEvent, passed?: boolean, isScrolling?: boolean) => {
    this._dragHandle.style.cursor = 'grabbing';
    let x = e.clientX;
    let y = e.clientY;
    if (!passed && isFirefox) {
      // In Firefox, `pageX` and `pageY` are always set to 0.
      // Refs: https://stackoverflow.com/questions/13110349/pagex-and-pagey-are-always-set-to-0-in-firefox-during-the-ondrag-event.
      x = this._currentClientX;
      y = this._currentClientY;
    }

    if (
      !this._indicator ||
      (!passed &&
        this._indicator.rect &&
        this._indicator.rect.left === x &&
        this._indicator.rect.top === y)
    ) {
      return;
    }

    if (this._dragPreview && e.screenY) {
      const { x: offsetX, y: offsetY } = this._dragPreview.offset;
      const l = x + offsetX;
      const t = y + offsetY;
      const s = this._scale;
      this._dragPreview.style.transform = `translate(${l}px, ${t}px) scale(${s})`;
    }

    if (isScrolling) return;

    const point = new Point(x, y);
    const element = this._getClosestBlockElement(point.clone());
    let type: DroppingType = 'none';
    let rect = null;
    let lastModelState = null;

    if (element) {
      // Array: array does not contains the target
      // DOM: elements does not contains the target
      if (
        !this._draggingElements.includes(element as BlockComponentElement) &&
        !isContainedIn(this._draggingElements, element)
      ) {
        const model = getModelByBlockElement(element);
        const result = calcDropTarget(
          point,
          model,
          element,
          this._draggingElements,
          this._scale
        );

        if (result) {
          type = result.type;
          rect = result.rect;
          lastModelState = result.modelState;
        }
      }
    }

    this._indicator.rect = rect;
    this._lastDroppingType = type;
    this._lastDroppingTarget = lastModelState;
  };

  onDragEnd = (e: DragEvent, passed?: boolean) => {
    this._stopPropagation = false;

    const dropEffect = e.dataTransfer?.dropEffect ?? 'none';

    this._removeDragPreview();

    this.setDragType(false);

    // `Esc`
    if (!passed && dropEffect === 'none') {
      this.hide(true);
      return;
    }

    assertExists(this._draggingElements);

    // `drag.clientY` !== `dragend.clientY` in chrome.
    this.onDropCallback?.(
      this._indicator?.rect?.min ?? new Point(e.clientX, e.clientY),
      // blockElements include subtrees
      this._draggingElements,
      this._lastDroppingTarget,
      this._lastDroppingType
    );

    this.hide(true);
  };

  override render() {
    return html`
      <div class="affine-drag-handle-line"></div>
      <div class="affine-drag-handle" draggable="true">
        <div class="affine-drag-handle-normal">
          <svg
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
              stroke="var(--affine-icon-color)"
            />
          </svg>
        </div>

        <div class="affine-drag-handle-hover">
          <svg
            class="handle-hover"
            width="16"
            height="18"
            viewBox="0 0 16 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            ${handleIcon}
          </svg>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-drag-handle': DragHandle;
    'affine-drag-indicator': DragIndicator;
    'affine-drag-preview': DragPreview;
  }
}
