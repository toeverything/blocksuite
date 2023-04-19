import type { BlobStorage } from './types.js';

export const createMemoryStorage = (): BlobStorage => {
  const memoryStorage = new Map<string, Blob>();
  return {
    crud: {
      get: async (key: string) => {
        return memoryStorage.get(key) ?? null;
      },
      set: async (key: string, value: Blob) => {
        memoryStorage.set(key, value);
        return key;
      },
      delete: async (key: string) => {
        memoryStorage.delete(key);
      },
      list: async () => {
        return [...memoryStorage.keys()];
      },
    },
  };
};
