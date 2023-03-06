import { html } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';

export enum HandleDirection {
  Left = 'left',
  Right = 'right',
  LeftTop = 'left-top',
  LeftBottom = 'left-bottom',
  RightTop = 'right-top',
  RightBottom = 'right-bottom',
}

const directionCursors = {
  [HandleDirection.Right]: 'ew-resize',
  [HandleDirection.Left]: 'ew-resize',
  [HandleDirection.LeftTop]: 'nw-resize',
  [HandleDirection.RightTop]: 'ne-resize',
  [HandleDirection.LeftBottom]: 'sw-resize',
  [HandleDirection.RightBottom]: 'se-resize',
} as const;

export function SelectedHandle(
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
