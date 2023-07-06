import type { createStore } from 'idb-keyval';

import type { BlobStorage } from './types.js';

export const createIndexeddbStorage = (database: string): BlobStorage => {
  let dbPromise: ReturnType<typeof createStore>;
  let mimeTypeDbPromise: ReturnType<typeof createStore>;
  // async import `idb-keyval` to avoid side effect
  const idbPromise = import('idb-keyval').then(({ createStore, ...idb }) => {
    // don't change the db name, it's for backward compatibility
    dbPromise = createStore(`${database}_blob`, 'blob');
    mimeTypeDbPromise = createStore(`${database}_blob_mime`, 'blob_mime');
    return idb;
  });
  return {
    crud: {
      get: async (key: string) => {
        const get = (await idbPromise).get;
        const db = await dbPromise;
        const mimeTypeDb = await mimeTypeDbPromise;
        const res = await get<ArrayBuffer>(key, db);
        if (res) {
          return new Blob([res], { type: await get(key, mimeTypeDb) });
        }
        return null;
      },
      set: async (key: string, value: Blob) => {
        const set = (await idbPromise).set;
        const db = await dbPromise;
        const mimeTypeDb = await mimeTypeDbPromise;
        await set(key, await value.arrayBuffer(), db);
        await set(key, value.type, mimeTypeDb);
        return key;
      },
      delete: async (key: string) => {
        const del = (await idbPromise).del;
        const db = await dbPromise;
        const mimeTypeDb = await mimeTypeDbPromise;
        await del(key, db);
        await del(key, mimeTypeDb);
      },
      list: async () => {
        const keys = (await idbPromise).keys;
        const db = await dbPromise;
        return keys<string>(db);
      },
    },
  };
};
