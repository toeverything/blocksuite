import type { BlobProvider } from './blob-providers';

export class BlobStorage {
  private _providers: BlobProvider[] = [];

  get providers() {
    return this._providers;
  }

  private get _firstProvider(): BlobProvider {
    if (this._providers.length === 0) {
      throw new Error('No provider found');
    }
    return this._providers[0];
  }

  get blobs(): Set<string> {
    return this._firstProvider.blobs;
  }

  addProvider(provider: BlobProvider) {
    this._providers.push(provider);
  }

  removeProvider(provider: BlobProvider) {
    this._providers = this._providers.filter(p => p !== provider);
  }

  async get(id: string): Promise<string | null> {
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
    let result: string | null = null;
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
