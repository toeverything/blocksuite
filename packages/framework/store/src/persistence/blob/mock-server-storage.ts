import type { BlobStorage } from './types.js';

/**
 * API: /api/collection/:id/blob/:key
 * GET: get blob
 * PUT: set blob
 * DELETE: delete blob
 */
export function createSimpleServerStorage(id: string): BlobStorage {
  const localCache = new Map<string, Blob>();
  return {
    crud: {
      get: async (key: string) => {
        if (localCache.has(key)) {
          return localCache.get(key) as Blob;
        } else {
          const blob = await fetch(`/api/collection/${id}/blob/${key}`, {
            method: 'GET',
          }).then(response => {
            if (!response.ok) {
              throw new Error(`Failed to fetch blob ${key}`);
            }
            return response.blob();
          });
          localCache.set(key, blob);
          return blob;
        }
      },
      set: async (key: string, value: Blob) => {
        localCache.set(key, value);
        await fetch(`/api/collection/${id}/blob/${key}`, {
          method: 'PUT',
          body: await value.arrayBuffer(),
        });
        return key;
      },
      delete: async (key: string) => {
        localCache.delete(key);
        await fetch(`/api/collection/${id}/blob/${key}`, {
          method: 'DELETE',
        });
      },
      list: () => {
        return Array.from(localCache.keys());
      },
    },
  };
}
