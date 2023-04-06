import type {
  BlockComponentElement,
  EditingState,
  SelectionEvent,
} from '@blocksuite/blocks/std';
import {
  getBlockElementsExcludeSubtrees,
  getDropRectByPoint,
  getModelByBlockElement,
  getRectByBlockElement,
  Point,
} from '@blocksuite/blocks/std';
import { DRAG_HANDLE_OFFSET_LEFT } from '@blocksuite/global/config';
import type { Disposable } from '@blocksuite/global/utils';
import {
  assertExists,
  DisposableGroup,
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
      position: fixed;
      top: 0;
      left: 0;
      background: var(--affine-primary-color);
      transition-property: width, transform;
      transition-duration: 100ms;
      transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
      transition-delay: 0s;
      pointer-events: none;
    }
  `;

  @property()
  targetRect: DOMRect | null = null;

  @property()
  cursorPosition: Point | null = null;

  @property()
  scale = 1;

  override render() {
    if (!this.targetRect || !this.cursorPosition) {
      return null;
    }
    const rect = this.targetRect;
    const distanceToTop = Math.abs(rect.top - this.cursorPosition.y);
    const distanceToBottom = Math.abs(rect.bottom - this.cursorPosition.y);
    const offsetY = distanceToTop < distanceToBottom ? rect.top : rect.bottom;
    const style = styleMap({
      width: `${rect.width}px`,
      height: `${3 * this.scale}px`,
      transform: `translate(${rect.left}px, ${offsetY}px)`,
    });
    return html` <div class="affine-drag-indicator" style=${style}></div> `;
  }
}

@customElement('affine-drag-preview')
export class DragPreview extends LitElement {
  @property()
  offset = { x: 0, y: 0 };

  createRenderRoot() {
    return this;
  }

  render() {
    return html`<style>
      affine-drag-preview {
        height: auto;
        display: block;
        position: absolute;
        box-sizing: border-box;
        overflow: hidden;
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
        z-index: 2;
      }

      affine-drag-preview .affine-rich-text {
        user-modify: read-only;
        -webkit-user-modify: read-only;
      }

      affine-drag-preview.grabbing {
        cursor: grabbing;
        pointer-events: auto;
      }

      affine-drag-preview.grabbing .affine-rich-text {
        cursor: grabbing;
      }

      affine-drag-preview > .affine-block-element:first-child > *:first-child {
        margin-top: 0;
      }
    </style>`;
  }
}

const DRAG_HANDLE_HEIGHT = 16; // px FIXME
const DRAG_HANDLE_WIDTH = 24; // px

@customElement('affine-drag-handle')
export class DragHandle extends LitElement {
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
      dragged: BlockComponentElement[],
      lastModelState: EditingState | null
    ) => void;
    setSelectedBlocks: (
      selectedBlocks: EditingState | BlockComponentElement[] | null
    ) => void;
    getSelectedBlocks: () => BlockComponentElement[] | null;
    getClosestBlockElement: (point: Point) => Element | null;
    // clearSelection: () => void;
  }) {
    super();
    this.getDropAllowedBlocks = () => {
      console.warn('you may forget to set `getAllowedBlocks`');
      return [];
    };
    this.onDropCallback = options.onDropCallback;
    this.setSelectedBlocks = options.setSelectedBlocks;
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
  @property()
  public getDropAllowedBlocks: (
    draggingBlockIds: string[] | null
  ) => BaseBlockModel[];

  @property()
  public onDropCallback: (
    point: Point,
    draggingBlockElements: BlockComponentElement[],
    lastModelState: EditingState | null
  ) => void;

  @property()
  public setSelectedBlocks: (
    selectedBlock: EditingState | BlockComponentElement[] | null
  ) => void;

  private _getSelectedBlocks: () => BlockComponentElement[] | null;

  @query('.affine-drag-handle')
  private _dragHandle!: HTMLDivElement;

  @query('.affine-drag-handle-hover')
  private _dragHandleOver!: HTMLDivElement;

  @query('.affine-drag-handle-normal')
  private _dragHandleNormal!: HTMLDivElement;

  private _draggingElements: BlockComponentElement[] | null = null;

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

  private _disposables: DisposableGroup = new DisposableGroup();

  private readonly _getClosestBlockElement: (point: Point) => Element | null;

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
      this._indicator.cursorPosition = null;
      this._indicator.targetRect = null;
    }

    this._draggingElements?.forEach(e => {
      e.style.opacity = '1';
    });

    this._draggingElements = [];
  }

  setPointerEvents(value: 'auto' | 'none') {
    this.style.pointerEvents = value;
  }

  setScale(value = 1) {
    this._scale = value;
    if (this._indicator) {
      this._indicator.scale = value;
    }
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
      document.body.appendChild(this._indicator);
    }

    const disposables = this._disposables;

    // event bindings
    // window
    disposables.addFromEvent(window, 'resize', this._onResize);

    // document
    if (isFirefox) {
      disposables.addFromEvent(
        this._container,
        'dragover',
        this._onDragOverDocument
      );
    }

    // document.body
    disposables.addFromEvent(document.body, 'wheel', this._onWheel);
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
    disposables.addFromEvent(this._dragHandle, 'mousedown', this._onMouseDown);
    disposables.addFromEvent(this._dragHandle, 'mouseup', this._onMouseUp);
    disposables.addFromEvent(this._dragHandle, 'dragstart', this.onDragStart);
    disposables.addFromEvent(this._dragHandle, 'drag', this.onDrag);
    disposables.addFromEvent(this._dragHandle, 'dragend', this.onDragEnd);
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    // cleanup
    this.hide();

    this._disposables.dispose();
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
    draggingBlockElements: BlockComponentElement[],
    grabbing = false
  ) {
    const dragPreview = (this._dragPreview = new DragPreview());
    const containerRect = this._container.getBoundingClientRect();
    const rect = draggingBlockElements[0].getBoundingClientRect();

    dragPreview.offset.x = rect.left - containerRect.left - e.clientX;
    dragPreview.offset.y = rect.top - containerRect.top - e.clientY;
    dragPreview.style.width = `${rect.width}px`;
    dragPreview.style.transform = `translate(${
      rect.left - containerRect.left
    }px, ${rect.top - containerRect.top}px)`;

    const fragment = document.createDocumentFragment();

    draggingBlockElements = getBlockElementsExcludeSubtrees(
      draggingBlockElements
    ) as BlockComponentElement[];

    draggingBlockElements.forEach(e => {
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

  // fixme: handle multiple blocks case
  private _onResize = (_: UIEvent) => {
    if (!this._getClosestBlockElement) return;

    if (this._handleAnchorState) {
      const { rect } = this._handleAnchorState;
      const element = this._getClosestBlockElement(new Point(rect.x, rect.y));
      if (element) {
        const rect = getRectByBlockElement(element);
        this._handleAnchorState = {
          rect,
          element: element as BlockComponentElement,
          model: getModelByBlockElement(element),
        };
        this.style.display = 'block';
        const containerRect = this._container.getBoundingClientRect();
        this.style.left = `${rect.left - containerRect.left - 20}px`;
        this.style.top = `${rect.top - containerRect.top + 8}px`;
      }
    }
  };

  private _onWheel = (_: MouseEvent) => {
    this.hide();
  };

  // - select current block
  // - trigger slash menu
  private _onClick = (e: MouseEvent) => {
    if (this._handleAnchorState) {
      this.setSelectedBlocks(this._handleAnchorState);
      this._dragHandleOver.style.display = 'block';
      this._dragHandleNormal.style.display = 'none';
    }
    e.stopPropagation();
  };

  private _onMouseDown = (e: MouseEvent) => {
    this._stopPropagation = true;
    e.stopPropagation();
  };

  private _onMouseUp = (e: MouseEvent) => {
    e.stopPropagation();
    this._stopPropagation = false;
    this._removeDragPreview();
  };

  private _onDragOverDocument = (e: DragEvent) => {
    if (!isFirefox) {
      throw new Error('FireFox only');
    }
    this._currentClientX = e.clientX;
    this._currentClientY = e.clientY;
  };

  onDragStart = (e: DragEvent, draggable = false) => {
    if (this._dragPreview || !this._handleAnchorState || !e.dataTransfer) {
      return;
    }

    e.dataTransfer.effectAllowed = 'move';

    const selectedBlocks = this.selectedBlocks;

    const included = selectedBlocks.includes(this._handleAnchorState.element);

    // TODO: clear selection
    // if (!included) {
    // }

    const draggingBlockElements = (
      included
        ? getBlockElementsExcludeSubtrees(this.selectedBlocks)
        : [this._handleAnchorState.element]
    ) as BlockComponentElement[];

    this._createDragPreview(
      e,
      getBlockElementsExcludeSubtrees(
        draggingBlockElements
      ) as BlockComponentElement[],
      draggable
    );
    this._draggingElements = draggingBlockElements;
  };

  // TODO: automatic scrolling when top and bottom boundaries are reached
  onDrag = (e: DragEvent, passed?: boolean) => {
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
      !this._getClosestBlockElement ||
      !this._indicator ||
      (this._indicator.cursorPosition &&
        this._indicator.cursorPosition.x === x &&
        this._indicator.cursorPosition.y === y)
    ) {
      return;
    }

    if (this._dragPreview && e.screenY) {
      const { x: offsetX, y: offsetY } = this._dragPreview.offset;
      this._dragPreview.style.transform = `translate(${x + offsetX}px, ${
        y + offsetY
      }px)`;
    }

    const point = new Point(x, y);
    const element = this._getClosestBlockElement(point.clone());
    let rect = null;
    let lastModelState = null;

    if (element) {
      if (
        !(
          this.selectedBlocks.includes(element as BlockComponentElement) ||
          element === this._handleAnchorState?.element
        )
      ) {
        const model = getModelByBlockElement(element);
        rect = getDropRectByPoint(point, model, element);

        lastModelState = {
          rect,
          model,
          element: element as BlockComponentElement,
        };
      }
    }

    this._lastDroppingTarget = lastModelState;
    this._indicator.targetRect = rect;
    this._indicator.cursorPosition = point;
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
      this._indicator?.cursorPosition ?? new Point(e.clientX, e.clientY),
      // make sure clear subtrees!
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
