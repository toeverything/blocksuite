import * as Y from 'yjs';
import { Store, StoreOptions } from '../store';
import { Space } from '../space';
import { Page } from './page';
import { Signal } from '../utils/signal';
import { Indexer, QueryContent } from '../search';
import type { BaseBlockModel } from '../base';
import type { Awareness } from 'y-protocols/awareness';

export interface PageMeta {
  id: string;
  title: string;
  favorite: boolean;
  trash: boolean;
}

class WorkspaceMeta extends Space {
  pagesUpdated = new Signal();

  constructor(id: string, doc: Y.Doc, awareness: Awareness) {
    super(id, doc, awareness);
    this._yPages.observeDeep(this._handlePageEvent);
  }

  private get _yMetaRoot() {
    return this.doc.getMap(this.id);
  }

  private get _yPages() {
    if (!this._yMetaRoot.has('pages')) {
      this._yMetaRoot.set('pages', new Y.Array());
    }

    return this._yMetaRoot.get('pages') as Y.Array<unknown>;
  }

  get pages() {
    return this._yPages.toJSON() as PageMeta[];
  }

  addPage(page: PageMeta, index?: number) {
    const yPage = new Y.Map();
    yPage.set('id', page.id);
    yPage.set('title', page.title);
    yPage.set('favorite', page.favorite);
    yPage.set('trash', page.trash);

    if (index === undefined) {
      this._yPages.push([yPage]);
    } else {
      this._yPages.insert(index, [yPage]);
    }
  }

  setPage(id: string, props: Partial<PageMeta>) {
    const pages = this._yPages.toJSON() as PageMeta[];
    const index = pages.findIndex((page: PageMeta) => id === page.id);

    if (index !== -1) {
      const yPage = this._yPages.get(index) as Y.Map<unknown>;
      if ('id' in props) yPage.set('id', props.id);
      if ('title' in props) yPage.set('title', props.title);
      if ('favorite' in props) yPage.set('favorite', props.favorite);
      if ('trash' in props) yPage.set('trash', props.trash);
    }
  }

  removePage(id: string) {
    const pages = this._yPages.toArray() as PageMeta[];
    const index = pages.findIndex((page: PageMeta) => id === page.id);

    if (index !== -1) {
      this._yPages.delete(index, 1);
    }
  }

  private _handlePageEvent = (_: Y.YEvent<Y.Array<unknown>>[]) => {
    this.pagesUpdated.emit();
  };
}

export class Workspace {
  private _store: Store;
  private _indexer: Indexer;

  meta: WorkspaceMeta;

  signals: {
    pagesUpdated: Signal;
  };

  get providers() {
    return this._store.providers;
  }

  get pages() {
    // the meta space is not included
    return this._store.spaces as Map<string, Page>;
  }

  get doc() {
    return this._store.doc;
  }

  constructor(options: StoreOptions) {
    this._store = new Store(options);
    this._indexer = new Indexer(this.doc);
    this.meta = new WorkspaceMeta(
      'space:meta',
      this.doc,
      this._store.awareness
    );

    this.signals = {
      pagesUpdated: this.meta.pagesUpdated,
    };
  }

  createPage<
    IBlockSchema extends Record<string, typeof BaseBlockModel> = Record<
      string,
      typeof BaseBlockModel
    >
  >(pageId: string, title = '') {
    const page = new Page<IBlockSchema>(
      'space:' + pageId,
      this.doc,
      this._store.awareness,
      this._store.idGenerator
    );
    this._store.addSpace(page);
    this.meta.addPage({ id: pageId, title, favorite: false, trash: false });
    this._indexer.onCreateSpace(page.id);
    return page;
  }

  setPage(pageId: string, props: Partial<PageMeta>) {
    this.meta.setPage(pageId, props);
  }

  removePage(page: Page) {
    page.dispose();
    this._store.removeSpace(page);
    this.meta.removePage(page.id);
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
