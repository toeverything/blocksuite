import type { BlobProvider } from './blob-providers';

export class BlobStorage {
  private _providers: BlobProvider[] = [];

  get providers() {
    return this._providers;
  }

  addProvider(provider: BlobProvider) {
    this._providers.push(provider);
  }

  removeProvider(provider: BlobProvider) {
    this._providers = this._providers.filter(p => p !== provider);
  }

  async get(id: string): Promise<string> {
    for (const provider of this._providers) {
      try {
        return await provider.get(id);
      } catch (e) {
        console.warn(e);
      }
    }
    throw new Error(`No provider found for blob ${id}`);
  }

  async set(blob: Blob): Promise<string> {
    for (const provider of this._providers) {
      try {
        return await provider.set(blob);
      } catch (e) {
        console.warn(e);
      }
    }
    throw new Error('No provider found for blob');
  }

  async delete(id: string): Promise<void> {
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
