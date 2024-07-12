import type { IndexerAddon } from './indexer.js';
import type { TestAddon } from './test.js';

export class DocCollectionAddonType implements IndexerAddon, TestAddon {
  exportJSX!: TestAddon['exportJSX'];

  importDocSnapshot!: TestAddon['importDocSnapshot'];

  indexer!: IndexerAddon['indexer'];

  search!: IndexerAddon['search'];
}
