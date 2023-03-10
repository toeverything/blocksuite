import { DRAG_HANDLE_OFFSET_LEFT } from '@blocksuite/global/config';
import {
  assertExists,
  type Disposable,
  DisposableGroup,
  isFirefox,
} from '@blocksuite/global/utils';
import type { BaseBlockModel } from '@blocksuite/store';
import { css, html, LitElement, svg } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import {
  BlockComponentElement,
  getModelByBlockElement,
  IPoint,
  Point,
  SelectionEvent,
} from '../__internal__/index.js';
import type { EditingState } from '../page-block/default/utils.js';

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
      height: 3px;
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
  cursorPosition: IPoint | null = null;

  override render() {
    if (!this.targetRect || !this.cursorPosition) {
      return null;
    }
    const rect = this.targetRect;
    const distanceToTop = Math.abs(rect.top - this.cursorPosition.y);
    const distanceToBottom = Math.abs(rect.bottom - this.cursorPosition.y);
    const offsetY = distanceToTop < distanceToBottom ? rect.top : rect.bottom;
    return html`
      <div
        class="affine-drag-indicator"
        style=${styleMap({
          width: `${rect.width + 10}px`,
          transform: `translate(${rect.left}px, ${offsetY}px)`,
        })}
      ></div>
    `;
  }
}

const DRAG_HANDLE_HEIGHT = 16; // px FIXME
const DRAG_HANDLE_WIDTH = 24; // px

@customElement('affine-drag-handle')
export class DragHandle extends LitElement {
  static styles = css`
    :host {
      overflow: hidden;
      width: ${DRAG_HANDLE_WIDTH + 8}px;
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
      background-color: var(--affine-page-background);
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
      point: IPoint,
      dragged: BlockComponentElement[],
      lastModelState: EditingState
    ) => void;
    setSelectedBlocks: (
      selectedBlocks: EditingState | BlockComponentElement[] | null
    ) => void;
    getSelectedBlocks: () => BlockComponentElement[] | null;
    getFocusedBlock: () => BlockComponentElement | null;
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
    this._getFocusedBlock = options.getFocusedBlock;
    this._getSelectedBlocks = options.getSelectedBlocks;
    this._getClosestBlockElement = options.getClosestBlockElement;
    // this._clearSelection = options.clearSelection;
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
    point: IPoint,
    draggingBlockElements: BlockComponentElement[],
    lastModelState: EditingState
  ) => void;

  @property()
  public setSelectedBlocks: (
    selectedBlock: EditingState | BlockComponentElement[] | null
  ) => void;

  private _getSelectedBlocks: () => BlockComponentElement[] | null;
  private _getFocusedBlock: () => BlockComponentElement | null;
  // private _clearSelection: () => void;

  @query('.affine-drag-handle')
  private _dragHandle!: HTMLDivElement;

  @query('.affine-drag-handle-hover')
  private _dragHandleOver!: HTMLDivElement;

  @query('.affine-drag-handle-normal')
  private _dragHandleNormal!: HTMLDivElement;

  private _draggingElements: BlockComponentElement[] | null = null;

  private _currentClientX = 0;
  private _currentClientY = 0;

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
  private _clickedBlock: BlockComponentElement | null = null;
  private _dragImage: HTMLElement | null = null;

  private _disposables: DisposableGroup = new DisposableGroup();

  private readonly _getClosestBlockElement: (point: Point) => Element | null;

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
      this._handleAnchorState = modelState;
      if (
        this._handleAnchorState.element === this._clickedBlock &&
        this._clickedBlock === this._getFocusedBlock()
      ) {
        this._dragHandleOver.style.display = 'block';
        this._dragHandleNormal.style.display = 'none';
      } else {
        this._dragHandleOver.style.display = 'none';
        this._dragHandleNormal.style.display = 'block';
      }
      const rect = modelState.rect;
      this.style.display = 'block';
      this.style.height = `${rect.height}px`;
      this.style.width = `${DRAG_HANDLE_WIDTH}px`;
      this.style.left = '0';
      this.style.top = '0';
      const containerRect = this._container.getBoundingClientRect();

      const xOffset =
        rect.left -
        containerRect.left -
        DRAG_HANDLE_WIDTH -
        DRAG_HANDLE_OFFSET_LEFT;

      const yOffset = rect.top - containerRect.top;

      this.style.transform = `translate(${xOffset}px, ${yOffset}px)`;
      this.style.opacity = `${(
        1 -
        (event.raw.clientX - rect.left) / rect.width
      ).toFixed(2)}`;

      const handleYOffset = Math.max(
        0,
        Math.min(
          event.raw.clientY - rect.top - DRAG_HANDLE_HEIGHT / 2,
          rect.height - DRAG_HANDLE_HEIGHT
        )
      );

      this._dragHandle.style.transform = `translateY(${handleYOffset}px)`;

      if (this._handleAnchorDisposable) {
        this._handleAnchorDisposable.dispose();
      }

      this._handleAnchorDisposable = modelState.model.propsUpdated.on(() => {
        this.hide();
      });
    }
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

    if (this._dragImage) {
      this._dragImage.style.opacity = '1';
      this._dragImage = null;
    }
  }

  setPointerEvents(value: 'auto' | 'none') {
    this.style.pointerEvents = value;
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
      disposables.addFromEvent(document, 'dragover', this._onDragOverDocument);
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
    disposables.addFromEvent(this._dragHandle, 'dragstart', this._onDragStart);
    disposables.addFromEvent(this._dragHandle, 'drag', this._onDrag);
    disposables.addFromEvent(this._dragHandle, 'dragend', this._onDragEnd);
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

    if (!this._handleAnchorState) {
      return;
    }
    const { rect } = this._handleAnchorState;
    const top = Math.max(
      0,
      Math.min(
        e.clientY - rect.top - DRAG_HANDLE_HEIGHT / 2,
        rect.height - DRAG_HANDLE_HEIGHT - 6
      )
    );

    this._dragHandle.style.cursor = 'grab';
    this._dragHandle.style.transform = `translateY(${top}px)`;

    e.stopPropagation();
  }

  // fixme: handle multiple blocks case
  private _onResize = (_: UIEvent) => {
    if (!this._getClosestBlockElement) return;

    if (this._handleAnchorState) {
      const { rect } = this._handleAnchorState;
      const element = this._getClosestBlockElement(new Point(rect.x, rect.y));
      if (element) {
        const rect = element.getBoundingClientRect();
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
      this._clickedBlock = this._handleAnchorState.element;
      this.setSelectedBlocks(this._handleAnchorState);
      this._dragHandleOver.style.display = 'block';
      this._dragHandleNormal.style.display = 'none';
    }
    e.stopPropagation();
  };

  private _onMouseDown = (e: MouseEvent) => {
    e.stopPropagation();
  };

  private _onDragOverDocument = (e: DragEvent) => {
    if (!isFirefox) {
      throw new Error('FireFox only');
    }
    this._currentClientX = e.clientX;
    this._currentClientY = e.clientY;
  };

  private _onDragStart = (e: DragEvent) => {
    if (!this._handleAnchorState || !e.dataTransfer) {
      return;
    }

    this._clickedBlock = this._handleAnchorState.element;

    e.dataTransfer.effectAllowed = 'move';

    const selectedBlocks = this._getSelectedBlocks() ?? [];

    const included = selectedBlocks.includes(this._handleAnchorState.element);

    // TODO: clear selection
    // if (!included) {
    //   this._clearSelection();
    // }

    // fixme: the block may not have block id?
    const draggingBlockElements = included
      ? selectedBlocks
      : [this._handleAnchorState.element];

    this._dragImage =
      (draggingBlockElements.length > 1
        ? this._container.querySelector('.affine-page-selected-rects-container')
        : draggingBlockElements[0]) ?? this._handleAnchorState.element;

    this._dragImage.style.opacity = '0.99';
    e.dataTransfer.setDragImage(this._dragImage, 0, 0);

    this._draggingElements = draggingBlockElements;
  };

  // TODO: automatic scrolling when top and bottom boundaries are reached
  private _onDrag = (e: DragEvent) => {
    this._dragHandle.style.cursor = 'grabbing';
    let x = e.clientX;
    let y = e.clientY;
    if (isFirefox) {
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

    const element = this._getClosestBlockElement(new Point(x, y));

    if (element) {
      const rect = element.getBoundingClientRect();
      this._lastDroppingTarget = {
        rect,
        element: element as BlockComponentElement,
        model: getModelByBlockElement(element),
      };
      this._indicator.targetRect = rect;
    }
    this._indicator.cursorPosition = {
      x,
      y,
    };
  };

  private _onDragEnd = (e: DragEvent) => {
    if (!this._lastDroppingTarget) {
      // may drop to the same block position
      return;
    }
    assertExists(this._draggingElements);

    this._clickedBlock = null;
    // `darg.y` !== `dragend.y` in chrome.
    this.onDropCallback?.(
      this._indicator?.cursorPosition ?? {
        x: e.clientX,
        y: e.clientY,
      },
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

        .affine-drag-handle {
          position: absolute;
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
  }
}
