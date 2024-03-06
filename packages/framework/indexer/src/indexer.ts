import type { Backend } from './backend.js';
import type { Collector } from './collector.js';
import { IndexWriter } from './index-writer.js';
import type { Query } from './query.js';
import type { Schema } from './schema.js';
import type { Searcher, SearchResult } from './searcher.js';

export class Indexer implements Searcher {
  constructor(
    private readonly schema: Schema,
    private readonly backend: Backend
  ) {}

  async initialize(): Promise<void> {
    return this.backend.initialize(this.schema);
  }

  search<const C extends Collector[]>(
    query: Query,
    collectors: C
  ): Promise<SearchResult<C>> {
    return this.backend.search(query, collectors);
  }

  async write(): Promise<IndexWriter> {
    return new IndexWriter(await this.backend.write());
  }
}
