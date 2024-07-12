import type { QueryContent } from '../../indexer/index.js';
import type { DocCollectionOptions } from '../collection.js';

import {
  BacklinkIndexer,
  BlockIndexer,
  SearchIndexer,
} from '../../indexer/index.js';
import { addOnFactory } from './shared.js';

type Indexer = {
  backlink: BacklinkIndexer | null;
  search: SearchIndexer | null;
};

export interface IndexerAddon {
  indexer: Indexer;
  search: (query: QueryContent) => Map<string, string>;
}

export const indexer = addOnFactory<keyof IndexerAddon>(
  originalClass =>
    class extends originalClass {
      indexer: Indexer;

      constructor(storeOptions: DocCollectionOptions) {
        super(storeOptions);
        const blockIndexer = new BlockIndexer(this.doc, { slots: this.slots });
        this.indexer = {
          backlink: new BacklinkIndexer(blockIndexer),
          search: !storeOptions.disableSearchIndex
            ? new SearchIndexer(this.doc)
            : null,
        };
      }

      search(query: QueryContent) {
        return (
          this.indexer.search?.search(query) ??
          new Map<
            string,
            {
              content: string;
              space: string;
            }
          >()
        );
      }
    }
);
