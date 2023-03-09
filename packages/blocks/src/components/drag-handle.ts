import { DRAG_HANDLE_OFFSET_LEFT } from '@blocksuite/global/config';
import { assertExists, isFirefox } from '@blocksuite/global/utils';
import type { BaseBlockModel } from '@blocksuite/store';
import { css, html, LitElement, svg } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import type {
  BlockComponentElement,
  IPoint,
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
      transition: transform 100ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;
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

export type DragHandleGetModelStateCallback = (
  blocks: BaseBlockModel[],
  clientX: number,
  clientY: number,
  skipX?: boolean
) => EditingState | null;

export type DragHandleGetModelStateWithCursorCallback = (
  blocks: BaseBlockModel[],
  clientX: number,
  clientY: number,
  cursor: number,
  size?: number,
  skipX?: boolean,
  dragging?: boolean
) => EditingState | null;

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
    }

    .affine-drag-handle {
      position: absolute;
      display: flex;
      align-items: center;
      justify-content: center;
      width: ${DRAG_HANDLE_WIDTH}px;
      height: ${DRAG_HANDLE_HEIGHT}px;
      background-color: var(--affine-page-background);
    }

    .affine-drag-handle-hover {
      display: none;
      transition: opacity ease-in-out 300ms;
    }
  `;

  constructor(options: {
    container: HTMLElement;
    onDropCallback: (
      e: DragEvent,
      dragged: BlockComponentElement[],
      lastModelState: EditingState
    ) => void;
    getBlockEditingStateByPosition: DragHandleGetModelStateCallback;
    getBlockEditingStateByCursor: DragHandleGetModelStateWithCursorCallback;
    setSelectedBlocks: (
      selectedBlocks: EditingState | BlockComponentElement[] | null
    ) => void;
    getSelectedBlocks: () => BlockComponentElement[] | null;
  }) {
    super();
    this.getDropAllowedBlocks = () => {
      console.warn('you may forget to set `getAllowedBlocks`');
      return [];
    };
    this.onDropCallback = options.onDropCallback;
    this.setSelectedBlocks = options.setSelectedBlocks;
    this._getSelectedBlocks = options.getSelectedBlocks;
    this._getBlockEditingStateByPosition =
      options.getBlockEditingStateByPosition;
    this._getBlockEditingStateByCursor = options.getBlockEditingStateByCursor;
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
    e: DragEvent,
    draggingBlockElements: BlockComponentElement[],
    lastModelState: EditingState
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

  private get _draggingBlockIds() {
    return this._draggingElements?.map(e => e.model.id) ?? null;
  }

  private _currentClientX = 0;
  private _currentClientY = 0;

  /**
   * Current drag handle model state
   */
  private _handleAnchorState: EditingState | null = null;

  /**
   * Last drag handle dropping target state
   */
  private _lastDroppingTarget: EditingState | null = null;
  private _indicator: DragIndicator | null = null;
  private _cursor: number | null = 0;
  private _lastSelectedIndex = -1;
  private _container: HTMLElement;
  private _dragImage: HTMLElement | null = null;

  private _getBlockEditingStateByPosition: DragHandleGetModelStateCallback | null =
    null;

  private _getBlockEditingStateByCursor: DragHandleGetModelStateWithCursorCallback | null =
    null;

  onContainerMouseMove(event: SelectionEvent) {
    if (!this._getBlockEditingStateByPosition) return;

    const frameBlock = this._container.querySelector(
      '.affine-frame-block-container'
    );
    assertExists(frameBlock);
    const frameBlockRect = frameBlock.getBoundingClientRect();
    // See https://github.com/toeverything/blocksuite/issues/1611
    if (event.raw.clientY < frameBlockRect.y) {
      this.hide();
      return;
    }

    const modelState = this._getBlockEditingStateByPosition(
      this.getDropAllowedBlocks(null),
      event.raw.clientX,
      event.raw.clientY,
      true
    );
    if (modelState) {
      this._handleAnchorState = modelState;
      this._cursor = modelState.index;
      const rect = modelState.position;
      if (this._cursor === this._lastSelectedIndex) {
        this._dragHandleOver.style.display = 'block';
        this._dragHandleNormal.style.display = 'none';
      } else {
        this._dragHandleOver.style.display = 'none';
        this._dragHandleNormal.style.display = 'block';
      }
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
    }
  }

  hide() {
    this.style.display = 'none';
    this._cursor = null;
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
    document.body.addEventListener(
      'dragover',
      handlePreventDocumentDragOverDelay,
      false
    );
    document.body.addEventListener('wheel', this._onWheel);
    window.addEventListener('resize', this._onResize);
    this._dragHandle.addEventListener('click', this._onClick);
    this._dragHandle.addEventListener('mousedown', this._onMouseDown);
    isFirefox &&
      document.addEventListener('dragover', this._onDragOverDocument);
    this.addEventListener('mousemove', this._onMouseMoveOnHost);
    this._dragHandle.addEventListener('dragstart', this._onDragStart);
    this._dragHandle.addEventListener('drag', this._onDrag);
    this._dragHandle.addEventListener('dragend', this._onDragEnd);
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    // cleanup
    this.hide();

    window.removeEventListener('resize', this._onResize);
    document.body.removeEventListener('wheel', this._onWheel);
    document.body.removeEventListener(
      'dragover',
      handlePreventDocumentDragOverDelay
    );
    this._dragHandle.removeEventListener('click', this._onClick);
    this._dragHandle.removeEventListener('mousedown', this._onMouseDown);
    isFirefox &&
      document.removeEventListener('dragover', this._onDragOverDocument);
    this.removeEventListener('mousemove', this._onMouseMoveOnHost);
    this._dragHandle.removeEventListener('dragstart', this._onDragStart);
    this._dragHandle.removeEventListener('drag', this._onDrag);
    this._dragHandle.removeEventListener('dragend', this._onDragEnd);
  }

  private _onMouseMoveOnHost(e: MouseEvent) {
    if (isFirefox) {
      this._currentClientX = e.clientX;
      this._currentClientY = e.clientY;
    }

    if (!this._handleAnchorState) {
      return;
    }
    const rect = this._handleAnchorState.position;
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
  private _onResize = (e: UIEvent) => {
    if (this._handleAnchorState) {
      const newModelState = this._getBlockEditingStateByPosition?.(
        this.getDropAllowedBlocks([this._handleAnchorState.model.id]),
        this._handleAnchorState.position.x,
        this._handleAnchorState.position.y,
        true
      );
      if (newModelState) {
        this._handleAnchorState = newModelState;
        this._cursor = newModelState.index;
        const rect = this._handleAnchorState.position;
        this.style.display = 'block';
        const containerRect = this._container.getBoundingClientRect();
        this.style.left = `${rect.left - containerRect.left - 20}px`;
        this.style.top = `${rect.top - containerRect.top + 8}px`;
      }
    }
  };

  private _onWheel = (e: MouseEvent) => {
    this.hide();
  };

  // - select current block
  // - trigger slash menu
  private _onClick = (e: MouseEvent) => {
    const clickDragState = this._getBlockEditingStateByPosition?.(
      this.getDropAllowedBlocks(null),
      e.clientX,
      e.clientY,
      true
    );
    if (clickDragState) {
      this.setSelectedBlocks(clickDragState);
      this._cursor = clickDragState.index;
      this._lastSelectedIndex = this._cursor;
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
    const clickDragState = this._getBlockEditingStateByPosition?.(
      this.getDropAllowedBlocks(null),
      e.clientX,
      e.clientY,
      true
    );

    if (!clickDragState || !e.dataTransfer) {
      return;
    }

    e.dataTransfer.effectAllowed = 'move';

    const selectedBlocks = this._getSelectedBlocks() ?? [];

    // fixme: the block may not have block id?
    const draggingBlockElements = selectedBlocks.includes(
      clickDragState.element
    )
      ? selectedBlocks
      : [clickDragState.element];

    this._dragImage =
      (draggingBlockElements.length > 1
        ? this._container.querySelector('.affine-page-selected-rects-container')
        : draggingBlockElements[0]) ?? clickDragState.element;

    this._dragImage.style.opacity = '0.99';
    e.dataTransfer.setDragImage(this._dragImage, 0, 0);

    this._draggingElements = draggingBlockElements;
  };

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
    if (this._cursor === null || !this._indicator) {
      return;
    }
    const modelState = this._getBlockEditingStateByCursor?.(
      this.getDropAllowedBlocks(this._draggingBlockIds),
      x,
      y,
      this._cursor,
      5,
      false,
      true
    );
    if (modelState) {
      this._cursor = modelState.index;
      this._lastDroppingTarget = modelState;
      this._indicator.targetRect = modelState.position;
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

    this.onDropCallback?.(e, this._draggingElements, this._lastDroppingTarget);

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
