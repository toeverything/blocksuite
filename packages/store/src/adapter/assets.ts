import { assertExists } from '@blocksuite/global/utils';

import { sha } from '../persistence/blob/utils.js';
import { AssetsManager } from '../transformer/assets.js';

export class MemoryBlobManager {
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

export function getAssetName(assets: Map<string, Blob>, blobId: string) {
  const blob = assets.get(blobId);
  assertExists(blob);
  const name = 'name' in blob ? (blob as File).name : undefined;
  const ext =
    name !== undefined && name.includes('.')
      ? name.split('.').at(-1)
      : blob.type !== ''
      ? blob.type.split('/').at(-1)
      : 'blob';
  return `${blobId}.${ext}`;
}

export class AdapterAssetsManager extends AssetsManager {
  constructor() {
    super({ blobs: new MemoryBlobManager() });
  }
}
