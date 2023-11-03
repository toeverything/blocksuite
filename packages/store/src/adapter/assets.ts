import { sha } from '../persistence/blob/utils.js';
import { AssetsManager } from '../transformer/assets.js';

class MemoryBlobManager {
  private readonly _map = new Map<string, Blob>();
  private readonly _blobsRef = new Map<string, number>();

  async get(key: string) {
    return this._map.get(key) ?? null;
  }

  async set(value: Blob, key?: string) {
    const _key = key || (await sha(await value.arrayBuffer()));
    this._map.set(_key, value);
    return _key;
  }

  async delete(key: string) {
    this._map.delete(key);
  }

  async list() {
    return Array.from(this._map.keys());
  }

  async gc() {
    const blobs = await this.list();
    blobs.forEach(blobId => {
      const ref = this._blobsRef.get(blobId);
      if (!ref || ref <= 0) {
        this.delete(blobId);
        this._blobsRef.delete(blobId);
      }
    });
  }

  async increaseRef(blobId: string) {
    const ref = this._blobsRef.get(blobId) ?? 0;
    this._blobsRef.set(blobId, ref + 1);
  }

  async decreaseRef(blobId: string) {
    const ref = this._blobsRef.get(blobId) ?? 0;
    this._blobsRef.set(blobId, ref - 1 < 0 ? 0 : ref - 1);

    this.gc();
  }
}

export class AdapterAssetsManager extends AssetsManager {
  constructor() {
    super({ blob: new MemoryBlobManager() });
  }
}
