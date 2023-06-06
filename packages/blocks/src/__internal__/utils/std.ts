import { matchFlavours } from '@blocksuite/global/utils';
import type { BaseBlockModel } from '@blocksuite/store';

import type { Detail } from './types.js';

/**
 * Whether the block supports rendering its children.
 */
export function supportsChildren(model: BaseBlockModel): boolean {
  if (
    matchFlavours(model, [
      // 'affine:database',
      'affine:embed',
      'affine:divider',
      'affine:code',
    ])
  ) {
    return false;
  }
  if (
    matchFlavours(model, ['affine:paragraph']) &&
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

export function almostEqual(a: number, b: number, epsilon = 0.0001) {
  return Math.abs(a - b) < epsilon;
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

/**
 *
 * @example
 * ```ts
 * const items = [
 *  {name: 'a', classroom: 'c1'},
 *  {name: 'b', classroom: 'c2'},
 *  {name: 'a', classroom: 't0'}
 * ]
 * const counted = countBy(items1, i => i.name);
 * // counted: { a: 2, b: 1}
 * ```
 */
export function countBy<T>(
  items: T[],
  key: (item: T) => string | number
): Record<string, number> {
  const count: Record<string, number> = {};
  items.forEach(item => {
    const k = key(item);
    if (!count[k]) {
      count[k] = 0;
    }
    count[k] += 1;
  });
  return count;
}

/**
 * @example
 * ```ts
 * const items = [{n: 1}, {n: 2}]
 * const max = maxBy(items, i => i.n);
 * // max: {n: 2}
 * ```
 */
export function maxBy<T>(items: T[], value: (item: T) => number): T | null {
  if (!items.length) {
    return null;
  }
  let maxItem = items[0];
  let max = value(maxItem);

  for (let i = 1; i < items.length; i++) {
    const item = items[i];
    const v = value(item);
    if (v > max) {
      max = v;
      maxItem = item;
    }
  }

  return maxItem;
}

export function isControlledKeyboardEvent(e: KeyboardEvent) {
  return e.ctrlKey || e.metaKey || e.altKey;
}

export function isPrintableKeyEvent(event: KeyboardEvent): boolean {
  return event.key.length === 1 && !isControlledKeyboardEvent(event);
}

/**
 * Checks if there are at least `n` elements in the array that match the given condition.
 *
 * @param arr - The input array of elements.
 * @param matchFn - A function that takes an element of the array and returns a boolean value
 *                  indicating if the element matches the desired condition.
 * @param n - The minimum number of matching elements required.
 * @returns A boolean value indicating if there are at least `n` matching elements in the array.
 *
 * @example
 * const arr = [1, 2, 3, 4, 5];
 * const isEven = (num: number): boolean => num % 2 === 0;
 * console.log(atLeastNMatches(arr, isEven, 2)); // Output: true
 */
export function atLeastNMatches<T>(
  arr: T[],
  matchFn: (element: T) => boolean,
  n: number
): boolean {
  let count = 0;

  for (let i = 0; i < arr.length; i++) {
    if (matchFn(arr[i])) {
      count++;

      if (count >= n) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Groups an array of elements based on a provided key function.
 *
 * @example
 * interface Student {
 *   name: string;
 *   age: number;
 * }
 * const students: Student[] = [
 *   { name: 'Alice', age: 25 },
 *   { name: 'Bob', age: 23 },
 *   { name: 'Cathy', age: 25 },
 * ];
 * const groupedByAge = groupBy(students, (student) => student.age.toString());
 * console.log(groupedByAge);
 * // Output: {
 *  '23': [ { name: 'Bob', age: 23 } ],
 *  '25': [ { name: 'Alice', age: 25 }, { name: 'Cathy', age: 25 } ]
 * }
 */
export function groupBy<T>(
  arr: T[],
  key: string | ((item: T) => string)
): Record<string, T[]> {
  const result = {} as Record<string, T[]>;

  for (const item of arr) {
    const groupKey =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (typeof key === 'function' ? key(item) : (item as any)[key]) as string;

    if (!result[groupKey]) {
      result[groupKey] = [];
    }

    result[groupKey].push(item);
  }

  return result;
}

function escapeRegExp(input: string) {
  // escape regex characters in the input string to prevent regex format errors
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Checks if the name is a fuzzy match of the query.
 *
 * @example
 * ```ts
 * const name = 'John Smith';
 * const query = 'js';
 * const isMatch = isFuzzyMatch(name, query);
 * // isMatch: true
 * ```
 */
export function isFuzzyMatch(name: string, query: string) {
  const pureName = name
    .trim()
    .toLowerCase()
    .split('')
    .filter(char => char !== ' ')
    .join('');

  const regex = new RegExp(
    query
      .split('')
      .filter(char => char !== ' ')
      .map(item => `${escapeRegExp(item)}.*`)
      .join(''),
    'i'
  );
  return regex.test(pureName);
}

export function toHex(color: string) {
  let r, g, b;

  if (color.startsWith('#')) {
    color = color.substr(1);
    if (color.length === 3) {
      color = color.replace(/./g, '$&$&');
    }
    [r, g, b] = color.match(/.{2}/g)?.map(hex => parseInt(hex, 16)) ?? [];
  } else if (color.startsWith('rgba')) {
    [r, g, b] = color.match(/\d+/g)?.map(Number) ?? [];
  } else if (color.startsWith('rgb')) {
    [r, g, b] = color.match(/\d+/g)?.map(Number) ?? [];
  } else {
    throw new Error('Invalid color format');
  }

  if (r === undefined || g === undefined || b === undefined) {
    throw new Error('Invalid color format');
  }

  const hex = ((r << 16) | (g << 8) | b).toString(16);
  return '#' + '0'.repeat(6 - hex.length) + hex;
}

export function capitalize(s: string) {
  if (!s.length) {
    return s;
  }
  return s[0].toUpperCase() + s.slice(1);
}

export function uncapitalize(s: string) {
  if (!s.length) {
    return s;
  }
  return s[0].toLowerCase() + s.slice(1);
}
