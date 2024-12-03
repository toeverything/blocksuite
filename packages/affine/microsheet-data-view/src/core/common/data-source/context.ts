export interface DataViewContextKey<T> {
  key: symbol;
  defaultValue: T;
}

export const createContextKey = <T>(
  name: string,
  defaultValue: T
): DataViewContextKey<T> => ({
  key: Symbol(name),
  defaultValue,
});
