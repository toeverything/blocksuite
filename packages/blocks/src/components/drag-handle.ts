import { css, html, LitElement, svg } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import type { IPoint } from '../__internal__/index.js';
import { styleMap } from 'lit/directives/style-map.js';
import type { EditingState } from '../page-block/default/utils.js';
import { getBlockElementByModel } from '../__internal__/index.js';
import { assertExists, isFirefox } from '@blocksuite/global/utils';
import type { BaseBlockModel } from '@blocksuite/store';
import type { SelectionEvent } from '../__internal__/index.js';

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
      background: var(--affine-primary-color);
      transition: top, left 300ms, 100ms cubic-bezier(0.4, 0, 0.2, 1) 0ms,
        transform 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;
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
    return html`
      <div
        class="affine-drag-indicator"
        style=${styleMap({
          width: `${rect.width + 10}px`,
          left: `${rect.left}px`,
          top: `${distanceToTop < distanceToBottom ? rect.top : rect.bottom}px`,
        })}
      ></div>
    `;
  }
}

export type DragHandleGetModelStateCallback = (
  blocks: BaseBlockModel[],
  pageX: number,
  pageY: number,
  skipX?: boolean
) => EditingState | null;

export type DragHandleGetModelStateWithCursorCallback = (
  blocks: BaseBlockModel[],
  pageX: number,
  pageY: number,
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
      cursor: pointer;
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
    onDropCallback: (
      e: DragEvent,
      startModelState: EditingState,
      lastModelState: EditingState
    ) => void;
    getBlockEditingStateByPosition: DragHandleGetModelStateCallback;
    getBlockEditingStateByCursor: DragHandleGetModelStateWithCursorCallback;
    setSelectedBlocks: (selectedBlocks: Element | null) => void;
  }) {
    super();
    this.getDropAllowedBlocks = () => {
      console.warn('you may forget to set `getAllowedBlocks`');
      return [];
    };
    this.onDropCallback = options.onDropCallback;
    this.setSelectedBlocks = options.setSelectedBlocks;
    this._getBlockEditingStateByPosition =
      options.getBlockEditingStateByPosition;
    this._getBlockEditingStateByCursor = options.getBlockEditingStateByCursor;
    document.body.appendChild(this);
  }

  /**
   * A function that returns all blocks that are allowed to be moved to
   *
   * If there is `draggingBlock`, the user is dragging a block to another place
   *
   */
  @property()
  public getDropAllowedBlocks: (
    draggingBlock: BaseBlockModel | null
  ) => BaseBlockModel[];

  @property()
  public onDropCallback: (
    e: DragEvent,
    startModelState: EditingState,
    lastModelState: EditingState
  ) => void;

  @property()
  public setSelectedBlocks: (selectedBlock: Element | null) => void;

  @query('.affine-drag-handle')
  private _dragHandle!: HTMLDivElement;

  @query('.affine-drag-handle-hover')
  private _dragHandleOver!: HTMLDivElement;

  @query('.affine-drag-handle-normal')
  private _dragHandleNormal!: HTMLDivElement;

  private _currentPageX = 0;
  private _currentPageY = 0;

  private _startModelState: EditingState | null = null;

  private _lastModelState: EditingState | null = null;
  private _indicator!: DragIndicator;
  private _cursor: number | null = 0;
  private _lastSelectedIndex = -1;

  private _getBlockEditingStateByPosition: DragHandleGetModelStateCallback | null =
    null;

  private _getBlockEditingStateByCursor: DragHandleGetModelStateWithCursorCallback | null =
    null;

  public showBySelectionEvent(event: SelectionEvent) {
    if (!this._getBlockEditingStateByPosition) {
      return;
    }
    const modelState = this._getBlockEditingStateByPosition(
      this.getDropAllowedBlocks(this._startModelState?.model ?? null),
      event.raw.pageX,
      event.raw.pageY,
      true
    );
    if (modelState) {
      this._startModelState = modelState;
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
      this.style.left = `${rect.left - DRAG_HANDLE_WIDTH - 20}px`;
      this.style.top = `${rect.top}px`;
      this.style.opacity = `${(
        1 -
        (event.raw.pageX - rect.left) / rect.width
      ).toFixed(2)}`;
      const top = Math.max(
        0,
        Math.min(
          event.raw.pageY - rect.top - DRAG_HANDLE_HEIGHT / 2,
          rect.height - DRAG_HANDLE_HEIGHT
        )
      );
      this._dragHandle.style.top = `${top}px`;
    }
  }

  public hide() {
    this.style.display = 'none';
    this._cursor = null;
    this._startModelState = null;
    this._lastModelState = null;
    this._indicator.cursorPosition = null;
    this._indicator.targetRect = null;
  }

  public setPointerEvents(value: 'auto' | 'none') {
    this.style.pointerEvents = value;
  }

  protected firstUpdated() {
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
    this._dragHandle.addEventListener('mousedown', this._onClick);
    this._dragHandle.addEventListener('click', this._onClick);
    isFirefox &&
      document.addEventListener('dragover', this._onDragOverDocument);
    this.addEventListener('mousemove', this._onMouseMoveOnHost);
    this._dragHandle.addEventListener('dragstart', this._onDragStart);
    this._dragHandle.addEventListener('drag', this._onDrag);
    this._dragHandle.addEventListener('dragend', this._onDragEnd);
  }

  public disconnectedCallback() {
    super.disconnectedCallback();
    // Drag handle may be disposed without initializing indicator
    if (this._indicator) {
      this._indicator.cursorPosition = null;
      this._indicator.targetRect = null;
    }

    window.removeEventListener('resize', this._onResize);
    document.body.removeEventListener('wheel', this._onWheel);
    document.body.removeEventListener(
      'dragover',
      handlePreventDocumentDragOverDelay
    );
    this._dragHandle.removeEventListener('mousedown', this._onClick);
    this._dragHandle.removeEventListener('click', this._onClick);
    isFirefox &&
      document.removeEventListener('dragover', this._onDragOverDocument);
    this.removeEventListener('mousemove', this._onMouseMoveOnHost);
    this._dragHandle.removeEventListener('dragstart', this._onDragStart);
    this._dragHandle.removeEventListener('drag', this._onDrag);
    this._dragHandle.removeEventListener('dragend', this._onDragEnd);
  }

  private _onMouseMoveOnHost(e: MouseEvent) {
    if (isFirefox) {
      this._currentPageX = e.pageX;
      this._currentPageY = e.pageY;
    }
    if (!this._startModelState) {
      return;
    }
    const rect = this._startModelState.position;
    const top = Math.max(
      0,
      Math.min(
        e.pageY - rect.top - DRAG_HANDLE_HEIGHT / 2,
        rect.height - DRAG_HANDLE_HEIGHT - 6
      )
    );

    this._dragHandle.style.cursor = 'pointer';
    this._dragHandle.style.top = `${top}px`;
  }

  private _onResize = (e: UIEvent) => {
    if (this._startModelState) {
      const newModelState = this._getBlockEditingStateByPosition?.(
        this.getDropAllowedBlocks(this._startModelState.model),
        this._startModelState.position.x,
        this._startModelState.position.y,
        true
      );
      if (newModelState) {
        this._startModelState = newModelState;
        this._cursor = newModelState.index;
        const rect = this._startModelState.position;
        this.style.display = 'block';
        this.style.left = `${rect.left - 20}px`;
        this.style.top = `${rect.top + 8}px`;
      }
    }
  };

  private _onWheel = (e: MouseEvent) => {
    this.hide();
  };

  private _onClick = (e: MouseEvent) => {
    const clickDragState = this._getBlockEditingStateByPosition?.(
      this.getDropAllowedBlocks(null),
      e.pageX,
      e.pageY,
      true
    );
    if (clickDragState) {
      this._cursor = clickDragState.index;
      this._lastSelectedIndex = this._cursor;
      this.setSelectedBlocks(
        getBlockElementByModel(clickDragState.model) as HTMLElement
      );
      this._dragHandleOver.style.display = 'block';
      this._dragHandleNormal.style.display = 'none';
    }
  };

  private _onDragOverDocument = (e: DragEvent) => {
    if (!isFirefox) {
      throw new Error('FireFox only');
    }
    this._currentPageX = e.pageX;
    this._currentPageY = e.pageY;
  };

  private _onDragStart = (e: DragEvent) => {
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
    }
  };

  private _onDrag = (e: DragEvent) => {
    this._dragHandle.style.cursor = 'grabbing';
    let x = e.pageX;
    let y = e.pageY;
    if (isFirefox) {
      // In Firefox, `pageX` and `pageY` are always set to 0.
      // Refs: https://stackoverflow.com/questions/13110349/pagex-and-pagey-are-always-set-to-0-in-firefox-during-the-ondrag-event.
      x = this._currentPageX;
      y = this._currentPageY;
    }
    if (this._cursor === null) {
      return;
    }
    assertExists(this._startModelState);
    const modelState = this._getBlockEditingStateByCursor?.(
      this.getDropAllowedBlocks(this._startModelState.model),
      x,
      y,
      this._cursor,
      5,
      false,
      true
    );
    if (modelState) {
      this._cursor = modelState.index;
      this._lastModelState = modelState;
      this._indicator.targetRect = modelState.position;
    }
    this._indicator.cursorPosition = {
      x,
      y,
    };
  };

  private _onDragEnd = (e: DragEvent) => {
    assertExists(this._lastModelState);
    assertExists(this._startModelState);

    this.onDropCallback?.(e, this._startModelState, this._lastModelState);

    this.hide();
  };

  override render() {
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
        <div class="affine-drag-handle-normal" draggable="true">
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

        <div class="affine-drag-handle-hover" draggable="true">
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
