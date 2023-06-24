import { Vec } from '@blocksuite/phasor';
import { assertExists } from '@blocksuite/store';
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
  updateCursor?: (
    angle: number,
    dragging: boolean,
    type?: 'resize' | 'rotate'
  ) => void
) {
  const handlerPointerDown = (e: PointerEvent) => {
    e.stopPropagation();
    onPointerDown && onPointerDown(e, handleDirection);
  };

  const pointerEnter = (type: 'resize' | 'rotate') => (e: PointerEvent) => {
    e.stopPropagation();
    if (type === 'rotate' && e.buttons === 1) return;

    if (updateCursor) {
      const { clientX, clientY } = e;
      const target = e.target as HTMLElement;
      const angle = calcAngle(target, [clientX, clientY], 45);

      updateCursor(angle, true, type);
    }
  };

  const pointerLeave = (e: PointerEvent) => {
    e.stopPropagation();
    if (e.buttons === 1) return;

    updateCursor && updateCursor(0, false);
  };

  const rotationTpl =
    handleDirection === HandleDirection.Left ||
    handleDirection === HandleDirection.Right
      ? nothing
      : html`<div
          class="rotate"
          @pointerenter=${pointerEnter('rotate')}
          @pointerleave=${pointerLeave}
        ></div>`;

  return html`<div
    class="handle"
    aria-label=${handleDirection}
    @pointerdown=${handlerPointerDown}
  >
    ${rotationTpl}
    <div
      class="resize"
      @pointerenter=${pointerEnter('resize')}
      @pointerleave=${pointerLeave}
    ></div>
  </div>`;
}

export type ResizeMode = 'corner' | 'edge' | 'none';
export function ResizeHandles(
  resizeMode: ResizeMode,
  onPointerDown: (e: PointerEvent, direction: HandleDirection) => void,
  updateCursor: (
    angle: number,
    dragging: boolean,
    type?: 'resize' | 'rotate'
  ) => void
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
      const handleLeft = ResizeHandle(
        HandleDirection.Left,
        onPointerDown,
        updateCursor
      );
      const handleRight = ResizeHandle(
        HandleDirection.Right,
        onPointerDown,
        updateCursor
      );

      return html`${handleLeft} ${handleRight}`;
    }
    case 'none': {
      return nothing;
    }
  }
}

function calcAngle(target: HTMLElement, point: number[], offset = 0) {
  const rect = target
    .closest('.affine-edgeless-selected-rect')
    ?.getBoundingClientRect();
  assertExists(rect);
  const { left, top, right, bottom } = rect;
  const center = Vec.med([left, top], [right, bottom]);
  return normalizeAngle(((Vec.angle(center, point) + offset) * 180) / Math.PI);
}
