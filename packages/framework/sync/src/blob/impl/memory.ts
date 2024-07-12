import type { BlobSource } from '../source.js';

export class MemoryBlobSource implements BlobSource {
  readonly map = new Map<string, Blob>();

  name = 'memory';

  readonly = false;

  delete(key: string) {
    this.map.delete(key);
    return Promise.resolve();
  }

  get(key: string) {
    return Promise.resolve(this.map.get(key) ?? null);
  }

  list() {
    return Promise.resolve(Array.from(this.map.keys()));
  }

  set(key: string, value: Blob) {
    this.map.set(key, value);
    return Promise.resolve(key);
  }
}
