import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { IPoint } from '../__internal__/index.js';
import type { BaseBlockModel } from '@blocksuite/store';
import { styleMap } from 'lit/directives/style-map.js';

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
  targetRect!: DOMRect;

  @property()
  cursorPosition!: IPoint;

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

  protected firstUpdated() {
    this.setAttribute('draggable', 'true');
  }

  override render() {
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

const createDragHandle = (anchorEl: HTMLElement) => {
  const rect = anchorEl.getBoundingClientRect();

  const ele = <DragHandle>document.createElement('affine-drag-handle');
  ele.style.position = 'absolute';
  ele.style.left = `${rect.left - 20}px`;
  ele.style.top = `${rect.top + 8}px`;
  return ele;
};

export const showDragHandle = ({
  anchorEl,
  container = document.body,
  onMouseDown,
  onMouseLeave,
  onDrop,
  getModelStateByPosition,
  abortController = new AbortController(),
}: {
  anchorEl: HTMLElement;
  onMouseDown: () => void;
  onMouseLeave: () => void;
  onDrop: (
    e: DragEvent,
    lastModelState: {
      position: DOMRect;
      model: BaseBlockModel;
    }
  ) => void;
  container?: HTMLElement;
  abortController?: AbortController;
  getModelStateByPosition: (
    x: number,
    y: number
  ) => {
    position: DOMRect;
    model: BaseBlockModel;
  } | null;
}) => {
  if (!anchorEl) {
    throw new Error("Can't show drag handle without anchor element!");
  }
  if (abortController.signal.aborted) {
    return;
  }
  let lastModelState: {
    position: DOMRect;
    model: BaseBlockModel;
  } | null = null;

  const dragHandleEle = createDragHandle(anchorEl);
  const handleMouseDown = () => {
    onMouseDown();
  };
  const handleMouseLeave = () => {
    onMouseLeave();
  };
  const indicator = <DragIndicator>(
    document.createElement('affine-drag-indicator')
  );

  const handleDragStart = (e: DragEvent) => {
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
    }
  };

  const handleDragMove = (e: MouseEvent) => {
    const modelState = getModelStateByPosition(e.pageX, e.pageY);
    if (modelState) {
      lastModelState = modelState;
      indicator.targetRect = modelState.position;
    }
    indicator.cursorPosition = {
      x: e.x,
      y: e.y,
    };
  };

  const handleDragEnd = (e: DragEvent) => {
    if (lastModelState) {
      onDrop(e, lastModelState);
    }
  };

  dragHandleEle.addEventListener('dragstart', handleDragStart);
  dragHandleEle.addEventListener('drag', handleDragMove);
  dragHandleEle.addEventListener('dragend', handleDragEnd);
  dragHandleEle.addEventListener('mousedown', handleMouseDown);
  dragHandleEle.addEventListener('mouseleave', handleMouseLeave);
  const handleDragOver = (event: MouseEvent) => {
    // Refs: https://stackoverflow.com/a/65910078
    event.preventDefault();
  };
  container.addEventListener('dragover', handleDragOver, false);
  container.appendChild(dragHandleEle);
  container.appendChild(indicator);

  abortController.signal.addEventListener('abort', () => {
    dragHandleEle.removeEventListener('dragstart', handleDragStart);
    dragHandleEle.removeEventListener('drag', handleDragMove);
    dragHandleEle.removeEventListener('dragend', handleDragEnd);
    container.removeEventListener('dragover', handleDragOver);
    dragHandleEle.removeEventListener('mousedown', handleMouseDown);
    dragHandleEle.removeEventListener('mouseleave', handleMouseLeave);
    indicator.remove();
    dragHandleEle.remove();
  });
};

declare global {
  interface HTMLElementTagNameMap {
    'affine-drag-handle': DragHandle;
    'affine-drag-indicator': DragIndicator;
  }
}
