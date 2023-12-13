import { createMemoryStorage } from '../../persistence/blob/memory-storage.js';
import type { BlobManager, BlobStorage } from '../../persistence/blob/types.js';
import { sha } from '../../persistence/blob/utils.js';
import type { WorkspaceOptions } from '../workspace.js';
import { addOnFactory } from './shared.js';

export interface BlobAddon {
  get blob(): BlobManager;
}

export const blob = addOnFactory<keyof BlobAddon>(
  originalClass =>
    class extends originalClass {
      private readonly _storages: BlobStorage[] = [];
      private readonly _blobsRef = new Map<string, number>();

      readonly blob: BlobManager;

      constructor(storeOptions: WorkspaceOptions) {
        super(storeOptions);

        this._storages = (
          storeOptions.blobStorages ?? [createMemoryStorage]
        ).map(fn => fn(storeOptions.id || ''));

        this.blob = {
          get: async id => {
            let found = false;
            let count = 0;
            return new Promise(res => {
              this._storages.forEach(storage =>
                storage.crud
                  .get(id)
                  .then(result => {
                    if (result && !found) {
                      found = true;
                      res(result);
                    }
                    if (++count === this._storages.length && !found) {
                      res(null);
                    }
                  })
                  .catch(e => {
                    console.error(e);
                    if (++count === this._storages.length && !found) {
                      res(null);
                    }
                  })
              );
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
          gc: async () => {
            const blobs = await this.blob.list();
            blobs.forEach(blobId => {
              const ref = this._blobsRef.get(blobId);
              if (!ref || ref <= 0) {
                this.blob.delete(blobId);
                this._blobsRef.delete(blobId);
              }
            });
          },
          increaseRef: blobId => {
            const ref = this._blobsRef.get(blobId) ?? 0;
            this._blobsRef.set(blobId, ref + 1);
          },
          decreaseRef: blobId => {
            const ref = this._blobsRef.get(blobId) ?? 0;
            this._blobsRef.set(blobId, Math.max(ref - 1, 0));
          },
        };

        //FIXME: Each page might be lazy-loaded and could clear away blobs used by other pages.
        // if (
        //   typeof window !== 'undefined' &&
        //   typeof window.addEventListener === 'function'
        // ) {
        //   window.addEventListener('beforeunload', () => {
        //     this.blob.gc();
        //   });
        // }
        // if (typeof process !== 'undefined') {
        //   process.on('exit', () => {
        //     this.blob.gc();
        //   });
        // }
      }
    }
);
