import { assertExists, Slot } from '@blocksuite/global/utils';

import { CloudSyncManager } from './cloud-sync-manager.js';
import type {
  BlobId,
  BlobProvider,
  BlobSyncStateChangeEvent,
  BlobURL,
  IDBInstance,
} from './types.js';
import { getDatabase, sha } from './utils.js';

export type BlobOptions = Record<'api' | 'token', string>;

export type BlobOptionsGetter = (key: keyof BlobOptions) => string | undefined;

interface StaticBlobProvider {
  init(
    workspace: string,
    optionsGetter?: BlobOptionsGetter
  ): Promise<BlobProvider>;
}

function staticImplements<T>() {
  return <U extends T>(constructor: U) => constructor;
}

/**
 * A BlobProvider that stores blobs in IndexedDB and optionally syncs them to a
 * remote server.
 */
@staticImplements<StaticBlobProvider>()
export class DuplexBlobProvider implements BlobProvider {
  private readonly _localDB: IDBInstance;
  private readonly _cloudManager?: CloudSyncManager;

  readonly slots = {
    onBlobSyncStateChange: new Slot<BlobSyncStateChangeEvent>(),
  };

  static async init(
    workspace: string,
    optionsGetter?: BlobOptionsGetter
  ): Promise<DuplexBlobProvider> {
    const provider = new DuplexBlobProvider(workspace, optionsGetter);
    return provider;
  }

  private constructor(workspace: string, optionsGetter?: BlobOptionsGetter) {
    this._localDB = getDatabase('blob', workspace);

    const endpoint = optionsGetter?.('api');
    if (endpoint) {
      assertExists(optionsGetter);
      this._cloudManager = new CloudSyncManager(workspace, optionsGetter);

      this._cloudManager.slotss.onBlobSyncStateChange.on(blobState => {
        this.slots.onBlobSyncStateChange.emit(blobState);
      });
    }
  }

  get uploading() {
    return Boolean(this._cloudManager?.running);
  }

  get blobs() {
    return this._localDB.keys();
  }

  async get(id: BlobId): Promise<BlobURL | null> {
    const blob = await this._localDB.get(id);
    if (!blob) {
      const blob = await this._cloudManager?.get(id);
      if (blob) {
        const buffer = await blob.arrayBuffer();
        await this._localDB.set(id, buffer);

        return URL.createObjectURL(blob);
      }
      return null;
    }

    const result = URL.createObjectURL(new Blob([blob]));
    return result;
  }

  async set(blob: Blob): Promise<BlobId> {
    const buffer = await blob.arrayBuffer();
    const hash = await sha(buffer);
    if (!(await this._localDB.has(hash))) {
      await this._localDB.set(hash, buffer);
    }

    this._cloudManager?.addTask(hash, blob);

    return hash;
  }

  async delete(id: BlobId): Promise<void> {
    await this._localDB.delete(id);

    // NOTE: should we delete blob in cloud? When?
    // this._cloudManager?.addTask(id, 'delete');
  }

  async clear(): Promise<void> {
    await this._localDB.clear();
  }
}
