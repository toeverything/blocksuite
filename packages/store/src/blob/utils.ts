import { createStore, del, get, keys, set, clear } from 'idb-keyval';
import type { IDBInstance } from './types.js';
import { Buffer } from 'buffer';

export async function sha(input: ArrayBuffer): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', input);
  const buffer = Buffer.from(hash);

  return buffer.toString('base64url');
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
    delete: (key: string) => del(key, db),
    clear: () => clear(db),
  };
}

export async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
