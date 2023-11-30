import { sleep } from '@blocksuite/global/utils';
import type { BlobStorage, PassiveDocProvider, Y } from '@blocksuite/store';
import type { IndexedDBProvider } from '@toeverything/y-indexeddb';
import { createIndexedDBProvider } from '@toeverything/y-indexeddb';

export class IndexedDBProviderWrapper implements PassiveDocProvider {
  public readonly flavour = 'blocksuite-indexeddb';
  public readonly passive = true as const;
  private _connected = false;
  private _provider: IndexedDBProvider;
  constructor(doc: Y.Doc) {
    this._provider = createIndexedDBProvider(doc);
  }
  connect() {
    this._provider.connect();
    this._connected = true;
  }
  disconnect() {
    this._provider.disconnect();
    this._connected = false;
  }
  get connected() {
    return this._connected;
  }
}

const simulateDelay = async (blob?: Blob | null) => {
  const bandwidth = 1024 * 1024;
  const minimal = 500;
  const maximum = 2500;
  const size = blob?.size ?? 0;
  const time = size / bandwidth;
  // clamp(time, minium, maximum)
  await sleep(Math.min(maximum, Math.max(minimal, time)));
};

/**
 * Wrap the storage with a delay in order to simulate the actual network environment.
 */
export const withDebugDelayStorage =
  (blobStorageCreator: (id: string) => BlobStorage) =>
  (id: string): BlobStorage => {
    const storage = blobStorageCreator(id);

    return {
      crud: {
        get: async key => {
          const data = await storage.crud.get(key);
          await simulateDelay(data);
          return data;
        },
        set: async (key, value) => {
          await simulateDelay(value);
          return storage.crud.set(key, value);
        },
        delete: async key => {
          await simulateDelay();
          return storage.crud.delete(key);
        },
        list: async () => {
          await simulateDelay();
          return storage.crud.list();
        },
      },
    };
  };
