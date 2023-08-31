import type { QueryContent } from '../../indexer/index.js';
import {
  BacklinkIndexer,
  BlockIndexer,
  SearchIndexer,
} from '../../indexer/index.js';
import type { WorkspaceOptions } from '../workspace.js';
import type { Workspace } from '../workspace.js';

export type Indexer = {
  search: SearchIndexer;
  backlink: BacklinkIndexer;
};

export interface IndexerAddon {
  indexer: Indexer;
  search: (query: QueryContent) => Map<string, string>;
}

type WorkspaceConstructor = {
  new (storeOptions: WorkspaceOptions): Omit<Workspace, keyof IndexerAddon>;
};

export function indexer(originalClass: WorkspaceConstructor): typeof Workspace {
  // @ts-ignore
  return class extends originalClass {
    indexer: Indexer;

    search(query: QueryContent) {
      return this.indexer.search.search(query);
    }

    constructor(storeOptions: WorkspaceOptions) {
      super(storeOptions);
      const blockIndexer = new BlockIndexer(this.doc, { slots: this.slots });
      this.indexer = {
        search: new SearchIndexer(this.doc),
        backlink: new BacklinkIndexer(blockIndexer),
      };
    }
  };
}
