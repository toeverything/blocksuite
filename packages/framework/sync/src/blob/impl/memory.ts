import type { BlobSource } from '../source.js';

export class MemoryBlobSource implements BlobSource {
  name = 'memory';
  readonly = false;

  readonly map: Map<string, Blob> = new Map();

  get(key: string) {
    return Promise.resolve(this.map.get(key) ?? null);
  }
  set(key: string, value: Blob) {
    this.map.set(key, value);
    return Promise.resolve(key);
  }
  delete(key: string) {
    this.map.delete(key);
    return Promise.resolve();
  }
  list() {
    return Promise.resolve(Array.from(this.map.keys()));
  }
}
