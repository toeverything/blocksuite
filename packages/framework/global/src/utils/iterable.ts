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
  key: (item: T) => string | number | null
): Record<string, number> {
  const count: Record<string, number> = {};
  items.forEach(item => {
    const k = key(item);
    if (k === null) return;
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
export function groupBy<T, K extends string>(
  arr: T[],
  key: K | ((item: T) => K)
): Record<K, T[]> {
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

export function pickArray<T>(target: Array<T>, keys: number[]): Array<T> {
  return keys.reduce((pre, key) => {
    pre.push(target[key]);
    return pre;
  }, [] as T[]);
}

export function pick<T, K extends keyof T>(
  target: T,
  keys: K[]
): Record<K, T[K]> {
  return keys.reduce(
    (pre, key) => {
      pre[key] = target[key];
      return pre;
    },
    {} as Record<K, T[K]>
  );
}

export function pickValues<T, K extends keyof T>(
  target: T,
  keys: K[]
): Array<T[K]> {
  return keys.reduce(
    (pre, key) => {
      pre.push(target[key]);
      return pre;
    },
    [] as Array<T[K]>
  );
}

export function lastN<T>(target: Array<T>, n: number) {
  return target.slice(target.length - n, target.length);
}

export function isEmpty(obj: unknown) {
  if (Object.getPrototypeOf(obj) === Object.prototype) {
    return Object.keys(obj as object).length === 0;
  }

  if (Array.isArray(obj) || typeof obj === 'string') {
    return (obj as Array<unknown>).length === 0;
  }

  return false;
}

export function keys<T>(obj: T): (keyof T)[] {
  return Object.keys(obj as object) as (keyof T)[];
}

export function values<T>(obj: T): T[keyof T][] {
  return Object.values(obj as object);
}

type IterableType<T> = T extends Array<infer U> ? U : T;

export function last<T extends Iterable<unknown>>(
  iterable: T
): IterableType<T> | undefined {
  if (Array.isArray(iterable)) {
    return iterable[iterable.length - 1];
  }

  let last: unknown | undefined;
  for (const item of iterable) {
    last = item;
  }

  return last as IterableType<T>;
}

export function nToLast<T extends Iterable<unknown>>(
  iterable: T,
  n: number
): IterableType<T> | undefined {
  if (Array.isArray(iterable)) {
    return iterable[iterable.length - n];
  }

  const arr = [...iterable];

  return arr[arr.length - n] as IterableType<T>;
}
