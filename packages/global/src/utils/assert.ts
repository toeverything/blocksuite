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
export function assertEquals<T extends Allowed, U extends T>(
  val: T,
  expected: U,
  message = 'val is not same as expected'
): asserts val is U {
  if (!isEqual(val, expected)) {
    throw new Error(message);
  }
}
