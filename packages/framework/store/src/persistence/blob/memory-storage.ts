import type { BlobStorage } from './types.js';

export const createMemoryStorage = (): BlobStorage => {
  const memoryStorage = new Map<string, Blob>();
  return {
    crud: {
      get: (key: string) => {
        return memoryStorage.get(key) ?? null;
      },
      set: (key: string, value: Blob) => {
        memoryStorage.set(key, value);
        return key;
      },
      delete: (key: string) => {
        memoryStorage.delete(key);
      },
      list: () => {
        return Array.from(memoryStorage.keys());
      },
    },
  };
};
