import type { BackendWriter } from './backend.js';
import type { Document } from './document.js';
import { indexDateField } from './internal-fields.js';

export class IndexWriter {
  constructor(private readonly backend: BackendWriter) {}

  insert(document: Document) {
    document.set(indexDateField, Date.now());
    this.backend.insert(document);
  }

  delete(id: string) {
    this.backend.delete(id);
  }

  async commit() {
    await this.backend.commit();
  }

  rollback() {
    this.backend.rollback();
  }
}
