export type { Disposable } from './utils/disposable.js';
export { DisposableGroup, flattenDisposable } from './utils/disposable.js';
export { Signal } from './utils/signal.js';
export { caretRangeFromPoint, isFirefox, isWeb } from './utils/web.js';
export const SYS_KEYS = new Set(['id', 'flavour', 'children']);

// https://stackoverflow.com/questions/31538010/test-if-a-variable-is-a-primitive-rather-than-an-object
export function isPrimitive(
  a: unknown
): a is null | undefined | boolean | number | string {
  return a !== Object(a);
}

export function assertExists<T>(val: T | null | undefined): asserts val is T {
  if (val === null || val === undefined) {
    throw new Error('val does not exist');
  }
}

export function assertFlavours(model: { flavour: string }, allowed: string[]) {
  if (!allowed.includes(model.flavour)) {
    throw new Error(`model flavour ${model.flavour} is not allowed`);
  }
}

export function matchFlavours<
  Key extends keyof BlockSuiteInternal.BlockModels &
    string = keyof BlockSuiteInternal.BlockModels & string
>(
  model: { flavour: Key },
  expected: readonly Key[]
): boolean /* model is BlockModels[Key] */ {
  return expected.includes(model.flavour as Key);
}

export const nonTextBlock: (keyof BlockSuiteInternal.BlockModels)[] = [
  'affine:database',
  'affine:divider',
  'affine:embed',
  'affine:code',
];

export const isNonTextBlock = <
  Key extends keyof BlockSuiteInternal.BlockModels &
    string = keyof BlockSuiteInternal.BlockModels & string
>(model: {
  flavour: Key;
}) => matchFlavours(model, nonTextBlock);

type Allowed =
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
  expected: U
): asserts val is U {
  if (!isEqual(val, expected)) {
    throw new Error('val is not same as expected');
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

export const getDefaultPlaygroundURL = (isE2E: boolean): URL =>
  new URL(`http://localhost:${isE2E ? 4173 : 5173}/`);
