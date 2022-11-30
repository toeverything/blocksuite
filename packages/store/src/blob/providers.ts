import { Buffer } from 'buffer';

import type { BlobProvider, IdbInstance } from './types';
import { getDatabase, sha3 } from './utils';

export class IndexedDBBlobProvider implements BlobProvider {
  private readonly database: IdbInstance;

  constructor(workspace: string) {
    this.database = getDatabase('blob', workspace);
  }

  async get(id: string): Promise<string | null> {
    const blob = await this.database.get(id);
    if (!blob) return null;

    const result = URL.createObjectURL(new Blob([blob]));
    return result;
  }

  async set(blob: Blob): Promise<string> {
    const buffer = await blob.arrayBuffer();
    const hash = sha3(Buffer.from(buffer));
    if (!(await this.database.has(hash))) {
      await this.database.set(hash, buffer);
    }

    return hash;
  }

  async delete(id: string): Promise<void> {
    await this.database.delete(id);
  }

  async clear(): Promise<void> {
    await this.database.clear();
  }
}

export class JWSTBlobProvider implements BlobProvider {
  config: unknown;
  get(id: string): Promise<string | null> {
    throw new Error('Method not implemented.');
  }
  set(blob: Blob): Promise<string> {
    throw new Error('Method not implemented.');
  }
  delete(id: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
  clear(): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
