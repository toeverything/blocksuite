import type { UseStore } from 'idb-keyval';

import type { BlobStorage } from './types.js';

export const createIndexeddbStorage = (database: string): BlobStorage => {
  let db: UseStore;
  let mimeTypeDb: UseStore;
  // async import `idb-keyval` to avoid side effect
  const idbPromise = import('idb-keyval').then(({ createStore, ...idb }) => {
    // don't change the db name, it's for backward compatibility
    db = createStore(`${database}_blob`, 'blob');
    mimeTypeDb = createStore(`${database}_blob_mime`, 'blob_mime');
    return idb;
  });
  return {
    crud: {
      get: async (key: string) => {
        const get = (await idbPromise).get;
        const res = await get<ArrayBuffer>(key, db);
        if (res) {
          return new Blob([res], { type: await get(key, mimeTypeDb) });
        }
        return null;
      },
      set: async (key: string, value: Blob) => {
        const set = (await idbPromise).set;
        await set(key, await value.arrayBuffer(), db);
        await set(key, value.type, mimeTypeDb);
        return key;
      },
      delete: async (key: string) => {
        const del = (await idbPromise).del;
        await del(key, db);
        await del(key, mimeTypeDb);
      },
      list: async () => {
        const keys = (await idbPromise).keys;
        return keys<string>(db);
      },
    },
  };
};
