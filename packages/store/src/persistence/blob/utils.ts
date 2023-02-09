import { Buffer } from 'buffer';
import { clear, createStore, del, get, keys, set, values } from 'idb-keyval';

import type { IDBInstance } from './types.js';

export async function sha(input: ArrayBuffer): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', input);
  const buffer = Buffer.from(hash);

  return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_');
}

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
