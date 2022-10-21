import type { BaseBlockModel } from '@blocksuite/store';
import type { Detail } from './types';

export function assertExists<T>(val: T | null | undefined): asserts val is T {
  if (!val) throw new Error('val does not exist');
}

export function assertFlavours(model: BaseBlockModel, allowed: string[]) {
  if (!allowed.includes(model.flavour)) {
    throw new Error(`model flavour ${model.flavour} is not allowed`);
  }
}

export function caretRangeFromPoint(x: number, y: number) {
  return document.caretRangeFromPoint(x, y);
}

export function createEvent<
  T extends keyof WindowEventMap | keyof HTMLElementEventMap
>(type: T, detail: Detail<T>) {
  return new CustomEvent<Detail<T>>(type, { detail });
}

export function noop() {
  return;
}

/**
 * Sleep is not a good practice.
 * Please use it sparingly!
 */
export const sleep = (ms = 0) =>
  new Promise(resolve => setTimeout(resolve, ms));
