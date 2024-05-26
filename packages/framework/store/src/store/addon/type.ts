import type { BlobAddon } from './blob.js';
import type { IndexerAddon } from './indexer.js';
import type { TestAddon } from './test.js';

export class DocCollectionAddonType
  implements BlobAddon, IndexerAddon, TestAddon
{
  blob!: BlobAddon['blob'];

  indexer!: IndexerAddon['indexer'];
  search!: IndexerAddon['search'];

  importDocSnapshot!: TestAddon['importDocSnapshot'];
  exportJSX!: TestAddon['exportJSX'];
}
