export interface BlobStorageCRUD {
  get: (key: string) => Promise<Blob | null>;
  set: (value: Blob) => Promise<void>;
  delete: (key: string) => Promise<void>;
  list: () => AsyncIterableIterator<[string, Blob]>;
}

export interface BlobStorage {
  crud: BlobStorageCRUD;
  hash: (value: Blob) => Promise<string>;
}
