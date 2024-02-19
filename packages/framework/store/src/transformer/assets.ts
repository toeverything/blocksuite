import { assertExists } from '@blocksuite/global/utils';

import type { BlobManager } from '../persistence/blob/types.js';

type AssetsManagerConfig = {
  blob: BlobManager;
};

export class AssetsManager {
  private readonly _assetsMap = new Map<string, Blob>();
  private readonly _blob: BlobManager;

  constructor(options: AssetsManagerConfig) {
    this._blob = options.blob;
  }

  getAssets() {
    return this._assetsMap;
  }

  isEmpty() {
    return this._assetsMap.size === 0;
  }

  cleanup() {
    this._assetsMap.clear();
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

    await this._blob.set(blob, blobId);
  }
}
