import type { BaseBlockModel } from '@blocksuite/store';

import type { BlockModels } from './types.js';

export type { Disposable } from './utils/disposable.js';
export { DisposableGroup } from './utils/disposable.js';
export { Slot } from './utils/slot.js';
export { caretRangeFromPoint, isFirefox, isWeb } from './utils/web.js';
export const SYS_KEYS = new Set(['id', 'flavour', 'children']);

// https://stackoverflow.com/questions/31538010/test-if-a-variable-is-a-primitive-rather-than-an-object
export function isPrimitive(
  a: unknown
): a is null | undefined | boolean | number | string {
  return a !== Object(a);
}

export function assertExists<T>(
  val: T | null | undefined,
  message: string | Error = 'val does not exist'
): asserts val is T {
  if (val === null || val === undefined) {
    if (message instanceof Error) {
      throw message;
    }
    throw new Error(message);
  }
}

export function assertNotExists<T>(
  val: T | null | undefined,
  message = 'val exists'
): asserts val is null | undefined {
  if (val !== null && val !== undefined) {
    throw new Error(message);
  }
}

export function assertFlavours(model: { flavour: string }, allowed: string[]) {
  if (!allowed.includes(model.flavour)) {
    throw new Error(`model flavour ${model.flavour} is not allowed`);
  }
}

type BlockModelKey = keyof BlockModels;
type Flavours<T> = T extends BlockModelKey[] ? BlockModels[T[number]] : never;
type Writeable<T> = { -readonly [P in keyof T]: T[P] };

export function matchFlavours<const Key extends readonly string[]>(
  model: BaseBlockModel,
  expected: Key
): model is Flavours<Writeable<Key>> {
  return expected.includes(model.flavour);
}

// XXX: nonTextBlock may should be declared in block schema
export const nonTextBlock: (keyof BlockModels)[] = [
  'affine:database',
  'affine:divider',
  'affine:embed',
  'affine:code',
  'affine:bookmark',
];

export const isNonTextBlock = <
  Key extends keyof BlockModels & string = keyof BlockModels & string
>(
  model: BaseBlockModel
) => matchFlavours(model, nonTextBlock);

type Allowed =
  | unknown
  | void
  | null
  | undefined
  | boolean
  | number
  | string
  | unknown[]
  | object;
export function assertEquals<T extends Allowed, U extends T>(
  val: T,
  expected: U,
  message = 'val is not same as expected'
): asserts val is U {
  if (!isEqual(val, expected)) {
    throw new Error(message);
  }
}

export function isEqual<T extends Allowed, U extends T>(
  val: T,
  expected: U
): boolean {
  const a = isPrimitive(val);
  const b = isPrimitive(expected);
  if (a && b) {
    if (!Object.is(val, expected)) {
      return false;
    }
  } else if (a !== b) {
    return false;
  } else {
    if (Array.isArray(val) && Array.isArray(expected)) {
      if (val.length !== expected.length) {
        return false;
      }
      return val.every((x, i) => isEqual(x, expected[i]));
    } else if (typeof val === 'object' && typeof expected === 'object') {
      const obj1 = Object.entries(val as Record<string, unknown>);
      const obj2 = Object.entries(expected as Record<string, unknown>);
      if (obj1.length !== obj2.length) {
        return false;
      }
      return obj1.every((x, i) => isEqual(x, obj2[i]));
    }
  }
  return true;
}

export async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
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
