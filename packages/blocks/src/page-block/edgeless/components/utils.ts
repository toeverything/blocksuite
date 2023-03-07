export function getCommonRectStyle(
  rect: DOMRect,
  active = false,
  selected = false
) {
  return {
    position: 'absolute',
    left: rect.x + 'px',
    top: rect.y + 'px',
    width: rect.width + 'px',
    height: rect.height + 'px',
    borderRadius: '0',
    pointerEvents: 'none',
    boxSizing: 'border-box',
    zIndex: '1',
    backgroundColor: !active && selected ? 'var(--affine-selected-color)' : '',
  };
}
