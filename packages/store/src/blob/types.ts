export type BlobId = string;
export type BlobURL = string;

export interface BlobProvider {
  get(id: BlobId): Promise<BlobURL | null>;
  set(blob: Blob): Promise<BlobId>;
  delete(id: BlobId): Promise<void>;
  clear(): Promise<void>;
}

export type IdbInstance<T = ArrayBufferLike> = {
  get: (key: string) => Promise<T | undefined>;
  set: (key: string, value: T) => Promise<void>;
  has(id: BlobId): Promise<boolean>;
  keys: () => Promise<string[]>;
  delete: (key: string) => Promise<void>;
  clear: () => Promise<void>;
};
