import { Store, StoreOptions } from './store';
import { Space } from './space';

export class Page extends Space {
  // ...
}

export class Workspace {
  private _store: Store;
  pages = new Map<string, Page>();

  get providers() {
    return this._store.providers;
  }

  get doc() {
    return this._store.doc;
  }

  constructor(options: StoreOptions) {
    this._store = new Store(options);
  }

  createPage(pageId: string) {
    const page = new Page(
      pageId,
      this.doc,
      this._store.awareness,
      this._store.idGenerator
    );
    this._store.addSpace(page);
    this.pages.set(pageId, page);
    return page;
  }

  serializeDoc() {
    return this._store.serializeDoc();
  }

  search(query: string) {
    return this._store.search(query);
  }

  toJSXElement(id = '0') {
    return this._store.toJSXElement(id);
  }
}
