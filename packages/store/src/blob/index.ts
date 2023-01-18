import { IndexedDBBlobProvider } from './providers.js';
import type { GetBlobOptions, BlobOptions } from './providers.js';
import { BlobStorage } from './storage.js';

const CLOUD_API = (k: string) => ({ api: '/api/workspace' }[k]);

export const getBlobStorage = async (
  // Note: In the current backend design, the workspace id is a randomly generated int64 number
  // so if you need to test or enable blob synchronization, the provided workspace needs to be a number
  workspace?: string,
  cloudApi: GetBlobOptions = CLOUD_API
) => {
  if (workspace) {
    const storage = new BlobStorage();
    const provider = await IndexedDBBlobProvider.init(workspace, cloudApi);
    storage.addProvider(provider);

    return storage;
  }
  return null;
};

export { BlobStorage } from './storage.js';
export type { GetBlobOptions, BlobOptions };
