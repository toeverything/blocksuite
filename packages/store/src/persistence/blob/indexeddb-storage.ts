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
    crud: {
      get: async (key: string) => {
        return (await get<Blob>(key, db)) ?? null;
      },
      set: async (value: Blob) => {
        const key = await hash(value);
        await set(key, value, db);
        return key;
      },
      delete: async (key: string) => {
        await del(key, db);
      },
      list: async function* iter() {
        for (const [key, value] of await entries<string, Blob>(db)) {
          yield [key, value];
        }
      },
    },
  };
};
