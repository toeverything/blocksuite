import type { BlobStorage } from './types.js';
import { sha } from './utils.js';

export const createMemoryStorage = (): BlobStorage => {
  const memoryStorage = new Map<string, Blob>();
  const hash = async (value: Blob) => {
    return sha(await value.arrayBuffer());
  };
  return {
    crud: {
      get: async (key: string) => {
        return memoryStorage.get(key) ?? null;
      },
      set: async (value: Blob) => {
        const key = await hash(value);
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
