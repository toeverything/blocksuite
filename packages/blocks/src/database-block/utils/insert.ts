import type { InsertPosition } from '../types.js';

export const insertPositionToIndex = <
  T extends {
    id: string;
  }
>(
  position: InsertPosition,
  arr: T[]
): number => {
  if (typeof position === 'object') {
    const index = arr.findIndex(v => v.id === position.id);
    return index + (position.before ? 0 : 1);
  }
  if (position == null || position === 'start') {
    return 0;
  }
  if (position === 'end') {
    return arr.length;
  }
  return arr.findIndex(v => v.id === position) + 1;
};
