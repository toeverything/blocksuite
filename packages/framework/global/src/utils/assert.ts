// https://stackoverflow.com/questions/31538010/test-if-a-variable-is-a-primitive-rather-than-an-object
import { ErrorCode } from '../exceptions/code.js';
import { BlockSuiteError } from '../exceptions/index.js';

export function isPrimitive(
  a: unknown
): a is boolean | null | number | string | undefined {
  return a !== Object(a);
}

export function assertType<T>(_: unknown): asserts _ is T {}

export function assertExists<T>(
  val: T | null | undefined,
  message: Error | string = 'val does not exist'
): asserts val is T {
  if (val === null || val === undefined) {
    if (message instanceof Error) {
      throw message;
    }
    throw new BlockSuiteError(ErrorCode.ValueNotExists, message);
  }
}

export function assertNotExists<T>(
  val: T | null | undefined,
  message = 'val exists'
): asserts val is null | undefined {
  if (val !== null && val !== undefined) {
    throw new BlockSuiteError(ErrorCode.ValueNotExists, message);
  }
}

export type Equals<X, Y> =
  ///
  (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2
    ? true
    : false;

type Allowed =
  | boolean
  | null
  | number
  | object
  | string
  | undefined
  | unknown
  | unknown[]
  | void;
export function isEqual<T extends Allowed, U extends T>(
  val: T,
  expected: U
): Equals<T, U> {
  const a = isPrimitive(val);
  const b = isPrimitive(expected);
  if (a && b) {
    if (!Object.is(val, expected)) {
      return false as Equals<T, U>;
    }
  } else if (a !== b) {
    return false as Equals<T, U>;
  } else {
    if (Array.isArray(val) && Array.isArray(expected)) {
      if (val.length !== expected.length) {
        return false as Equals<T, U>;
      }
      return val.every((x, i) => isEqual(x, expected[i])) as Equals<T, U>;
    } else if (typeof val === 'object' && typeof expected === 'object') {
      const obj1 = Object.entries(val as Record<string, unknown>);
      const obj2 = Object.entries(expected as Record<string, unknown>);
      if (obj1.length !== obj2.length) {
        return false as Equals<T, U>;
      }
      return obj1.every((x, i) => isEqual(x, obj2[i])) as Equals<T, U>;
    }
  }
  return true as Equals<T, U>;
}
export function assertEquals<T extends Allowed, U extends T>(
  val: T,
  expected: U,
  message = 'val is not same as expected'
): asserts val is U {
  if (!isEqual(val, expected)) {
    throw new BlockSuiteError(ErrorCode.ValueNotEqual, message);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Class<T> = new (...args: any[]) => T;

export function assertInstanceOf<T>(
  val: unknown,
  expected: Class<T>,
  message = 'val is not instance of expected'
): asserts val is T {
  if (!(val instanceof expected)) {
    throw new BlockSuiteError(ErrorCode.ValueNotInstanceOf, message);
  }
}
