import { sha } from '../persistence/blob/utils.js';
import { AssetsManager } from '../transformer/assets.js';

class MemoryBlobManager {
  private readonly _map = new Map<string, Blob>();

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
}

export class AdapterAssetsManager extends AssetsManager {
  constructor() {
    super({ blobs: new MemoryBlobManager() });
  }
}
