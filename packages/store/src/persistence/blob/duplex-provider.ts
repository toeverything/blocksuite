import { assertExists, Signal } from '@blocksuite/global/utils';
import { CloudSyncManager } from './cloud-sync-manager.js';

import type { BlobId, BlobProvider, BlobURL, IDBInstance } from './types.js';
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
  private _uploadingIds: BlobId[] = [];

  readonly blobs: Set<string> = new Set();
  readonly signals = {
    blobAdded: new Signal<BlobId>(),
    blobDeleted: new Signal<BlobId>(),
    uploadStateChanged: new Signal<BlobId[]>(),
    uploadFinished: new Signal<BlobId>(),
  };

  static async init(
    workspace: string,
    optionsGetter?: BlobOptionsGetter
  ): Promise<DuplexBlobProvider> {
    const provider = new DuplexBlobProvider(workspace, optionsGetter);
    await provider._initBlobs();
    return provider;
  }

  private async _initBlobs() {
    const entries = await this._localDB.keys();
    for (const key of entries) {
      const blobId = key as BlobId;
      this.signals.blobAdded.emit(blobId);
      this.blobs.add(blobId);
    }
  }

  private constructor(workspace: string, optionsGetter?: BlobOptionsGetter) {
    this._localDB = getDatabase('blob', workspace);

    const endpoint = optionsGetter?.('api');
    if (endpoint) {
      assertExists(optionsGetter);
      this.signals.uploadStateChanged.on(uploadingIds => {
        this._uploadingIds = uploadingIds;
      });
      this._cloudManager = new CloudSyncManager(
        workspace,
        optionsGetter,
        this._localDB,
        this.signals.uploadStateChanged,
        this.signals.uploadFinished
      );
    }
  }

  get uploading() {
    return Boolean(this._uploadingIds.length);
  }

  get uploadingIds() {
    return [...this._uploadingIds];
  }

  async get(id: BlobId): Promise<BlobURL | null> {
    const blob = await this._localDB.get(id);
    if (!blob) {
      const blob = this._cloudManager?.get(id);
      if (blob) {
        this.signals.blobAdded.emit(id);
        this.blobs.add(id);

        return blob;
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

      this.signals.blobAdded.emit(hash);
      this.blobs.add(hash);
    }

    this._cloudManager?.addTask(hash, 'add');

    return hash;
  }

  async delete(id: BlobId): Promise<void> {
    await this._localDB.delete(id);

    this.signals.blobDeleted.emit(id);
    this.blobs.delete(id);
    this._cloudManager?.addTask(id, 'delete');
  }

  async clear(): Promise<void> {
    await this._localDB.clear();
    this.blobs.clear();
  }
}
