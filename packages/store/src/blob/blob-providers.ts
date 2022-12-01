import { uuidv4 } from 'lib0/random';
import * as IKV from 'idb-keyval';
import { Signal } from '../utils/signal';

export type BlobId = string;
export type BlobURL = string;

export interface BlobProvider {
  readonly config: unknown;
  readonly blobs: Set<BlobId>;
  get(id: BlobId): Promise<BlobURL | null>;
  set(blob: Blob): Promise<BlobId>;
  delete(id: BlobId): Promise<void>;
  clear(): Promise<void>;
  signals: {
    blobAdded: Signal<BlobId>;
  };
}

interface BlobProviderStatic {
  init(): Promise<BlobProvider>;
}

function staticImplements<T>() {
  return <U extends T>(constructor: U) => constructor;
}

@staticImplements<BlobProviderStatic>()
export class IndexedDBBlobProvider implements BlobProvider {
  readonly config: unknown;
  readonly blobs = new Set<BlobId>();

  signals = {
    blobAdded: new Signal<BlobId>(),
  };

  static async init(): Promise<IndexedDBBlobProvider> {
    const provider = new IndexedDBBlobProvider();
    await provider._initBlobs();
    return provider;
  }

  private async _initBlobs() {
    const entries = await IKV.entries();
    for (const [key] of entries) {
      const blobId = key as BlobId;
      this.signals.blobAdded.emit(blobId);
      this.blobs.add(blobId);
    }
  }

  async get(id: BlobId): Promise<BlobURL | null> {
    const blob = (await IKV.get(id)) as Blob | null;
    if (!blob) return null;

    const result = URL.createObjectURL(blob);
    return result;
  }

  async set(blob: Blob): Promise<BlobId> {
    const blobId = uuidv4();
    await IKV.set(blobId, blob);
    this.blobs.add(blobId);
    this.signals.blobAdded.emit(blobId);
    return blobId;
  }

  async delete(id: BlobId): Promise<void> {
    this.blobs.delete(id);
    await IKV.del(id);
  }

  async clear(): Promise<void> {
    this.blobs.clear();
    await IKV.clear();
  }
}
