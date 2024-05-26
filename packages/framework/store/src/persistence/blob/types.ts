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
}

export interface BlobStorage {
  crud: BlobStorageCRUD;
}
