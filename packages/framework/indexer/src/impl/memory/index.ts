import type {
  Backend,
  BackendWriter,
  Collector,
  Document,
  Query,
  Schema,
  SearchResult,
} from '../../index.js';
import { DataStruct } from './data-struct.js';

export class MemoryBackend implements Backend {
  private data: DataStruct | null = null;

  private ensureInitialized(
    data: DataStruct | null
  ): asserts data is DataStruct {
    if (!data) {
      throw new Error('MemoryBackend not initialized');
    }
  }

  initialize(schema: Schema): Promise<void> {
    this.data = new DataStruct(schema);
    return Promise.resolve();
  }
  write(): Promise<BackendWriter> {
    this.ensureInitialized(this.data);
    return Promise.resolve(new MemoryBackendWriter(this.data));
  }
  has(id: string): Promise<boolean> {
    this.ensureInitialized(this.data);
    return Promise.resolve(this.data.has(id));
  }
  search<C extends Collector[]>(
    query: Query,
    collectors: C
  ): Promise<SearchResult<C>> {
    this.ensureInitialized(this.data);

    const weight = this.data.query(query);

    return Promise.resolve(
      collectors.map(collector =>
        this.data!.collect(weight, collector)
      ) as SearchResult<C>
    );
  }
}

export class MemoryBackendWriter implements BackendWriter {
  inserts: Document[] = [];
  deletes: string[] = [];

  constructor(private readonly data: DataStruct) {}

  insert(document: Document): void {
    this.inserts.push(document);
  }
  delete(id: string): void {
    this.deletes.push(id);
  }
  commit(): Promise<void> {
    for (const del of this.deletes) {
      this.data.delete(del);
    }
    for (const inst of this.inserts) {
      this.data.insert(inst);
    }
    return Promise.resolve();
  }
  rollback(): void {}
  has(id: string): Promise<boolean> {
    return Promise.resolve(this.data.has(id));
  }
}
