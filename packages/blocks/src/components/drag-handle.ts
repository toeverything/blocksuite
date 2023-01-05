import { css, html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';

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
      <div>
        <svg
          viewBox="0 0 10 10"
          style="width: 14px; height: 14px; display: block; flex-shrink: 0; backface-visibility: hidden;"
        >
          <path
            d="M3,2 C2.44771525,2 2,1.55228475 2,1 C2,0.44771525 2.44771525,0 3,0 C3.55228475,0 4,0.44771525 4,1 C4,1.55228475 3.55228475,2 3,2 Z M3,6 C2.44771525,6 2,5.55228475 2,5 C2,4.44771525 2.44771525,4 3,4 C3.55228475,4 4,4.44771525 4,5 C4,5.55228475 3.55228475,6 3,6 Z M3,10 C2.44771525,10 2,9.55228475 2,9 C2,8.44771525 2.44771525,8 3,8 C3.55228475,8 4,8.44771525 4,9 C4,9.55228475 3.55228475,10 3,10 Z M7,2 C6.44771525,2 6,1.55228475 6,1 C6,0.44771525 6.44771525,0 7,0 C7.55228475,0 8,0.44771525 8,1 C8,1.55228475 7.55228475,2 7,2 Z M7,6 C6.44771525,6 6,5.55228475 6,5 C6,4.44771525 6.44771525,4 7,4 C7.55228475,4 8,4.44771525 8,5 C8,5.55228475 7.55228475,6 7,6 Z M7,10 C6.44771525,10 6,9.55228475 6,9 C6,8.44771525 6.44771525,8 7,8 C7.55228475,8 8,8.44771525 8,9 C8,9.55228475 7.55228475,10 7,10 Z"
          ></path>
        </svg>
      </div>
    `;
  }
}

const createDragHandle = (anchorEl: HTMLElement, container: HTMLElement) => {
  const rect = anchorEl.getBoundingClientRect();

  const ele = <DragHandle>document.createElement('affine-drag-handle');
  ele.style.position = 'absolute';
  ele.style.left = `${rect.left - 20}px`;
  ele.style.top = `${rect.top + 6}px`;
  container.appendChild(ele);
  return ele;
};

export const showDragHandle = async ({
  anchorEl,
  container = document.body,
  onMouseDown = () => {
    return void 0;
  },
  onDrop = () => {
    return void 0;
  },
  abortController = new AbortController(),
}: {
  anchorEl: HTMLElement;
  onMouseDown?: () => void;
  onDrop?: (e: DragEvent) => void;
  container?: HTMLElement;
  abortController?: AbortController;
}) => {
  if (!anchorEl) {
    throw new Error("Can't show drag handle without anchor element!");
  }
  if (abortController.signal.aborted) {
    return;
  }

  const dragHandleEle = createDragHandle(anchorEl, container);
  const handleMouseDown = () => {
    onMouseDown();
  };
  const handleDragStart = (e: Event) => {
    console.log(e);
  };
  const handleDragMove = (e: Event) => {
    // todo
  };
  const handleDragEnd = (e: DragEvent) => {
    onDrop(e);
  };
  dragHandleEle.addEventListener('dragstart', handleDragStart);
  dragHandleEle.addEventListener('drag', handleDragMove);
  dragHandleEle.addEventListener('dragend', handleDragEnd);
  dragHandleEle.addEventListener('mousedown', handleMouseDown);
  const handleDragOver = (event: MouseEvent) => {
    event.preventDefault();
  };
  document.addEventListener('dragover', handleDragOver, false);

  abortController.signal.addEventListener('abort', () => {
    dragHandleEle.removeEventListener('dragstart', handleDragStart);
    dragHandleEle.removeEventListener('drag', handleDragMove);
    dragHandleEle.removeEventListener('dragend', handleDragEnd);
    document.removeEventListener('dragover', handleDragOver);
    dragHandleEle.removeEventListener('mousedown', handleMouseDown);
    dragHandleEle.remove();
  });
};

declare global {
  interface HTMLElementTagNameMap {
    'affine-drag-handle': DragHandle;
  }
}
