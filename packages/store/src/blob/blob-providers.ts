import { uuidv4 } from 'lib0/random';
import * as IKV from 'idb-keyval';
import { Signal } from '../utils/signal';

export type BlobId = string;
export type BlobURL = string;

type IdbInstance = {
  get: (key: string) => Promise<ArrayBufferLike | undefined>;
  set: (key: string, value: ArrayBufferLike) => Promise<void>;
  has(id: BlobId): Promise<boolean>;
  keys: () => Promise<string[]>;
  delete: (key: string) => Promise<void>;
  clear: () => Promise<void>;
};

function getDatabase(type: string, database: string): IdbInstance {
  const db = createStore(`${database}_${type}`, type);
  return {
    get: (key: string) => get<ArrayBufferLike>(key, db),
    set: (key: string, value: ArrayBufferLike) => set(key, value, db),
    has: (key: string) => get(key, db).then(value => value !== undefined),
    keys: () => keys(db),
    delete: (key: string) => del(key, db),
    clear: () => clear(db),
  };
}

export interface BlobProvider {
  get(id: BlobId): Promise<BlobURL | null>;
  set(blob: Blob): Promise<BlobId>;
  delete(id: BlobId): Promise<void>;
  clear(): Promise<void>;
  signals: {
    blobAdded: Signal<BlobId>;
  };
}

interface BlobProviderStatic {
  init(workspace: string): Promise<BlobProvider>;
}

function staticImplements<T>() {
  return <U extends T>(constructor: U) => constructor;
}

@staticImplements<BlobProviderStatic>()
export class IndexedDBBlobProvider implements BlobProvider {
  private readonly database: IdbInstance;
  readonly blobs = new Set<BlobId>();

  signals = {
    blobAdded: new Signal<BlobId>(),
  };

  static async init(workspace: string): Promise<IndexedDBBlobProvider> {
    const provider = new IndexedDBBlobProvider(workspace);
    await provider._initBlobs();
    return provider;
  }

  private async _initBlobs() {
    const entries = await this.database.keys();
    for (const [key] of entries) {
      const blobId = key as BlobId;
      this.signals.blobAdded.emit(blobId);
      this.blobs.add(blobId);
    }
  }

  private constructor(workspace: string) {
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

      this.blobs.add(hash);
      this.signals.blobAdded.emit(hash);
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
