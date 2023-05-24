import { html, nothing } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';

export enum HandleDirection {
  Left = 'left',
  Right = 'right',
  TopLeft = 'top-left',
  BottomLeft = 'bottom-left',
  TopRight = 'top-right',
  BottomRight = 'bottom-right',
}

const directionCursors = {
  [HandleDirection.Right]: 'ew-resize',
  [HandleDirection.Left]: 'ew-resize',
  [HandleDirection.TopLeft]: 'nw-resize',
  [HandleDirection.TopRight]: 'ne-resize',
  [HandleDirection.BottomLeft]: 'sw-resize',
  [HandleDirection.BottomRight]: 'se-resize',
} as const;

function ResizeHandle(
  centerX: number,
  centerY: number,
  handleDirection: HandleDirection,
  onPointerDown?: (e: PointerEvent, direction: HandleDirection) => void
) {
  const style = {
    position: 'absolute',
    left: centerX - 6 + 'px',
    top: centerY - 6 + 'px',
    width: '12px',
    height: '12px',
    boxSizing: 'border-box',
    borderRadius: '6px',
    zIndex: '10',
    border: '2px var(--affine-blue) solid',
    background: 'white',
    cursor: directionCursors[handleDirection],
    /**
     * Fix: pointerEvent stops firing after a short time.
     * When a gesture is started, the browser intersects the touch-action values of the touched element and its ancestors,
     * up to the one that implements the gesture (in other words, the first containing scrolling element)
     * https://developer.mozilla.org/en-US/docs/Web/CSS/touch-action
     */
    touchAction: 'none',
  };

  const handlerPointerDown = (e: PointerEvent) => {
    e.stopPropagation();
    onPointerDown && onPointerDown(e, handleDirection);
  };

  return html`
    <div
      aria-label=${`handle-${handleDirection}`}
      style=${styleMap(style)}
      @pointerdown=${handlerPointerDown}
    ></div>
  `;
}

export type ResizeMode = 'corner' | 'edge' | 'none';
export function ResizeHandles(
  rect: DOMRect,
  resizeMode: ResizeMode,
  onPointerDown: (e: PointerEvent, direction: HandleDirection) => void
) {
  switch (resizeMode) {
    case 'corner': {
      const topLeft = [rect.x, rect.y];
      const topRight = [rect.x + rect.width, rect.y];
      const bottomLeft = [rect.x, rect.y + rect.height];
      const bottomRight = [rect.x + rect.width, rect.y + rect.height];

      const handleTopLeft = ResizeHandle(
        topLeft[0],
        topLeft[1],
        HandleDirection.TopLeft,
        onPointerDown
      );
      const handleTopRight = ResizeHandle(
        topRight[0],
        topRight[1],
        HandleDirection.TopRight,
        onPointerDown
      );
      const handleBottomLeft = ResizeHandle(
        bottomLeft[0],
        bottomLeft[1],
        HandleDirection.BottomLeft,
        onPointerDown
      );
      const handleBottomRight = ResizeHandle(
        bottomRight[0],
        bottomRight[1],
        HandleDirection.BottomRight,
        onPointerDown
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
      const leftCenter = [rect.x, rect.y + rect.height / 2];
      const rightCenter = [rect.x + rect.width, rect.y + rect.height / 2];

      const handleLeft = ResizeHandle(
        leftCenter[0],
        leftCenter[1],
        HandleDirection.Left,
        onPointerDown
      );
      const handleRight = ResizeHandle(
        rightCenter[0],
        rightCenter[1],
        HandleDirection.Right,
        onPointerDown
      );

      return html` ${handleLeft} ${handleRight} `;
    }
    case 'none': {
      return nothing;
    }
  }
}
