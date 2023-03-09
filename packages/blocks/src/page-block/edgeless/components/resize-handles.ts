import { html } from 'lit';
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
  onMouseDown?: (e: MouseEvent, direction: HandleDirection) => void
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
    border: '2px var(--affine-primary-color) solid',
    background: 'white',
    cursor: directionCursors[handleDirection],
  };

  const handlerMouseDown = (e: MouseEvent) => {
    onMouseDown && onMouseDown(e, handleDirection);
  };

  return html`
    <div
      aria-label=${`handle-${handleDirection}`}
      style=${styleMap(style)}
      @mousedown=${handlerMouseDown}
    ></div>
  `;
}

export type ResizeMode = 'corner' | 'edge';
export function ResizeHandles(
  rect: DOMRect,
  resizeMode: ResizeMode,
  onMouseDown: (e: MouseEvent, direction: HandleDirection) => void
) {
  switch (resizeMode) {
    case 'corner': {
      const leftTop = [rect.x, rect.y];
      const rightTop = [rect.x + rect.width, rect.y];
      const leftBottom = [rect.x, rect.y + rect.height];
      const rightBottom = [rect.x + rect.width, rect.y + rect.height];

      const topLeft = ResizeHandle(
        leftTop[0],
        leftTop[1],
        HandleDirection.TopLeft,
        onMouseDown
      );
      const topRight = ResizeHandle(
        rightTop[0],
        rightTop[1],
        HandleDirection.TopRight,
        onMouseDown
      );
      const bottomLeft = ResizeHandle(
        leftBottom[0],
        leftBottom[1],
        HandleDirection.BottomLeft,
        onMouseDown
      );
      const bottomRight = ResizeHandle(
        rightBottom[0],
        rightBottom[1],
        HandleDirection.BottomRight,
        onMouseDown
      );

      return html` ${topLeft} ${topRight} ${bottomLeft} ${bottomRight} `;
    }
    case 'edge': {
      const leftCenter = [rect.x, rect.y + rect.height / 2];
      const rightCenter = [rect.x + rect.width, rect.y + rect.height / 2];

      const handleLeft = ResizeHandle(
        leftCenter[0],
        leftCenter[1],
        HandleDirection.Left,
        onMouseDown
      );
      const handleRight = ResizeHandle(
        rightCenter[0],
        rightCenter[1],
        HandleDirection.Right,
        onMouseDown
      );

      return html` ${handleLeft} ${handleRight} `;
    }
  }
}
