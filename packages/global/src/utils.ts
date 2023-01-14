import '../env.d.ts';

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
