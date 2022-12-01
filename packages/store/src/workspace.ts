import { Store, StoreOptions } from './store';
import { Space } from './space';
import { Indexer, QueryContent } from './search';

export class Page extends Space {
  // ...
}

export class Workspace {
  private _store: Store;
  private _indexer: Indexer;
  pages = new Map<string, Page>();

  get providers() {
    return this._store.providers;
  }

  get doc() {
    return this._store.doc;
  }

  constructor(options: StoreOptions) {
    this._store = new Store(options);
    this._indexer = new Indexer(this.doc);
  }

  createPage(pageId: string) {
    const page = new Page(
      pageId,
      this.doc,
      this._store.awareness,
      this._store.idGenerator
    );
    this._store.addSpace(page);
    this._indexer.onCreateSpace(page.id);
    this.pages.set(pageId, page);
    return page;
  }

  serializeDoc() {
    return this._store.serializeDoc();
  }

  search(query: QueryContent) {
    return this._indexer.search(query);
  }

  toJSXElement(id = '0') {
    return this._store.toJSXElement(id);
  }
}
