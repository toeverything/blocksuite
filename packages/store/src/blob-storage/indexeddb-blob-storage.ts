import type { BlobStorage, BlobInput, BlobRef } from './blob-storage-types';
import * as idbKV from './temp-idb-keyval';

/** Configuration for {@link IndexedDBBlobStorage}. */
export type IndexedDBBlobStorageConfig = {
  /** Must specify either {@link IndexedDBBlobStorageConfig.useStore `useDatabase`} or {@link IndexedDBBlobStorageConfig.databaseName `databaseName`}. */
  databaseName: string;
  objectName: string;
};

export class IndexedDBBlobStorage implements BlobStorage {
  private useStore: idbKV.UseStore;
  constructor(config: IndexedDBBlobStorageConfig) {
    if (config.databaseName != null) {
      this.useStore = idbKV.createStore(config.databaseName, config.objectName);
    } else {
      throw new TypeError(
        `Expected either databaseName or useDatabase to be specified.`
      );
    }
  }
  async upload(blobInput: BlobInput): Promise<BlobRef> {
    if (blobInput instanceof File) {
      const ref =
        'blob-' + Date.now().toString(36) + Math.random().toString(36).slice(2);
      await this.useStore('readwrite', store => {
        store.put(blobInput, ref);
      });
      return { blobId: ref };
    } else {
      return Promise.reject({
        message: 'Uploading this type is not yet implemented',
        blobInput,
      });
    }
  }
  async getDebugInfo(ref: BlobRef): Promise<Record<string, unknown>> {
    return {
      id: ref.blobId,
      storage: 'indexeddb',
    };
  }
  async getWebURL(ref: BlobRef): Promise<URL> {
    const found = await this.useStore('readonly', store =>
      idbKV.promisifyRequest(store.get(ref.blobId))
    );

    console.log('getWebURL', found);
    if (found instanceof File) {
      return new URL(URL.createObjectURL(found));
    } else {
      const error = 'Unexpected non-file to create object URL from';
      console.error(error, { found });
      throw new Error(error);
    }
  }
}
