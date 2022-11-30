export type BlobId = string;
export type BlobURL = string;

export interface BlobProvider {
  get(id: BlobId): Promise<BlobURL | null>;
  set(blob: Blob): Promise<BlobId>;
  delete(id: BlobId): Promise<void>;
  clear(): Promise<void>;
}

export type IdbInstance = {
  get: (key: string) => Promise<ArrayBufferLike | undefined>;
  set: (key: string, value: ArrayBufferLike) => Promise<void>;
  has(id: BlobId): Promise<boolean>;
  keys: () => Promise<string[]>;
  delete: (key: string) => Promise<void>;
  clear: () => Promise<void>;
};
