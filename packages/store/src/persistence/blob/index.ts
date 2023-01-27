import { IndexedDBBlobProvider } from './providers.js';
import type { BlobOptionsGetter, BlobOptions } from './providers.js';
import { BlobStorage } from './storage.js';

const CLOUD_ENDPOINT_GETTER = (k: string) => ({ api: '/api/workspace' }[k]);

export async function getBlobStorage(
  // Note: In the current backend design, the workspace id is a randomly generated int64 number
  // so if you need to test or enable blob synchronization, the provided workspace needs to be a number
  workspace?: string,
  optionsGetter: BlobOptionsGetter = CLOUD_ENDPOINT_GETTER
) {
  if (workspace) {
    const storage = new BlobStorage();
    const provider = await IndexedDBBlobProvider.init(workspace, optionsGetter);
    storage.addProvider(provider);

    return storage;
  }
  return null;
}

export { BlobStorage } from './storage.js';
export type { BlobOptionsGetter, BlobOptions };
