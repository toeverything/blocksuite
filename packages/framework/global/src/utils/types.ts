// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Constructor<T = object, Arguments extends any[] = any[]> = new (
  ...args: Arguments
) => T;
