// https://stackoverflow.com/questions/31538010/test-if-a-variable-is-a-primitive-rather-than-an-object
import { ErrorCode } from '../exceptions/code.js';
import { BlockSuiteError } from '../exceptions/index.js';

export function isPrimitive(
  a: unknown
): a is null | undefined | boolean | number | string {
  return a !== Object(a);
}

export function assertType<T>(_: unknown): asserts _ is T {}

/**
 * @deprecated Avoid using this util as escape hatch of error handling.
 * For non-framework code, please handle error in application level instead.
 */
export function assertExists<T>(
  val: T | null | undefined,
  message: string | Error = 'val does not exist',
  errorCode = ErrorCode.ValueNotExists
): asserts val is T {
  if (val === null || val === undefined) {
    if (message instanceof Error) {
      throw message;
    }
    throw new BlockSuiteError(errorCode, message);
  }
}

export function assertNotExists<T>(
  val: T | null | undefined,
  message = 'val exists',
  errorCode = ErrorCode.ValueNotExists
): asserts val is null | undefined {
  if (val !== null && val !== undefined) {
    throw new BlockSuiteError(errorCode, message);
  }
}

export type Equals<X, Y> =
  ///
  (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2
    ? true
    : false;

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
  message = 'val is not same as expected',
  errorCode = ErrorCode.ValueNotEqual
): asserts val is U {
  if (!isEqual(val, expected)) {
    throw new BlockSuiteError(errorCode, message);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Class<T> = new (...args: any[]) => T;

export function assertInstanceOf<T>(
  val: unknown,
  expected: Class<T>,
  message = 'val is not instance of expected',
  errorCode = ErrorCode.ValueNotInstanceOf
): asserts val is T {
  if (!(val instanceof expected)) {
    throw new BlockSuiteError(errorCode, message);
  }
}
