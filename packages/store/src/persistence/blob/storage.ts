import { Slot } from '@blocksuite/global/utils';

import type {
  BlobId,
  BlobProvider,
  BlobSyncStateChangeEvent,
  BlobURL,
} from './types.js';

function assertProviderExist(
  provider: BlobProvider | null | undefined
): asserts provider is BlobProvider {
  if (!provider) {
    throw new Error('No provider found for blob storage');
  }
}

export class BlobStorage {
  private _provider: BlobProvider | null = null;

  slots = {
    onBlobSyncStateChange: new Slot<BlobSyncStateChangeEvent>(),
  };

  get uploading(): boolean {
    return this._provider?.uploading ?? true;
  }

  get blobs() {
    return this._provider?.blobs ?? Promise.resolve([]);
  }

  setProvider(provider: BlobProvider | null) {
    if (!provider) {
      this._provider = null;
      return;
    }
    this._provider = provider;
    this._provider.slots.onBlobSyncStateChange.on(state => {
      this.slots.onBlobSyncStateChange.emit(state);
    });
  }

  async get(id: BlobId): Promise<BlobURL | null> {
    assertProviderExist(this._provider);

    return await this._provider.get(id);
  }

  async set(blob: Blob): Promise<BlobId> {
    assertProviderExist(this._provider);

    return await this._provider.set(blob);
  }

  async delete(id: BlobId): Promise<void> {
    assertProviderExist(this._provider);

    await this._provider.delete(id);
  }

  async clear(): Promise<void> {
    assertProviderExist(this._provider);

    await this._provider.clear();
  }
}
