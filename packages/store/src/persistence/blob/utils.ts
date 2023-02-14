import { clear, createStore, del, get, keys, set, values } from 'idb-keyval';

import type { IDBInstance } from './types.js';

export function getDatabase<T = ArrayBufferLike>(
  type: string,
  database: string
): IDBInstance<T> {
  const db = createStore(`${database}_${type}`, type);
  return {
    get: (key: string) => get<T>(key, db),
    set: (key: string, value: T) => set(key, value, db),
    has: (key: string) => get(key, db).then(value => value !== undefined),
    keys: () => keys(db),
    values: () => values(db),
    delete: (key: string) => del(key, db),
    clear: () => clear(db),
  };
}
