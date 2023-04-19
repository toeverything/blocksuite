import type { BlobStorage } from './types.js';
import { sha } from './utils.js';

export const createMemoryStorage = (id: string): BlobStorage => {
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
        memoryStorage.set(await hash(value), value);
      },
      delete: async (key: string) => {
        memoryStorage.delete(key);
      },
      list: async function* iter() {
        for (const [key, value] of memoryStorage) {
          yield [key, value];
        }
      },
    },
    hash,
  };
};
