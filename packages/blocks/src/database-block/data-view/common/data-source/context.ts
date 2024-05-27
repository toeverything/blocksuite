// eslint-disable-next-line @typescript-eslint/ban-types
export interface DataViewContextKey<_T> extends Symbol {}

export const createContextKey = <T>(name: string): DataViewContextKey<T> =>
  Symbol(name);
