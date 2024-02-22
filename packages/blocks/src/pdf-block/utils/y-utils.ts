import type { Y } from '@blocksuite/store';

export type YDict<T> = {
  get(key: keyof T): Y.Item | undefined;
  set(key: keyof T, value: T[keyof T]): void;
};

export function toYDict<T>(yMap: Y.Map<unknown>) {
  return yMap as YDict<T>;
}
