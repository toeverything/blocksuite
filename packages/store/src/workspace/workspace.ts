import * as Y from 'yjs';
import { Store, StoreOptions } from '../store.js';
import { Space } from '../space.js';
import { Page } from './page.js';
import { Signal } from '../utils/signal.js';
import { Indexer, QueryContent } from './search.js';
import type { Awareness } from 'y-protocols/awareness';
import type { BaseBlockModel } from '../base.js';
import { BlobStorage, getBlobStorage } from '../blob/index.js';

export interface PageMeta {
  id: string;
  title: string;
  createDate: number;
  [key: string]: string | number | boolean;
}

class WorkspaceMeta extends Space {
  private _workspace: Workspace;
  private _prevPages = new Set<string>();
  pageAdded = new Signal<string>();
  pageRemoved = new Signal<string>();
  pagesUpdated = new Signal();
  commonFieldsUpdated = new Signal();

  constructor(id: string, workspace: Workspace, awareness: Awareness) {
    super(id, workspace.doc, awareness);
    this._workspace = workspace;
    this._yMetaRoot.observeDeep(this._handleEvents);
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

  private get _yVersions() {
    if (!this._yMetaRoot.has('versions')) {
      this._yMetaRoot.set('versions', new Y.Map());
    }

    return this._yMetaRoot.get('versions') as Y.Map<unknown>;
  }

  private get _yName() {
    if (!this._yMetaRoot.has('name')) {
      return null;
    }
    return this._yMetaRoot.get('name') as string;
  }

  private get _yAvatar() {
    if (!this._yMetaRoot.has('avatar')) {
      return null;
    }
    return this._yMetaRoot.get('avatar') as Y.Text;
  }

  get name() {
    return this._yName ? this._yName.toString() : '';
  }

  get avatar() {
    return this._yAvatar ? this._yAvatar.toString() : '';
  }

  setName(val: string) {
    this.doc.transact(() => {
      this._yMetaRoot.set('name', val);
    });
  }

  setAvatar(val: string) {
    this.doc.transact(() => {
      this._yMetaRoot.set('avatar', val);
    });
  }

  get pageMetas() {
    return this._yPages.toJSON() as PageMeta[];
  }

  getPageMeta(id: string) {
    if (id.startsWith('space:')) {
      id = id.slice(6);
    }

    return this.pageMetas.find(page => page.id === id);
  }

  addPage(page: PageMeta, index?: number) {
    const yPage = new Y.Map();
    this.doc.transact(() => {
      if (index === undefined) {
        this._yPages.push([yPage]);
        Object.entries(page).forEach(([key, value]) => {
          yPage.set(key, value);
        });
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
      Object.entries(props).forEach(([key, value]) => {
        yPage.set(key, value);
      });
    });
  }

  removePage(id: string) {
    const pages = this._yPages.toJSON() as PageMeta[];
    const index = pages.findIndex((page: PageMeta) => id === page.id);

    this.doc.transact(() => {
      if (index !== -1) {
        this._yPages.delete(index, 1);
      }
    });
  }

  /**
   * @internal Only for page initialization
   */
  writeVersion() {
    const { _yVersions, _workspace } = this;
    _workspace.flavourMap.forEach((model, flavour) => {
      const yVersion = new Y.Array();
      const [major, minor] = model.version;
      yVersion.push([major, minor]);
      _yVersions.set(flavour, yVersion);
    });
  }

  /**
   * @internal Only for page initialization
   */
  validateVersion() {
    // TODO: validate version
  }

  private _handlePageEvent() {
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
  }

  private _handleCommonFieldsEvent() {
    this.commonFieldsUpdated.emit();
  }

  private _handleEvents = (
    events: Y.YEvent<Y.Array<unknown> | Y.Text | Y.Map<unknown>>[]
  ) => {
    events.forEach(e => {
      const hasKey = (k: string) =>
        e.target === this._yMetaRoot && e.changes.keys.has(k);

      if (
        e.target === this._yPages ||
        e.target.parent === this._yPages ||
        hasKey('pages')
      ) {
        this._handlePageEvent();
      } else if (hasKey('name') || hasKey('avatar')) {
        this._handleCommonFieldsEvent();
      }
    });
  };
}

export class Workspace {
  static Y = Y;

  private _store: Store;
  private _indexer: Indexer;
  private _blobStorage: Promise<BlobStorage | null>;

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
    this._blobStorage = getBlobStorage(options.room);

    this.meta = new WorkspaceMeta('space:meta', this, this._store.awareness);

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

  get blobs() {
    return this._blobStorage;
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
      if (!id.startsWith('space:')) {
        id = 'space:' + id;
      }

      const page = this._pages.get(id) as Page;
      page.dispose();
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
      createDate: +new Date(),
    });
  }

  /** Update page meta state. Note that this intentionally does not mutate page state. */
  setPageMeta(pageId: string, props: Partial<PageMeta>) {
    if (pageId.startsWith('space:')) {
      pageId = pageId.slice(6);
    }

    this.meta.setPage(pageId, props);
  }

  removePage(pageId: string) {
    if (pageId.startsWith('space:')) {
      pageId = pageId.slice(6);
    }

    this.meta.removePage(pageId);
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
