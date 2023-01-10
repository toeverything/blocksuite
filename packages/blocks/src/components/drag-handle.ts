import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { IPoint } from '../__internal__/index.js';
import { isFirefox } from '../__internal__/utils/std.js';
import { styleMap } from 'lit/directives/style-map.js';
import type { EditingState } from '../page-block/default/utils.js';
import { assertExists, getBlockElementByModel } from '../__internal__/index.js';

const IS_PROD = location.href.includes('pathfinder');

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
  pageX: number,
  pageY: number,
  skipX?: boolean
) => EditingState | null;

export type DragHandleGetModelStateWithCursorCallback = (
  pageX: number,
  pageY: number,
  cursor: number,
  size?: number,
  skipX?: boolean
) => EditingState | null;

@customElement('affine-drag-handle')
export class DragHandle extends LitElement {
  static styles = css`
    .affine-drag-handle {
      cursor: grab;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 18px;
      height: 24px;
      border-radius: 3px;
      fill: rgba(55, 53, 47, 0.35);
      background: rgba(55, 53, 47, 0.08);
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
    setSelectedBlocks: (selectedBlocks: Element[]) => void;
  }) {
    super();
    this.onDropCallback = options.onDropCallback;
    this.setSelectedBlocks = options.setSelectedBlocks;
    this._getBlockEditingStateByPosition =
      options.getBlockEditingStateByPosition;
    this._getBlockEditingStateByCursor = options.getBlockEditingStateByCursor;
    document.body.appendChild(this);
  }

  @property()
  public onDropCallback: (
    e: DragEvent,
    startModelState: EditingState,
    lastModelState: EditingState
  ) => void;

  @property()
  public setSelectedBlocks: (selectedBlocks: Element[]) => void;

  private _currentPageX = 0;
  private _currentPageY = 0;

  private _startModelState: EditingState | null = null;

  private _lastModelState: EditingState | null = null;
  private _indicator!: DragIndicator;
  private _cursor: number | null = 0;

  private _getBlockEditingStateByPosition: DragHandleGetModelStateCallback | null =
    null;

  private _getBlockEditingStateByCursor: DragHandleGetModelStateWithCursorCallback | null =
    null;

  protected firstUpdated() {
    this.setAttribute('draggable', 'true');
    this.style.display = 'none';
  }

  public show(startModelState: EditingState) {
    this._startModelState = startModelState;
    this._cursor = startModelState.index;
    const rect = this._startModelState.position;
    this.style.position = 'absolute';
    this.style.display = 'block';
    this.style.left = `${rect.left - 20}px`;
    this.style.top = `${rect.top + 8}px`;
  }

  public hide() {
    this.style.display = 'none';
    this._cursor = null;
    this._startModelState = null;
    this._lastModelState = null;
    this._indicator.cursorPosition = null;
    this._indicator.targetRect = null;
  }

  public connectedCallback() {
    super.connectedCallback();
    document.body.addEventListener(
      'dragover',
      handlePreventDocumentDragOverDelay,
      false
    );
    document.body.addEventListener('wheel', this._onWheel);
    window.addEventListener('resize', this._onResize);
    this._indicator = <DragIndicator>(
      document.createElement('affine-drag-indicator')
    );
    document.body.appendChild(this._indicator);
    this.addEventListener('mousedown', this._onMouseDown);
    isFirefox &&
      document.addEventListener('dragover', this._onDragOverDocument);
    this.addEventListener('mouseleave', this._onMouseLeave);
    this.addEventListener('dragstart', this._onDragStart);
    this.addEventListener('drag', this._onDrag);
    this.addEventListener('dragend', this._onDragEnd);
  }

  public disconnectedCallback() {
    super.disconnectedCallback();
    this._indicator.remove();
    window.removeEventListener('resize', this._onResize);
    document.body.removeEventListener('wheel', this._onWheel);
    document.body.removeEventListener(
      'dragover',
      handlePreventDocumentDragOverDelay
    );
    this.removeEventListener('mousedown', this._onMouseDown);
    isFirefox &&
      document.removeEventListener('dragover', this._onDragOverDocument);
    this.removeEventListener('mouseleave', this._onMouseLeave);
    this.removeEventListener('dragstart', this._onDragStart);
    this.removeEventListener('drag', this._onDrag);
    this.removeEventListener('dragend', this._onDragEnd);
  }

  private _onResize = (e: UIEvent) => {
    if (this._startModelState) {
      const newModelState = this._getBlockEditingStateByPosition?.(
        this._startModelState.position.x,
        this._startModelState.position.y,
        true
      );
      if (newModelState) {
        this.show(newModelState);
      }
    }
  };

  private _onWheel = (e: MouseEvent) => {
    this.hide();
  };

  private _onMouseDown = (e: MouseEvent) => {
    const clickDragState = this._getBlockEditingStateByPosition?.(
      e.pageX,
      e.pageY,
      true
    );
    if (clickDragState) {
      this._cursor = clickDragState.index;
      this.setSelectedBlocks([
        getBlockElementByModel(clickDragState.model) as HTMLElement,
      ]);
    }
  };

  private _onDragOverDocument = (e: DragEvent) => {
    if (!isFirefox) {
      throw new Error('FireFox only');
    }
    this._currentPageX = e.pageX;
    this._currentPageY = e.pageY;
  };

  private _onMouseLeave = (_: MouseEvent) => {
    this.setSelectedBlocks([]);
  };

  private _onDragStart = (e: DragEvent) => {
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
    }
  };

  private _onDrag = (e: DragEvent) => {
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
    const modelState = this._getBlockEditingStateByCursor?.(
      x,
      y,
      this._cursor,
      5,
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
    if (IS_PROD) return null;

    return html`
      <div class="affine-drag-handle">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 128 512"
          style="width: 14px; height: 14px; display: block; flex-shrink: 0; backface-visibility: hidden;"
        >
          <path
            d="M64 360c30.9 0 56 25.1 56 56s-25.1 56-56 56s-56-25.1-56-56s25.1-56 56-56zm0-160c30.9 0 56 25.1 56 56s-25.1 56-56 56s-56-25.1-56-56s25.1-56 56-56zM120 96c0 30.9-25.1 56-56 56S8 126.9 8 96S33.1 40 64 40s56 25.1 56 56z"
          />
        </svg>
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
