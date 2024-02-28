/**
 * YDict is just a Y.Map with a more accurate type
 */
export type YDict<T> = {
  get<K extends keyof T>(key: K): T[K];
  set<K extends keyof T>(key: K, value: T[K]): void;
};

export type UnwrapYDict<T> = T extends YDict<infer U> ? U : T;
