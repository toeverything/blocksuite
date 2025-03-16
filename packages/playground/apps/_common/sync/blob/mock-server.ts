import type { BlobSource } from '@blocksuite/sync';

/**
 * @internal just for test
 *
 * API: /api/collection/:id/blob/:key
 * GET: get blob
 * PUT: set blob
 * DELETE: delete blob
 */
export class MockServerBlobSource implements BlobSource {
  private readonly _cache = new Map<string, Blob>();

  readonly = false;

  constructor(readonly name: string) {}

  async delete(key: string) {
    this._cache.delete(key);
    await fetch(`/api/collection/${this.name}/blob/${key}`, {
      method: 'DELETE',
    });
  }

  async get(key: string) {
    if (this._cache.has(key)) {
      return this._cache.get(key) as Blob;
    } else {
      const blob = await fetch(`/api/collection/${this.name}/blob/${key}`, {
        method: 'GET',
      }).then(response => {
        if (!response.ok) {
          throw new Error(`Failed to fetch blob ${key}`);
        }
        return response.blob();
      });
      this._cache.set(key, blob);
      return blob;
    }
  }

  async list() {
    return Array.from(this._cache.keys());
  }

  async set(key: string, value: Blob) {
    this._cache.set(key, value);
    await fetch(`/api/collection/${this.name}/blob/${key}`, {
      method: 'PUT',
      body: await value.arrayBuffer(),
    });
    return key;
  }
}
