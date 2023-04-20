export interface BlobStorageCRUD {
  get: (key: string) => Promise<Blob | null>;
  set: (key: string, value: Blob) => Promise<string>;
  delete: (key: string) => Promise<void>;
  list: () => Promise<string[]>;
}

export interface BlobManager {
  get: (key: string) => Promise<Blob | null>;
  set: (value: Blob) => Promise<string>;
  delete: (key: string) => Promise<void>;
  list: () => Promise<string[]>;
}

export interface BlobStorage {
  crud: BlobStorageCRUD;
}
