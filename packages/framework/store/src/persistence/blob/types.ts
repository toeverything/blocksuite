export interface BlobStorageCRUD {
  get: (key: string) => Promise<Blob | null> | Blob | null;
  set: (key: string, value: Blob) => Promise<string> | string;
  delete: (key: string) => Promise<void> | void;
  list: () => Promise<string[]> | string[];
}

export interface BlobManager {
  get: (key: string) => Promise<Blob | null> | Blob | null;
  set: (value: Blob, key?: string) => Promise<string> | string;
  delete: (key: string) => Promise<void> | void;
  list: () => Promise<string[]> | string[];

  gc: () => Promise<void> | void;
  increaseRef: (blobId: string) => void;
  decreaseRef: (blobId: string) => void;
}

export interface BlobStorage {
  crud: BlobStorageCRUD;
}
