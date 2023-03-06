import { PADDING_X, PADDING_Y } from '../utils.js';

export function getCommonRectStyle(
  rect: DOMRect,
  zoom: number,
  isSurfaceElement = false,
  selected = false
) {
  return {
    position: 'absolute',
    left: rect.x + 'px',
    top: rect.y + 'px',
    width: rect.width + (isSurfaceElement ? 0 : PADDING_X) * zoom + 'px',
    height: rect.height + (isSurfaceElement ? 0 : PADDING_Y) * zoom + 'px',
    borderRadius: isSurfaceElement ? '0' : `${10 * zoom}px`,
    pointerEvents: 'none',
    boxSizing: 'border-box',
    zIndex: '1',
    backgroundColor:
      isSurfaceElement && selected ? 'var(--affine-selected-color)' : '',
  };
}
