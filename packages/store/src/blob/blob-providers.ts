export interface BlobProvider {
  readonly config: unknown;
}

export class IndexedDBBlobProvider implements BlobProvider {
  readonly config: unknown;
}
