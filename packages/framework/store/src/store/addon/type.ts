import type { IndexerAddon } from './indexer.js';
import type { TestAddon } from './test.js';

export class DocCollectionAddonType implements IndexerAddon, TestAddon {
  indexer!: IndexerAddon['indexer'];

  search!: IndexerAddon['search'];

  importDocSnapshot!: TestAddon['importDocSnapshot'];

  exportJSX!: TestAddon['exportJSX'];
}
