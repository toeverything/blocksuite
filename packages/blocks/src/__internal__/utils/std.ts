import { BaseBlockModel, Utils } from '@blocksuite/store';
import type { Detail } from './types.js';

export function assertExists<T>(val: T | null | undefined): asserts val is T {
  if (val === null || val === undefined) {
    throw new Error('val does not exist');
  }
}

export const assertFlavours = Utils.assertFlavours;

export const matchFlavours = Utils.matchFlavours;

/**
 * Whether the block supports rendering its children.
 */
export function supportsChildren(model: BaseBlockModel): boolean {
  return !matchFlavours(model, [
    'affine:embed',
    'affine:divider',
    'affine:code',
  ]);
}

const isWeb = typeof window !== 'undefined';
const isFirefox =
  isWeb && navigator.userAgent.toLowerCase().indexOf('firefox') > -1;

export function caretRangeFromPoint(
  clientX: number,
  clientY: number
): Range | null {
  if (isFirefox) {
    // @ts-ignore
    const caret = document.caretPositionFromPoint(clientX, clientY);
    const range = document.createRange();
    range.setStart(caret.offsetNode, caret.offset);
    return range;
  }
  return document.caretRangeFromPoint(clientX, clientY);
}

export function almostEqual(a: number, b: number) {
  return Math.abs(a - b) < 0.0001;
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

/**
 * @example
 * ```ts
 * const log = (message: string) => console.log(`[${new Date().toISOString()}] ${message}`);
 *
 * const throttledLog = throttle(log, 1000);
 *
 * throttledLog("Hello, world!");
 * throttledLog("Hello, world!");
 * throttledLog("Hello, world!");
 * throttledLog("Hello, world!");
 * throttledLog("Hello, world!");
 * ```
 */
export const throttle = <
  Args extends unknown[],
  T extends (this: unknown, ...args: Args) => void
>(
  fn: T,
  limit: number,
  { leading = true, trailing = true } = {}
): T => {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Args | null = null;

  const setTimer = () => {
    if (lastArgs && trailing) {
      fn(...lastArgs);
      lastArgs = null;
      timer = setTimeout(setTimer, limit);
    } else {
      timer = null;
    }
  };

  return function (this: unknown, ...args: Parameters<T>) {
    if (timer) {
      // in throttle
      lastArgs = args;
      return;
    }
    // Execute the function on the leading edge
    if (leading) {
      fn.apply(this, args);
    }
    timer = setTimeout(setTimer, limit);
  } as T;
};

/**
 * This function takes a value value, a minimum value min, and a maximum value max,
 * and returns the value of value clamped to the range [min, max].
 *
 * This means that if value is less than min, the function will return min;
 * if value is greater than max, the function will return max;
 * otherwise, the function will return value.
 *
 * @example
 * ```ts
 * const x = clamp(10, 0, 5); // x will be 5
 * const y = clamp(3, 0, 5); // y will be 3
 * const z = clamp(-1, 0, 5); // z will be 0
 * ```
 */
export const clamp = (value: number, min: number, max: number): number => {
  if (value < min) {
    return min;
  }
  if (value > max) {
    return max;
  }
  return value;
};
