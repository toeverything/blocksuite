import type { Slot } from '@blocksuite/global/utils';

export type BlobId = string;
export type BlobURL = string;

export enum BlobSyncState {
  Waiting,
  Syncing,
  Success,
  Failed,
}

export interface BlobSyncStateChangeEvent {
  id: BlobId;
  state: BlobSyncState;
}

export interface BlobProvider {
  uploading: boolean;
  blobs: Promise<string[]>;
  slots: {
    onBlobSyncStateChange: Slot<BlobSyncStateChangeEvent>;
  };
  get(id: BlobId): Promise<BlobURL | null>;
  set(blob: Blob): Promise<BlobId>;
  delete(id: BlobId): Promise<void>;
  clear(): Promise<void>;
}

export interface PendingTask {
  id: BlobId;
  blob: ArrayBufferLike | undefined;
  failed?: boolean;
}

export interface SyncTask extends PendingTask {
  retry: number;
}

export type IDBInstance<T = ArrayBufferLike> = {
  get: (key: BlobId) => Promise<T | undefined>;
  set: (key: BlobId, value: T) => Promise<void>;
  has(id: BlobId): Promise<boolean>;
  keys: () => Promise<BlobId[]>;
  values: () => Promise<T[]>;
  delete: (key: BlobId) => Promise<void>;
  clear: () => Promise<void>;
};
