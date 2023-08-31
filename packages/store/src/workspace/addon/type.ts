import type { BlobAddon } from './blob.js';
import type { IndexerAddon } from './indexer.js';
import type { TestAddon } from './test.js';

export class WorkspaceAddonType implements BlobAddon, IndexerAddon, TestAddon {
  blobs!: BlobAddon['blobs'];

  indexer!: IndexerAddon['indexer'];
  search!: IndexerAddon['search'];

  importPageSnapshot!: TestAddon['importPageSnapshot'];
  exportPageSnapshot!: TestAddon['exportPageSnapshot'];
  exportPageYDoc!: TestAddon['exportPageYDoc'];
  exportJSX!: TestAddon['exportJSX'];
}
