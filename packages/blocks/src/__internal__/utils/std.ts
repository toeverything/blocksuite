import { matchFlavours } from '@blocksuite/global/utils';
import type { BaseBlockModel } from '@blocksuite/store';

import type { Detail } from './types.js';

/**
 * Whether the block supports rendering its children.
 */
export function supportsChildren(model: BaseBlockModel): boolean {
  if (matchFlavours(model, ['affine:embed', 'affine:divider', 'affine:code'])) {
    return false;
  }
  if (
    matchFlavours(model, ['affine:paragraph'] as const) &&
    ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'quote'].includes(model.type ?? '')
  ) {
    return false;
  }
  return true;
}

export function isEmpty(model: BaseBlockModel): boolean {
  if (model.children.length !== 0) {
    const found = model.children.find(c => !isEmpty(c));
    return !found;
  }
  return (
    !model.text?.length && !model.sourceId && model.flavour !== 'affine:code'
  );
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
export function throttle<
  Args extends unknown[],
  T extends (...args: Args) => void
>(
  fn: (...args: Args) => void,
  limit: number,
  options?: { leading?: boolean; trailing?: boolean }
): T;
export function throttle<
  Args extends unknown[],
  T extends (this: unknown, ...args: Args) => void
>(fn: T, limit: number, { leading = true, trailing = true } = {}): T {
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
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const debounce = <T extends (...args: any[]) => void>(
  fn: T,
  limit: number,
  { leading = true, trailing = true } = {}
): T => {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;

  const setTimer = () => {
    if (lastArgs && trailing) {
      fn(...lastArgs);
      lastArgs = null;
      timer = setTimeout(setTimer, limit);
    } else {
      timer = null;
    }
  };

  return function (...args: Parameters<T>) {
    if (timer) {
      lastArgs = args;
      clearTimeout(timer);
    }
    if (leading && !timer) {
      fn(...args);
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
