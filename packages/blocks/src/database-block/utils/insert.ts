import type { InsertPosition } from '../types.js';

export function insertPositionToIndex<
  T extends {
    id: string;
  },
>(position: InsertPosition, arr: T[]): number;
export function insertPositionToIndex<T>(
  position: InsertPosition,
  arr: T[],
  key: (value: T) => string
): number;
export function insertPositionToIndex<T>(
  position: InsertPosition,
  arr: T[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  key: (value: T) => string = (value: any) => value.id
): number {
  if (typeof position === 'object') {
    const index = arr.findIndex(v => key(v) === position.id);
    return index + (position.before ? 0 : 1);
  }
  if (position == null || position === 'start') {
    return 0;
  }
  if (position === 'end') {
    return arr.length;
  }
  return arr.findIndex(v => key(v) === position) + 1;
}
export const arrayMove = <T>(
  arr: T[],
  from: (t: T) => boolean,
  to: (arr: T[]) => number
): T[] => {
  const columnIndex = arr.findIndex(v => from(v));
  if (columnIndex < 0) {
    return arr;
  }
  const newArr = [...arr];
  const [ele] = newArr.splice(columnIndex, 1);
  const index = to(newArr);
  newArr.splice(index, 0, ele);
  return newArr;
};
