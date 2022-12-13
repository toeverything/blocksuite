import * as Y from 'yjs';
import { Store, StoreOptions } from '../store';
import { Space } from '../space';
import { Page } from './page';
import { Signal } from '../utils/signal';
import { Indexer, QueryContent } from './search';
import type { Awareness } from 'y-protocols/awareness';
import type { BaseBlockModel } from '../base';

export interface PageMeta {
  id: string;
  title: string;
  favorite: boolean;
  trash: boolean;
  createDate: number;
  trashDate: number | null;
}

class WorkspaceMeta extends Space {
  _prevPages = new Set<string>();
  pageAdded = new Signal<string>();
  pageRemoved = new Signal<string>();
  pagesUpdated = new Signal();

  constructor(id: string, doc: Y.Doc, awareness: Awareness) {
    super(id, doc, awareness);
    this._yMetaRoot.observeDeep(this._handlePageEvent);
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

  get pageMetas() {
    return this._yPages.toJSON() as PageMeta[];
  }

  addPage(page: PageMeta, index?: number) {
    const yPage = new Y.Map();
    this.doc.transact(() => {
      if (index === undefined) {
        this._yPages.push([yPage]);
        yPage.set('id', page.id);
        yPage.set('title', page.title);
        yPage.set('favorite', page.favorite);
        yPage.set('trash', page.trash);
        yPage.set('createDate', page.createDate);
        yPage.set('trashDate', page.trashDate);
      } else {
        this._yPages.insert(index, [yPage]);
      }
    });
  }

  setPage(id: string, props: Partial<PageMeta>) {
    const pages = this._yPages.toJSON() as PageMeta[];
    const index = pages.findIndex((page: PageMeta) => id === page.id);

    this.doc.transact(() => {
      if (index === -1) return;

      const yPage = this._yPages.get(index) as Y.Map<unknown>;
      if ('id' in props) {
        yPage.set('id', props.id ?? pages[index]['id']);
      }
      if ('title' in props) {
        yPage.set('title', props.title ?? pages[index]['title']);
      }
      if ('favorite' in props) {
        yPage.set('favorite', props.favorite ?? pages[index]['favorite']);
      }
      if ('trash' in props) {
        yPage.set('trash', props.trash ?? pages[index]['trash']);
      }
      if ('createDate' in props) {
        yPage.set('createDate', props.createDate ?? pages[index]['createDate']);
      }
      if ('trashDate' in props) {
        yPage.set('trashDate', props.trashDate ?? pages[index]['trashDate']);
      }
    });
  }

  removePage(id: string) {
    const pages = this._yPages.toArray() as PageMeta[];
    const index = pages.findIndex((page: PageMeta) => id === page.id);

    this.doc.transact(() => {
      if (index !== -1) {
        this._yPages.delete(index, 1);
      }
    });
  }

  private _handlePageEvent = (_: Y.YEvent<Y.Array<unknown>>[]) => {
    const { pageMetas, _prevPages } = this;

    pageMetas.forEach(page => {
      // newly added space can't be found
      // unless explictly getMap after meta updated
      this.doc.getMap('space:' + page.id);

      if (!_prevPages.has(page.id)) {
        // Ensure following YEvent handler could be triggered in correct order.
        setTimeout(() => this.pageAdded.emit(page.id));
      }
    });

    _prevPages.forEach(prevPageId => {
      const isRemoved = !pageMetas.find(p => p.id === prevPageId);
      if (isRemoved) {
        this.pageRemoved.emit(prevPageId);
      }
    });

    _prevPages.clear();
    pageMetas.forEach(page => _prevPages.add(page.id));

    this.pagesUpdated.emit();
  };
}

export class Workspace {
  private _store: Store;
  private _indexer: Indexer;

  meta: WorkspaceMeta;

  signals: {
    pagesUpdated: Signal;
    pageAdded: Signal<string>;
    pageRemoved: Signal<string>;
  };

  flavourMap = new Map<string, typeof BaseBlockModel>();

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
      pageAdded: this.meta.pageAdded,
      pageRemoved: this.meta.pageRemoved,
    };

    this._handlePageEvent();
  }

  get providers() {
    return this._store.providers;
  }

  private get _pages() {
    // the meta space is not included
    return this._store.spaces as Map<string, Page>;
  }

  get doc() {
    return this._store.doc;
  }

  register(blockSchema: Record<string, typeof BaseBlockModel>) {
    Object.keys(blockSchema).forEach(key => {
      this.flavourMap.set(key, blockSchema[key]);
    });
    return this;
  }

  private _hasPage(pageId: string) {
    return this._pages.has('space:' + pageId);
  }

  getPage(pageId: string): Page | null {
    if (!pageId.startsWith('space:')) {
      pageId = 'space:' + pageId;
    }

    const page = this._pages.get(pageId) ?? null;
    return page;
  }

  private _handlePageEvent() {
    this.signals.pageAdded.on(pageMeta => {
      const page = new Page(
        this,
        'space:' + pageMeta,
        this.doc,
        this._store.awareness,
        this._store.idGenerator
      );
      this._store.addSpace(page);
      page.syncFromExistingDoc();
      this._indexer.onCreatePage(pageMeta);
    });

    this.signals.pageRemoved.on(id => {
      const page = this._pages.get(id) as Page;
      this._store.removeSpace(page);
      // TODO remove page from indexer
    });
  }

  createPage(pageId: string) {
    if (this._hasPage(pageId)) {
      throw new Error('page already exists');
    }

    this.meta.addPage({
      id: pageId,
      title: '',
      favorite: false,
      trash: false,
      createDate: +new Date(),
      trashDate: null,
    });
  }

  /** Update page meta state. Note that this intentionally does not mutate page state. */
  setPageMeta(pageId: string, props: Partial<PageMeta>) {
    if (pageId.startsWith('space:')) {
      pageId = pageId.slice(6);
    }

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
