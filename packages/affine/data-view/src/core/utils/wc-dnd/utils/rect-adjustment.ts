import type { Coordinates, DndClientRect } from '../types.js';

export const getAdjustedRect = (
  rect: DndClientRect,
  adjustment: Coordinates
) => {
  return {
    ...rect,
    top: rect.top + adjustment.y,
    bottom: rect.bottom + adjustment.y,
    left: rect.left + adjustment.x,
    right: rect.right + adjustment.x,
  };
};
