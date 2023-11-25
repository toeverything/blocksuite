import { assertExists } from '@blocksuite/global/utils';

import { sha } from '../persistence/blob/utils.js';

export class MemoryBlobManager {
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

  increaseRef(blobId: string) {
    const ref = this._blobsRef.get(blobId) ?? 0;
    this._blobsRef.set(blobId, ref + 1);
  }

  decreaseRef(blobId: string) {
    const ref = this._blobsRef.get(blobId) ?? 0;
    this._blobsRef.set(blobId, Math.max(ref - 1, 0));
  }
}

export function getAssetName(assets: Map<string, Blob>, blobId: string) {
  const blob = assets.get(blobId);
  assertExists(blob);
  const name = (blob as File).name ?? undefined;
  const ext =
    name !== undefined && name.includes('.')
      ? name.split('.').at(-1)
      : blob.type !== ''
        ? blob.type.split('/').at(-1)
        : 'blob';
  return `${name?.split('.').at(0) ?? blobId}.${ext}`;
}
