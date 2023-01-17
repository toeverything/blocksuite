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
  expected: Key[]
): boolean /* model is BlockModels[Key] */ {
  return expected.includes(model.flavour as Key);
}

type Allowed =
  | null
  | undefined
  | boolean
  | number
  | string
  | Record<string, unknown>
  | unknown[];
export function assertEquals<T extends Allowed, U extends T>(
  val: T,
  expected: U
): asserts val is U {
  const a = isPrimitive(val);
  const b = isPrimitive(expected);
  if (a && b) {
    if (!Object.is(val, expected)) {
      throw new Error('val is not same as expected');
    }
  } else if (a !== b) {
    throw new Error('val is not same as expected');
  } else {
    if (Array.isArray(val) && Array.isArray(expected)) {
      if (val.length !== expected.length) {
        throw new Error('val is not same as expected');
      }
      val.every((x, i) => assertEquals(x, expected[i]));
    } else if (typeof val === 'object' && typeof expected === 'object') {
      const obj1 = Object.entries(val as Record<string, unknown>);
      const obj2 = Object.entries(expected as Record<string, unknown>);
      if (obj1.length !== obj2.length) {
        throw new Error('val is not same as expected');
      }
      obj1.every((x, i) => assertEquals(x, obj2[i]));
    }
  }
}

export async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
