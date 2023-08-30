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

export function pick<T, K extends Partial<keyof T>>(
  target: T,
  keys: K[]
): { [key in K]: T[K] } {
  return keys.reduce(
    (pre, key) => {
      pre[key] = target[key];
      return pre;
    },
    {} as { [key in K]: T[K] }
  );
}

export function pickValues<T, K extends Partial<keyof T>>(
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

/**
 * Returns an object with four arrays: add, remove and unchanged.
 *
 * add: elements in after that are not in before
 * remove: elements in before that are not in after
 * unchanged: elements in both before and after
 */
export function diffArray<T>(
  before: T[],
  after: T[],
  compare = (a: T, b: T) => a === b
) {
  const add: T[] = [];
  const remove: T[] = [];
  const unchanged: T[] = [];

  // Find elements in before that are not in after
  for (const elem of before) {
    if (!after.some(afterElem => compare(afterElem, elem))) {
      remove.push(elem);
    } else {
      unchanged.push(elem);
    }
  }
  // Find elements in after that are not in before
  for (const elem of after) {
    if (!before.some(beforeElem => compare(beforeElem, elem))) {
      add.push(elem);
    }
  }

  return { changed: add.length || remove.length, add, remove, unchanged };
}
