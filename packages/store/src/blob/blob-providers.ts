import { uuidv4 } from 'lib0/random';
import * as IKV from 'idb-keyval';

type BlobId = string;
type BlobURL = string;

export interface BlobProvider {
  readonly config: unknown;
  get(id: BlobId): Promise<BlobURL>;
  set(blob: Blob): Promise<BlobId>;
  delete(id: BlobId): Promise<void>;
  clear(): Promise<void>;
}

export class IndexedDBBlobProvider implements BlobProvider {
  readonly config: unknown;

  async get(id: string): Promise<string> {
    const blob = (await IKV.get(id)) as Blob;
    const result = URL.createObjectURL(blob);
    return result;
  }

  async set(blob: Blob): Promise<string> {
    const uuid = uuidv4();
    await IKV.set(uuid, blob);
    return uuid;
  }

  async delete(id: string): Promise<void> {
    await IKV.del(id);
  }

  async clear(): Promise<void> {
    await IKV.clear();
  }
}
