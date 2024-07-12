export interface BlobSource {
  delete: (key: string) => Promise<void>;
  get: (key: string) => Promise<Blob | null>;
  list: () => Promise<string[]>;
  name: string;
  readonly: boolean;
  set: (key: string, value: Blob) => Promise<string>;
}
