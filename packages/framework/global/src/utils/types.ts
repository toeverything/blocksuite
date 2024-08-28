// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Constructor<T = object, Arguments extends any[] = any[]> = new (
  ...args: Arguments
) => T;

// Recursive type to make all properties optional
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object
    ? T[P] extends Array<infer U>
      ? Array<DeepPartial<U>>
      : DeepPartial<T[P]>
    : T[P];
};
