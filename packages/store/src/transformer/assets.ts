import { assertExists } from '@blocksuite/global/utils';

import type { BlobManager } from '../persistence/blob/types.js';

type AssetsManagerConfig = {
  blobs: BlobManager;
};

export class AssetsManager {
  private readonly _assetsMap = new Map<string, Blob>();
  private readonly _blobs: BlobManager;

  constructor(options: AssetsManagerConfig) {
    this._blobs = options.blobs;
  }

  getAssets() {
    return this._assetsMap;
  }

  cleanup() {
    this._assetsMap.clear();
  }

  async readFromBlob(blobId: string) {
    const blob = await this._blobs.get(blobId);
    assertExists(blob, `Blob ${blobId} not found in blob manager`);

    this._assetsMap.set(blobId, blob);
  }

  async writeToBlob(blobId: string) {
    const blob = this._assetsMap.get(blobId);
    assertExists(blob);

    const exists = (await this._blobs.get(blobId)) !== null;
    if (exists) {
      return;
    }

    await this._blobs.set(blob, blobId);
  }
}
