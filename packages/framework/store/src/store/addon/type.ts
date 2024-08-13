import type { TestAddon } from './test.js';

export class DocCollectionAddonType implements TestAddon {
  exportJSX!: TestAddon['exportJSX'];

  importDocSnapshot!: TestAddon['importDocSnapshot'];
}
