import {
  type BlockComponentElement,
  type EditingState,
  getBlockElementsExcludeSubtrees,
  getDropRectByPoint,
  getModelByBlockElement,
  getRectByBlockElement,
  isContainedIn,
  Point,
  Rect,
  type SelectionEvent,
  ShadowlessElement,
  WithDisposable,
} from '@blocksuite/blocks/std';
import { DRAG_HANDLE_OFFSET_LEFT } from '@blocksuite/global/config';
import {
  assertExists,
  type Disposable,
  isFirefox,
} from '@blocksuite/global/utils';
import type { BaseBlockModel } from '@blocksuite/store';
import { css, html, LitElement, render, svg } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

const handleIcon = svg`
<path d="M2.41421 6.58579L6.58579 2.41421C7.36684 1.63317 8.63316 1.63316 9.41421 2.41421L13.5858 6.58579C14.3668 7.36684 14.3668 8.63316 13.5858 9.41421L9.41421 13.5858C8.63316 14.3668 7.36684 14.3668 6.58579 13.5858L2.41421 9.41421C1.63317 8.63316 1.63316 7.36684 2.41421 6.58579Z"
fill="var(--affine-block-handle-color)" stroke="var(--affine-block-handle-color)"
stroke-width="1.5"/>
<path d="M5 8.5L7.5 10.5L10.5 7"
stroke="var(--affine-page-background)"
stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
`;

const handlePreventDocumentDragOverDelay = (event: MouseEvent) => {
  // Refs: https://stackoverflow.com/a/65910078
  event.preventDefault();
};

@customElement('affine-drag-indicator')
export class DragIndicator extends LitElement {
  static styles = css`
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

  render() {
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

  render() {
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
        color: var(--affine-edgeless-text-color);
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

      affine-drag-preview:after {
        content: '';
        display: block;
        position: absolute;
        top: 0;
        left: 0;
        width: 24px;
        height: 24px;
        transform: translate(var(--x), var(--y));
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
    </style>`;
  }
}

const DRAG_HANDLE_HEIGHT = 16; // px FIXME
const DRAG_HANDLE_WIDTH = 24; // px

@customElement('affine-drag-handle')
export class DragHandle extends WithDisposable(LitElement) {
  static styles = css`
    :host {
      top: 0;
      left: 0;
      overflow: hidden;
      width: ${DRAG_HANDLE_WIDTH + 8}px;
      transform-origin: 0 0;
      pointer-events: none;
      user-select: none;
    }

    .affine-drag-handle-line {
      opacity: 0;
      height: 100%;
      position: absolute;
      left: ${DRAG_HANDLE_WIDTH / 2 - 1}px;
      border-right: 1px solid var(--affine-block-handle-color);
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
      /* background-color: var(--affine-page-background); */
      pointer-events: auto;
    }

    .affine-drag-handle-hover {
      display: none;
      transition: opacity ease-in-out 300ms;
    }
  `;

  constructor(options: {
    container: HTMLElement;
    onDropCallback: (
      point: Point,
      draggingBlockElements: BlockComponentElement[],
      lastModelState: EditingState | null
    ) => void;
    setSelectionType: () => void;
    setSelectedBlock: (selectedBlock: EditingState) => void;
    getSelectedBlocks: () => BlockComponentElement[] | null;
    getClosestBlockElement: (point: Point) => Element | null;
  }) {
    super();
    this.getDropAllowedBlocks = () => {
      console.warn('you may forget to set `getAllowedBlocks`');
      return [];
    };
    this.onDropCallback = options.onDropCallback;
    this.setSelectionType = options.setSelectionType;
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
    lastModelState: EditingState | null
  ) => void;

  public setSelectionType: () => void;

  public setSelectedBlock: (selectedBlock: EditingState) => void;

  private _getSelectedBlocks: () => BlockComponentElement[] | null;

  private _getClosestBlockElement: (point: Point) => Element | null;

  @query('.affine-drag-handle')
  private _dragHandle!: HTMLDivElement;

  @query('.affine-drag-handle-hover')
  private _dragHandleOver!: HTMLDivElement;

  @query('.affine-drag-handle-normal')
  private _dragHandleNormal!: HTMLDivElement;

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
      let overDisplay = 'none';
      let normalDisplay = 'block';
      const selectedBlocks = this.selectedBlocks;
      if (selectedBlocks.includes(element)) {
        overDisplay = normalDisplay;
        normalDisplay = 'none';

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
      this._handleAnchorState = modelState;
      this._dragHandleOver.style.display = overDisplay;
      this._dragHandleNormal.style.display = normalDisplay;
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

  hide() {
    this.style.display = 'none';
    this._handleAnchorState = null;
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

  firstUpdated() {
    this.style.display = 'none';
    this.style.position = 'absolute';
    this._indicator = <DragIndicator>(
      document.querySelector('affine-drag-indicator')
    );
    if (!this._indicator) {
      this._indicator = <DragIndicator>(
        document.createElement('affine-drag-indicator')
      );
      this._container.appendChild(this._indicator);
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

  disconnectedCallback() {
    super.disconnectedCallback();

    // cleanup
    this.hide();

    this._handleAnchorDisposable?.dispose();
  }

  private _onMouseMoveOnHost(e: MouseEvent) {
    if (this._stopPropagation) {
      e.stopPropagation();
    }

    if (isFirefox) {
      this._currentClientX = e.clientX;
      this._currentClientY = e.clientY;
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

  private _clacTarget(
    point: Point,
    model: BaseBlockModel,
    element: Element,
    draggingElements: BlockComponentElement[],
    scale: number
  ) {
    const height = 3 * scale;
    const { rect: domRect, isEmptyDatabase } = getDropRectByPoint(
      point,
      model,
      element
    );

    if (isEmptyDatabase) {
      const rect = Rect.fromDOMRect(domRect);
      rect.top -= height / 2;
      rect.height = height;
      return {
        flag: 2, // in empty database
        rect,
        lastModelState: {
          model,
          rect: domRect,
          element: element as BlockComponentElement,
        },
      };
    }

    const distanceToTop = Math.abs(domRect.top - point.y);
    const distanceToBottom = Math.abs(domRect.bottom - point.y);
    const before = distanceToTop < distanceToBottom;

    // -1: do nothing, 0: after, 1: before, 2: in empty database
    let flag = Number(before);
    let offsetY = 4;

    if (flag === 1) {
      // before
      const prev = element.previousElementSibling;
      if (prev) {
        if (prev === draggingElements[draggingElements.length - 1]) {
          flag = -1;
        } else {
          const prevRect = getRectByBlockElement(prev);
          offsetY = (domRect.top - prevRect.bottom) / 2;
        }
      }
    } else {
      // after
      const next = element.nextElementSibling;
      if (next) {
        if (next === draggingElements[0]) {
          flag = -1;
        } else {
          const nextRect = getRectByBlockElement(next);
          offsetY = (nextRect.top - domRect.bottom) / 2;
        }
      }
    }

    if (flag !== -1) {
      let top = domRect.top;
      if (flag === 1) {
        top -= offsetY;
      } else {
        top += domRect.height + offsetY;
      }
      return {
        flag,
        rect: Rect.fromLWTH(
          domRect.left,
          domRect.width,
          top - height / 2,
          height
        ),
        lastModelState: {
          model,
          rect: domRect,
          element: element as BlockComponentElement,
        },
      };
    }

    return null;
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

    dragPreview.offset.x = rect.left - containerRect.left - clientX;
    dragPreview.offset.y = rect.top - containerRect.top - clientY;
    dragPreview.style.width = `${rect.width / s}px`;
    const l = rect.left - containerRect.left;
    const t = rect.top - containerRect.top;
    dragPreview.style.transform = `translate(${l}px, ${t}px) scale(${s})`;
    dragPreview.style.setProperty('--x', `${-dragPreview.offset.x - 24 / 2}px`);
    dragPreview.style.setProperty('--y', `${-dragPreview.offset.y - 24 / 2}px`);

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
    if (this._handleAnchorState) {
      this.setSelectedBlock(this._handleAnchorState);
      this._dragHandleOver.style.display = 'block';
      this._dragHandleNormal.style.display = 'none';
    }
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

    this.setSelectionType();

    const anchor = this._handleAnchorState && this._handleAnchorState.element;
    let draggingBlockElements = this.selectedBlocks;

    if (anchor && !draggingBlockElements.includes(anchor)) {
      draggingBlockElements = [anchor];
    }

    this._draggingElements = draggingBlockElements;
    e.dataTransfer.effectAllowed = 'move';

    this._createDragPreview(
      e,
      getBlockElementsExcludeSubtrees(
        draggingBlockElements
      ) as BlockComponentElement[],
      draggable
    );
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
        const result = this._clacTarget(
          point,
          model,
          element,
          this._draggingElements,
          this._scale
        );

        if (result) {
          rect = result.rect;
          lastModelState = result.lastModelState;
        }
      }
    }

    this._indicator.rect = rect;
    this._lastDroppingTarget = lastModelState;
  };

  onDragEnd = (e: DragEvent, passed?: boolean) => {
    this._stopPropagation = false;

    const dropEffect = e.dataTransfer?.dropEffect ?? 'none';

    this._removeDragPreview();

    // `Esc`
    if (!passed && dropEffect === 'none') {
      this.hide();
      return;
    }

    assertExists(this._draggingElements);

    // `drag.clientY` !== `dragend.clientY` in chrome.
    this.onDropCallback?.(
      this._indicator?.rect?.min ?? new Point(e.clientX, e.clientY),
      // blockElements include subtrees
      this._draggingElements,
      this._lastDroppingTarget
    );

    this.hide();
  };

  render() {
    return html`
      <style>
        :host(:hover) > .affine-drag-handle-line {
          opacity: 1;
        }

        :host(:hover) .affine-drag-handle-normal {
          display: none !important;
        }

        :host(:hover) .affine-drag-handle-hover {
          display: block !important;
          /* padding-top: 5px !important; FIXME */
        }
      </style>
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
              stroke="var(--affine-block-handle-color)"
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
