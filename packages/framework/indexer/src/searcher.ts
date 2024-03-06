import type { Collector, CollectorOutput } from './collector.js';
import type { Query } from './query.js';

export interface Searcher {
  search<C extends Collector[]>(
    query: Query,
    collectors: C
  ): Promise<SearchResult<C>>;
}

export type SearchResult<Collectors extends Collector[]> = {
  [K in keyof Collectors]: CollectorOutput<Collectors[K]>;
};
