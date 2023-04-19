import { createStore, del, entries, get, set } from 'idb-keyval';

import type { BlobStorage } from './types.js';
import { sha } from './utils.js';

export const createIndexeddbStorage = (database: string): BlobStorage => {
  // don't change the db name, it's for backward compatibility
  const db = createStore(`${database}_blob`, 'blob');
  const hash = async (value: Blob) => {
    return sha(await value.arrayBuffer());
  };
  return {
    hash,
    crud: {
      get: async (key: string) => {
        return (await get<Blob>(key, db)) ?? null;
      },
      set: async (value: Blob) => {
        await set(await hash(value), value, db);
      },
      delete: async (key: string) => {
        await del(key, db);
      },
      list: async function* iter() {
        for await (const [key, value] of await entries<string, Blob>(db)) {
          yield [key, value];
        }
      },
    },
  };
};
