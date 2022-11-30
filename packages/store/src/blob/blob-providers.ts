import { uuidv4 } from 'lib0/random';
import * as IKV from 'idb-keyval';

type BlobId = string;
type BlobURL = string;

export interface BlobProvider {
  readonly config: unknown;
  readonly blobs: Set<BlobId>;
  get(id: BlobId): Promise<BlobURL | null>;
  set(blob: Blob): Promise<BlobId>;
  delete(id: BlobId): Promise<void>;
  clear(): Promise<void>;
}

export class IndexedDBBlobProvider implements BlobProvider {
  readonly config: unknown;
  readonly blobs = new Set<BlobId>();

  constructor() {
    this._initBlobs();
  }

  async _initBlobs() {
    const entries = await IKV.entries();
    console.log('entries', entries);
    for (const [key] of entries) {
      this.blobs.add(key as string);
    }
  }

  async get(id: BlobId): Promise<BlobURL | null> {
    const blob = (await IKV.get(id)) as Blob | null;
    if (!blob) return null;

    const result = URL.createObjectURL(blob);
    return result;
  }

  async set(blob: Blob): Promise<BlobId> {
    const uuid = uuidv4();
    await IKV.set(uuid, blob);
    this.blobs.add(uuid);
    return uuid;
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
