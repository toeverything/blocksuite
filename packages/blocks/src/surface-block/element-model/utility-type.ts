// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type OmitFunctionsAndKeysAndReadOnly<T, K extends keyof any> = {
  [P in Exclude<
    keyof T,
    K | FunctionPropertyNames<T> | ReadOnlyPropertyNames<T>
  >]: T[P];
};

type FunctionPropertyNames<T> = {
  // eslint-disable-next-line @typescript-eslint/ban-types
  [K in keyof T]: T[K] extends Function ? K : never;
}[keyof T];

type ReadOnlyPropertyNames<T> = {
  [K in keyof T]: IfEquals<
    { [P in K]: T[K] },
    { -readonly [P in K]: T[K] },
    never,
    K
  >;
}[keyof T];

type IfEquals<X, Y, A = X, B = never> =
  (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2 ? A : B;
