import { Signal } from '@blocksuite/global/utils';
import type { BlobId, BlobProvider, BlobURL } from './types.js';

export class BlobStorage {
  private _providers: BlobProvider[] = [];

  signals = {
    blobAdded: new Signal<BlobId>(),
    blobDeleted: new Signal<BlobId>(),
    uploadStateChanged: new Signal<BlobId[]>(),
    uploadFinished: new Signal<BlobId>(),
  };

  get uploading(): boolean {
    return this._providers.some(p => p.uploading);
  }

  get providers(): Readonly<BlobProvider[]> {
    return this._providers;
  }

  get blobs(): Set<BlobId> {
    // merge all blobs from all providers
    const result = new Set<BlobId>();
    for (const provider of this._providers) {
      for (const blob of provider.blobs) {
        result.add(blob);
      }
    }
    return result;
  }

  addProvider(provider: BlobProvider) {
    this._providers.push(provider);
    provider.signals.blobAdded.on(blobId => {
      this.signals.blobAdded.emit(blobId);
    });

    provider.signals.blobDeleted.on(blobId => {
      this.signals.blobDeleted.emit(blobId);
    });

    provider.signals.uploadStateChanged.on(() => {
      const uploadingIds = this._providers.reduce((acc, provider) => {
        provider.uploadingIds.forEach(id => acc.add(id));
        return acc;
      }, new Set<BlobId>());
      this.signals.uploadStateChanged.emit([...uploadingIds]);
    });

    provider.signals.uploadFinished.on(blobId => {
      this.signals.uploadFinished.emit(blobId);
    });
  }

  removeProvider(provider: BlobProvider) {
    this._providers = this._providers.filter(p => p !== provider);
  }

  async get(id: BlobId): Promise<BlobURL | null> {
    for (const provider of this._providers) {
      try {
        return await provider.get(id);
      } catch (e) {
        console.warn(e);
      }
    }
    throw new Error(`No provider found for blob ${id}`);
  }

  async set(blob: Blob): Promise<BlobId> {
    let result: BlobId | null = null;
    for (const provider of this._providers) {
      try {
        result = await provider.set(blob);
      } catch (e) {
        console.warn(e);
      }
    }

    if (result === null) throw new Error('No provider found for blob');
    return result;
  }

  async delete(id: BlobId): Promise<void> {
    for (const provider of this._providers) {
      try {
        await provider.delete(id);
      } catch (e) {
        console.warn(e);
      }
    }
  }

  async clear(): Promise<void> {
    for (const provider of this._providers) {
      try {
        await provider.clear();
      } catch (e) {
        console.warn(e);
      }
    }
  }
}
