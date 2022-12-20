import type { Buffer } from 'buffer';
import { createStore, del, get, keys, set, clear } from 'idb-keyval';
import { SHA3 } from 'sha3';
import type { IDBInstance } from './types.js';

const hash = new SHA3(256);

export function sha3(buffer: Buffer): string {
  hash.reset();
  hash.update(buffer);
  return hash
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
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
