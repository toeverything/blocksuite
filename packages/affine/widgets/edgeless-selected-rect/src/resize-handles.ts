import type { ResizeHandle } from '@blocksuite/std/gfx';
import { html, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';

export enum HandleDirection {
  Bottom = 'bottom',
  BottomLeft = 'bottom-left',
  BottomRight = 'bottom-right',
  Left = 'left',
  Right = 'right',
  Top = 'top',
  TopLeft = 'top-left',
  TopRight = 'top-right',
}

function ResizeHandleRenderer(
  handle: ResizeHandle,
  rotatable: boolean,
  onPointerDown?: (e: PointerEvent, direction: ResizeHandle) => void,
  updateCursor?: (options?: {
    type: 'resize' | 'rotate';
    handle: ResizeHandle;
  }) => void
) {
  const handlerPointerDown = (e: PointerEvent) => {
    e.stopPropagation();
    onPointerDown && onPointerDown(e, handle);
  };

  const pointerEnter = (type: 'resize' | 'rotate') => (e: PointerEvent) => {
    e.stopPropagation();
    if (e.buttons === 1 || !updateCursor) return;

    updateCursor({ type, handle });
  };

  const pointerLeave = (e: PointerEvent) => {
    e.stopPropagation();
    if (e.buttons === 1 || !updateCursor) return;

    updateCursor();
  };

  const rotationTpl =
    handle.length > 6 && rotatable
      ? html`<div
          class="rotate"
          @pointerover=${pointerEnter('rotate')}
          @pointerout=${pointerLeave}
        ></div>`
      : nothing;

  return html`<div
    class="handle"
    aria-label=${handle}
    @pointerdown=${handlerPointerDown}
  >
    ${rotationTpl}
    <div
      class="resize transparent-handle"
      @pointerover=${pointerEnter('resize')}
      @pointerout=${pointerLeave}
    ></div>
  </div>`;
}

/**
 * Indicate how selected elements can be resized.
 *
 * - edge: The selected elements can only be resized dragging edge, usually when note element is selected
 * - all: The selected elements can be resize both dragging edge or corner, usually when all elements are `shape`
 * - none: The selected elements can't be resized, usually when all elements are `connector`
 * - corner: The selected elements can only be resize dragging corner, this is by default mode
 * - edgeAndCorner: The selected elements can be resize both dragging left right edge or corner, usually when all elements are 'text'
 */
export type ResizeMode = 'edge' | 'all' | 'none' | 'corner' | 'edgeAndCorner';

export function RenderResizeHandles(
  resizeHandles: ResizeHandle[],
  rotatable: boolean,
  onPointerDown: (e: PointerEvent, direction: ResizeHandle) => void,
  updateCursor?: (options?: {
    type: 'resize' | 'rotate';
    handle: ResizeHandle;
  }) => void
) {
  return html`
    ${repeat(
      resizeHandles,
      handle => handle,
      handle =>
        ResizeHandleRenderer(handle, rotatable, onPointerDown, updateCursor)
    )}
  `;
}
