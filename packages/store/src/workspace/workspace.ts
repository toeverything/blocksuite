import * as Y from 'yjs';
import { Store, StoreOptions } from '../store.js';
import { Space } from '../space.js';
import { Page } from './page.js';
import { Signal } from '../utils/signal.js';
import { Indexer, QueryContent } from './search.js';
import type { Awareness } from 'y-protocols/awareness';
import type { BaseBlockModel } from '../base.js';
import { BlobStorage, getBlobStorage } from '../blob/index.js';
import { createYMapProxy } from '../utils/yjs/proxy.js';
import { createYMap } from '../utils/yjs/index.js';

export interface PageMeta {
  id: string;
  title: string;
  createDate: number;
  [key: string]: string | number | boolean;
}

export type WorkspaceMetaData = {
  pages: Y.Array<Y.Map<PageMeta>>;
  versions: Y.Map<Record<string, Y.Array<number>>>;
  name: string;
  avatar?: string;
};

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
    return this.doc.getMap(this.id) as Y.Map<WorkspaceMetaData>;
  }

  private get _yMetaRootProxy() {
    return createYMapProxy(this._yMetaRoot);
  }

  private get _yPages() {
    if (!this._yMetaRoot.has('pages')) {
      this._yMetaRoot.set('pages', new Y.Array());
    }

    return this._yMetaRoot.get('pages');
  }

  private get _yVersions(): Y.Map<Record<string, Y.Array<number>>> {
    if (!this._yMetaRoot.has('versions')) {
      this._yMetaRoot.set('versions', new Y.Map());
    }

    return this._yMetaRoot.get('versions');
  }

  get name() {
    return this._yMetaRootProxy.name
      ? this._yMetaRootProxy.name.toString()
      : '';
  }

  get avatar() {
    return this._yMetaRootProxy.avatar
      ? this._yMetaRootProxy.avatar.toString()
      : '';
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

  getPageMeta(id: string): PageMeta | null {
    const pageMeta = this._yPages.toArray().find(page => page.get('id') === id);
    if (pageMeta) {
      return createYMapProxy(pageMeta);
    } else {
      return null;
    }
  }

  addPageMeta(page: PageMeta, index?: number) {
    this.doc.transact(() => {
      const yPage = createYMap<PageMeta>(page);
      if (index === undefined) {
        this._yPages.push([yPage]);
      } else {
        this._yPages.insert(index, [yPage]);
      }
    });
  }

  setPageMeta(id: string, props: Partial<PageMeta>) {
    const index = this._yPages
      .toArray()
      .findIndex(pageMeta => pageMeta.get('id') === id);

    this.doc.transact(() => {
      if (index === -1) return;

      const yPage = this._yPages.get(index);
      Object.entries(props).forEach(([key, value]) => {
        if (value != null) {
          yPage.set(key, value);
        }
      });
    });
  }

  removePage(id: string) {
    const index = this._yPages
      .toArray()
      .findIndex(pageMeta => pageMeta.get('id') === id);

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
      const yVersion = new Y.Array<number>();
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
    const { _yPages, _prevPages } = this;
    const pageMetas = _yPages.toArray();

    pageMetas.forEach(pageMeta => {
      const id = pageMeta.get('id');
      // newly added space can't be found
      // unless explicitly getMap after meta updated
      this.doc.getMap('space:' + id);

      if (!_prevPages.has(id)) {
        // Ensure following YEvent handler could be triggered in correct order.
        setTimeout(() => this.pageAdded.emit(id));
      }
    });

    _prevPages.forEach(prevPageId => {
      const isRemoved = !pageMetas.find(p => p.get('id') === prevPageId);
      if (isRemoved) {
        this.pageRemoved.emit(prevPageId);
      }
    });

    _prevPages.clear();
    pageMetas.forEach(page => _prevPages.add(page.get('id')));

    this.pagesUpdated.emit();
  }

  private _handleCommonFieldsEvent() {
    this.commonFieldsUpdated.emit();
  }

  private _handleEvents = (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    events: Y.YEvent<Y.Array<unknown> | Y.Text | Y.Map<any>>[]
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
  public readonly room: string | undefined;

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
    if (!options.isSSR) {
      this._blobStorage = getBlobStorage(options.room);
    } else {
      // blob storage is not reachable in server side
      this._blobStorage = Promise.resolve(null);
    }
    this.room = options.room;

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

    return this._pages.get(pageId) ?? null;
  }

  private _handlePageEvent() {
    this.signals.pageAdded.on(pageId => {
      const page = new Page(
        this,
        pageId,
        this.doc,
        this._store.awareness,
        this._store.idGenerator
      );
      this._store.addSpace(page);
      page.syncFromExistingDoc();
      this._indexer.onCreatePage(pageId);
    });

    this.signals.pageRemoved.on(id => {
      const page = this.getPage(id) as Page;
      page.dispose();
      this._store.removeSpace(page);
      // TODO remove page from indexer
    });
  }

  createPage(pageId: string) {
    if (this._hasPage(pageId)) {
      throw new Error('page already exists');
    }

    this.meta.addPageMeta({
      id: pageId,
      title: '',
      createDate: +new Date(),
    });
  }

  /** Update page meta state. Note that this intentionally does not mutate page state. */
  setPageMeta(pageId: string, props: Partial<PageMeta>) {
    this.meta.setPageMeta(pageId, props);
  }

  removePage(pageId: string) {
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
