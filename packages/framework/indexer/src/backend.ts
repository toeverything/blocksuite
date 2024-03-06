import type { Document } from './document.js';
import type { Schema } from './schema.js';
import type { Searcher } from './searcher.js';

export interface Backend extends BackendReader, BackendSearcher {
  initialize(schema: Schema): Promise<void>;

  write(): Promise<BackendWriter>;
}

export interface BackendWriter extends BackendReader {
  insert(document: Document): void;

  delete(id: string): void;

  commit(): Promise<void>;

  rollback(): void;
}

export interface BackendReader {
  has(id: string): Promise<boolean>;
}

export interface BackendSearcher extends Searcher {}
