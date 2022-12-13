import { IndexedDBBlobProvider } from './providers';
import { BlobStorage } from './storage';

const CLOUD_API = '/api/blobs';

export const getBlobStorage = async (
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
export { IndexedDBBlobProvider } from './providers';
