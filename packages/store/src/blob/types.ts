import type { Signal } from '../utils/signal.js';

export type BlobId = string;
export type BlobURL = string;

export interface BlobProvider {
  blobs: Set<BlobId>;
  uploading: boolean;
  signals: {
    blobAdded: Signal<BlobId>;
    uploadStateChanged?: Signal<boolean>;
  };
  get(id: BlobId): Promise<BlobURL | null>;
  set(blob: Blob): Promise<BlobId>;
  delete(id: BlobId): Promise<void>;
  clear(): Promise<void>;
}

export type IDBInstance<T = ArrayBufferLike> = {
  get: (key: BlobId) => Promise<T | undefined>;
  set: (key: BlobId, value: T) => Promise<void>;
  has(id: BlobId): Promise<boolean>;
  keys: () => Promise<BlobId[]>;
  delete: (key: BlobId) => Promise<void>;
  clear: () => Promise<void>;
};
