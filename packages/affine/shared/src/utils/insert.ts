import { generateKeyBetween } from 'fractional-indexing';

export type InsertToPosition =
  | 'end'
  | 'start'
  | {
      id: string;
      before: boolean;
    };

export function insertPositionToIndex<
  T extends {
    id: string;
  },
>(position: InsertToPosition, arr: T[]): number;
export function insertPositionToIndex<T>(
  position: InsertToPosition,
  arr: T[],
  key: (value: T) => string
): number;
export function insertPositionToIndex<T>(
  position: InsertToPosition,
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

export type NewInsertPosition = {
  prevId?: string;
  nextId?: string;
};

export const numIndexToStrIndex = (index: number) => {
  return `V${index.toString(10).padStart(6, '0')}`;
};

export const getIndexMap = <
  T extends {
    id: string;
    index?: string;
  },
>(
  arr: T[]
): Map<string, string> => {
  const map = new Map<string, string>();
  arr.forEach((v, i) => {
    map.set(v.id, v.index ?? numIndexToStrIndex(i));
  });
  return map;
};

export const genIndexByPosition = (
  position: NewInsertPosition,
  indexMap: Map<string, string>
) => {
  return generateKeyBetween(
    position.prevId ? indexMap.get(position.prevId) : null,
    position.nextId ? indexMap.get(position.nextId) : null
  );
};

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
