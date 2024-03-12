import { createMemoryStorage } from '../../persistence/blob/memory-storage.js';
import type { BlobManager, BlobStorage } from '../../persistence/blob/types.js';
import { sha } from '../../persistence/blob/utils.js';
import type { DocCollectionOptions } from '../collection.js';
import { addOnFactory } from './shared.js';

export interface BlobAddon {
  get blob(): BlobManager;
}

export const blob = addOnFactory<keyof BlobAddon>(
  originalClass =>
    class extends originalClass {
      private readonly _storages: BlobStorage[] = [];

      readonly blob: BlobManager;

      constructor(storeOptions: DocCollectionOptions) {
        super(storeOptions);

        this._storages = (
          storeOptions.blobStorages ?? [createMemoryStorage]
        ).map(fn => fn(storeOptions.id || ''));

        this.blob = {
          get: async id => {
            let found = false;
            let count = 0;
            return new Promise(res => {
              void this._storages.map(async storage => {
                try {
                  const blob = await storage.crud.get(id);
                  if (blob && !found) {
                    found = true;
                    res(blob);
                  }
                  if (++count === this._storages.length && !found) {
                    res(null);
                  }
                } catch (e) {
                  console.error(e);
                  if (++count === this._storages.length && !found) {
                    res(null);
                  }
                }
              });
            });
          },
          set: async (value, key) => {
            const _key = key || (await sha(await value.arrayBuffer()));
            await Promise.all(this._storages.map(s => s.crud.set(_key, value)));
            return _key;
          },
          delete: async key => {
            await Promise.all(this._storages.map(s => s.crud.delete(key)));
          },
          list: async () => {
            const keys = new Set<string>();
            await Promise.all(
              this._storages.map(async s => {
                const list = await s.crud.list();
                list.forEach(key => keys.add(key));
              })
            );
            return Array.from(keys);
          },
        };
      }
    }
);
