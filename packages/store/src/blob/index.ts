import { IndexedDBBlobProvider } from './providers';
import { BlobStorage } from './storage';

const CLOUD_API = '/api/workspace';

export const getBlobStorage = async (
  // Note: In the current backend design, the workspace id is a randomly generated int64 number
  // so if you need to test or enable blob synchronization, the provided workspace needs to be a number
  workspace?: string,
  cloudApi: string = CLOUD_API
) => {
  if (workspace) {
    const storage = new BlobStorage();
    const provider = await IndexedDBBlobProvider.init(workspace, cloudApi);
    storage.addProvider(provider);

    return storage;
  }
  return null;
};

export { BlobStorage } from './storage';
