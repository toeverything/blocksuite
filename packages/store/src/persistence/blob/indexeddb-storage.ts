import { createStore, del, get, keys, set } from 'idb-keyval';

import type { BlobStorage } from './types.js';

export const createIndexeddbStorage = (database: string): BlobStorage => {
  // don't change the db name, it's for backward compatibility
  const db = createStore(`${database}_blob`, 'blob');
  return {
    crud: {
      get: async (key: string) => {
        return (await get<Blob>(key, db)) ?? null;
      },
      set: async (key: string, value: Blob) => {
        await set(key, value, db);
        return key;
      },
      delete: async (key: string) => {
        await del(key, db);
      },
      list: async () => {
        return keys<string>(db);
      },
    },
  };
};
