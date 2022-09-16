// https://stackoverflow.com/questions/31538010/test-if-a-variable-is-a-primitive-rather-than-an-object
export function isPrimitive(
  a: unknown
): a is null | undefined | boolean | number | string {
  return a !== Object(a);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function noop(_: unknown) {
  // do nothing
}
