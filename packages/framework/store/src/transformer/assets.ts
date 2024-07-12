import { assertExists } from '@blocksuite/global/utils';

interface BlobCRUD {
  get: (key: string) => Promise<Blob | null> | Blob | null;
  set: (key: string, value: Blob) => Promise<string> | string;
  delete: (key: string) => Promise<void> | void;
  list: () => Promise<string[]> | string[];
}

type AssetsManagerConfig = {
  blob: BlobCRUD;
};

export class AssetsManager {
  private readonly _assetsMap = new Map<string, Blob>();

  private readonly _blob: BlobCRUD;

  constructor(options: AssetsManagerConfig) {
    this._blob = options.blob;
  }

  cleanup() {
    this._assetsMap.clear();
  }

  getAssets() {
    return this._assetsMap;
  }

  isEmpty() {
    return this._assetsMap.size === 0;
  }

  async readFromBlob(blobId: string) {
    const blob = await this._blob.get(blobId);
    assertExists(blob, `Blob ${blobId} not found in blob manager`);

    this._assetsMap.set(blobId, blob);
  }

  async writeToBlob(blobId: string) {
    const blob = this._assetsMap.get(blobId);
    assertExists(blob);

    const exists = (await this._blob.get(blobId)) !== null;
    if (exists) {
      return;
    }

    await this._blob.set(blobId, blob);
  }
}
