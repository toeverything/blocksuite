import { Signal } from '../utils/signal';
import type { BlobProvider, BlobId, BlobURL } from './blob-providers';

export class BlobStorage {
  private _providers: BlobProvider[] = [];

  signals = {
    blobAdded: new Signal<BlobId>(),
  };

  get providers() {
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
