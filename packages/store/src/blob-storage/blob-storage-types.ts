export interface BlobRef {
  blobId: string;
}

export type BlobInput = {
  data:
    | {
        textContent: string;
        encoding: 'utf8';
      }
    | Blob;
  // TODO:
  // | BufferSource
  // | ReadableStream<any>;
  mimeType?: string;
};

export interface BlobStorage {
  /** Upload a new blob */
  upload(blobInput: BlobInput): Promise<BlobRef>;
  /** Get info about this blob, some may be specific to the storage provider. */
  getDebugInfo(ref: BlobRef): Promise<Record<string, unknown>>;
  /** Get a web accessible URL to access this BlobRef's contents, such as for an `<img src={blobURL}/>` */
  getWebURL(ref: BlobRef): Promise<URL>;
  // // Hmm: How will we handle exporting large files / lots of files?
  // // We shouldn't just glob together everything into a big JSON, right?
  // // Should we require exporting by individual resource ids?
  // // Should exporting be a part of a higher interface on a per storage basis?
  // // e.g. export for a Torrent or IPFS stored resources might actually export Content Hashes
  // // and import takes those to re-associate them...
  // // But, that feels like a specific for the specific storage.
  // /** Export to something... need goals defined */
  // export(): Promise<Record<string, unknown>>;
  // import(): Promise<void>;
}
