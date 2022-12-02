import { Store, StoreOptions } from './store';
import { Space } from './space';
import { Signal } from './utils/signal';
import { Indexer, QueryContent } from './search';

export class Page extends Space {
  // ...
}

export class Workspace {
  private _store: Store;
  private _indexer: Indexer;

  signals = {
    pageAdded: new Signal<string>(),
    pageRemoved: new Signal<string>(),
  };

  get providers() {
    return this._store.providers;
  }

  get pages() {
    return this._store.spaces as Map<string, Page>;
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
      'space:' + pageId,
      this.doc,
      this._store.awareness,
      this._store.idGenerator
    );
    this._store.addSpace(page);
    this._indexer.onCreateSpace(page.id);
    this.signals.pageAdded.emit(page.id);
    return page;
  }

  removePage(page: Page) {
    const { id } = page;
    this._store.removeSpace(page);
    this.signals.pageRemoved.emit(id);
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
