import { assertExists } from '@blocksuite/store/index.js';
import { html, nothing } from 'lit';

import { normalizeAngle } from './utils.js';

export enum HandleDirection {
  Left = 'left',
  Right = 'right',
  TopLeft = 'top-left',
  BottomLeft = 'bottom-left',
  TopRight = 'top-right',
  BottomRight = 'bottom-right',
}

function ResizeHandle(
  handleDirection: HandleDirection,
  onPointerDown?: (e: PointerEvent, direction: HandleDirection) => void,
  updateCursor?: (angle: number, rotating: boolean) => void
) {
  const handlerPointerDown = (e: PointerEvent) => {
    e.stopPropagation();
    onPointerDown && onPointerDown(e, handleDirection);
  };

  const rotatePointerEnter = (e: PointerEvent) => {
    e.stopPropagation();
    if (e.buttons === 1) return;

    if (updateCursor) {
      const rect = (e.target as HTMLElement)
        .closest('.affine-edgeless-selected-rect')
        ?.getBoundingClientRect();
      assertExists(rect);
      const { clientX, clientY } = e;
      const cx = (rect.left + rect.right) / 2;
      const cy = (rect.top + rect.bottom) / 2;
      const angle =
        (Math.atan2(clientY - cy, clientX - cx) * 180) / Math.PI + 45;

      updateCursor(angle, true);
    }
  };
  const rotatePointerLeave = (e: PointerEvent) => {
    e.stopPropagation();
    if (e.buttons === 1) return;

    updateCursor && updateCursor(0, false);
  };

  const resizePointerEnter = (e: PointerEvent) => {
    e.stopPropagation();
    if (e.buttons === 1) return;

    const target = e.target as HTMLElement;

    const rect = target
      .closest('.affine-edgeless-selected-rect')
      ?.getBoundingClientRect();
    assertExists(rect);
    const { clientX, clientY } = e;
    const cx = (rect.left + rect.right) / 2;
    const cy = (rect.top + rect.bottom) / 2;
    const angle = normalizeAngle(
      (Math.atan2(clientY - cy, clientX - cx) * 180) / Math.PI
    );

    // TODO: optimized cursor
    if ((angle >= 0 && angle < 90) || (angle >= 180 && angle < 270)) {
      target.classList.remove('nesw');
      target.classList.add('nwse');
    } else {
      target.classList.remove('nwse');
      target.classList.add('nesw');
    }
  };
  const resizePointerLeave = (e: PointerEvent) => {
    e.stopPropagation();
    if (e.buttons === 1) return;
  };

  const children =
    handleDirection === HandleDirection.Left ||
    handleDirection === HandleDirection.Right
      ? html`<div class="resize ew"></div>`
      : html`<div
            class="rotate"
            @pointerenter=${rotatePointerEnter}
            @pointerleave=${rotatePointerLeave}
          ></div>
          <div
            class="resize"
            @pointerenter=${resizePointerEnter}
            @pointerleave=${resizePointerLeave}
          ></div>`;

  return html`<div
    class="handle"
    aria-label=${handleDirection}
    @pointerdown=${handlerPointerDown}
  >
    ${children}
  </div>`;
}

export type ResizeMode = 'corner' | 'edge' | 'none';
export function ResizeHandles(
  resizeMode: ResizeMode,
  onPointerDown: (e: PointerEvent, direction: HandleDirection) => void,
  updateCursor: (angle: number, rotating: boolean) => void
) {
  switch (resizeMode) {
    case 'corner': {
      const handleTopLeft = ResizeHandle(
        HandleDirection.TopLeft,
        onPointerDown,
        updateCursor
      );
      const handleTopRight = ResizeHandle(
        HandleDirection.TopRight,
        onPointerDown,
        updateCursor
      );
      const handleBottomLeft = ResizeHandle(
        HandleDirection.BottomLeft,
        onPointerDown,
        updateCursor
      );
      const handleBottomRight = ResizeHandle(
        HandleDirection.BottomRight,
        onPointerDown,
        updateCursor
      );

      // prettier-ignore
      return html`
        ${handleTopLeft}
        ${handleTopRight}
        ${handleBottomLeft}
        ${handleBottomRight}
      `;
    }
    case 'edge': {
      const handleLeft = ResizeHandle(HandleDirection.Left, onPointerDown);
      const handleRight = ResizeHandle(HandleDirection.Right, onPointerDown);

      return html`${handleLeft} ${handleRight}`;
    }
    case 'none': {
      return nothing;
    }
  }
}
