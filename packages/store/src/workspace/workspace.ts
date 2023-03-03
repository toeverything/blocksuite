import { Signal } from '@blocksuite/global/utils';
import * as Y from 'yjs';
import type { z } from 'zod';

import { AwarenessStore, BlobUploadState } from '../awareness.js';
import { BlockSchema, internalPrimitives } from '../base.js';
import {
  BlobOptionsGetter,
  BlobStorage,
  BlobSyncState,
  getBlobStorage,
} from '../persistence/blob/index.js';
import { Space } from '../space.js';
import { Store, StoreOptions } from '../store.js';
import type { BlockSuiteDoc } from '../yjs/index.js';
import { Page } from './page.js';
import { Indexer, QueryContent } from './search.js';

export interface PageMeta {
  id: string;
  title: string;
  createDate: number;

  [key: string]: string | number | boolean;
}

type WorkspaceMetaFields = {
  pages: Y.Array<unknown>;
  versions: Y.Map<unknown>;
  name: string;
  avatar: string;
};

class WorkspaceMeta<
  Flags extends Record<string, unknown> = BlockSuiteFlags
> extends Space<WorkspaceMetaFields, Flags> {
  private _prevPages = new Set<string>();
  pageAdded = new Signal<string>();
  pageRemoved = new Signal<string>();
  pagesUpdated = new Signal();
  commonFieldsUpdated = new Signal();

  constructor(id: string, doc: BlockSuiteDoc, awarenessStore: AwarenessStore) {
    super(id, doc, awarenessStore, {
      valueInitializer: {
        pages: () => new Y.Array(),
        versions: () => new Y.Map(),
        avatar: () => '',
        name: () => '',
      },
    });
    this.origin.observeDeep(this._handleEvents);
  }

  get pages() {
    return this.proxy.pages;
  }

  get name() {
    return this.proxy.name;
  }

  get avatar() {
    return this.proxy.avatar;
  }

  setName(name: string) {
    this.doc.transact(() => {
      this.proxy.name = name;
    });
  }

  setAvatar(avatar: string) {
    this.doc.transact(() => {
      this.proxy.avatar = avatar;
    });
  }

  get pageMetas() {
    return this.proxy.pages.toJSON() as PageMeta[];
  }

  getPageMeta(id: string) {
    return this.pageMetas.find(page => page.id === id);
  }

  addPageMeta(page: PageMeta, index?: number) {
    const yPage = new Y.Map();
    this.doc.transact(() => {
      Object.entries(page).forEach(([key, value]) => {
        yPage.set(key, value);
      });
      if (index === undefined) {
        this.pages.push([yPage]);
      } else {
        this.pages.insert(index, [yPage]);
      }
    });
  }

  setPageMeta(id: string, props: Partial<PageMeta>) {
    const pages = this.pages.toJSON() as PageMeta[];
    const index = pages.findIndex((page: PageMeta) => id === page.id);

    this.doc.transact(() => {
      if (index === -1) return;

      const yPage = this.pages.get(index) as Y.Map<unknown>;
      Object.entries(props).forEach(([key, value]) => {
        yPage.set(key, value);
      });
    });
  }

  removePage(id: string) {
    const pages = this.pages.toJSON() as PageMeta[];
    const index = pages.findIndex((page: PageMeta) => id === page.id);

    this.doc.transact(() => {
      if (index !== -1) {
        this.pages.delete(index, 1);
      }
    });
  }

  /**
   * @internal Only for page initialization
   */
  writeVersion(workspace: Workspace) {
    const versions = this.proxy.versions;
    workspace.flavourSchemaMap.forEach((schema, flavour) => {
      versions.set(flavour, schema.version);
    });
  }

  /**
   * @internal Only for page initialization
   */
  validateVersion(workspace: Workspace) {
    const versions = this.proxy.versions.toJSON();
    const dataFlavours = Object.keys(versions);

    // TODO: emit data validation error signals
    if (dataFlavours.length === 0) {
      throw new Error(
        'Invalid workspace data, missing versions field. Please make sure the data is valid.'
      );
    }

    dataFlavours.forEach(dataFlavour => {
      const dataVersion = versions[dataFlavour] as number;
      const editorVersion =
        workspace.flavourSchemaMap.get(dataFlavour)?.version;
      if (!editorVersion) {
        throw new Error(
          `Editor missing ${dataFlavour} flavour. Please make sure this block flavour is registered.`
        );
      } else if (dataVersion > editorVersion) {
        throw new Error(
          `Editor doesn't support ${dataFlavour}@${dataVersion}. Please upgrade the editor.`
        );
      } else if (dataVersion < editorVersion) {
        throw new Error(
          `In workspace data, the block flavour ${dataFlavour}@${dataVersion} is outdated. Please downgrade the editor or try data migration.`
        );
      }
    });
  }

  private _handlePageEvent() {
    const { pageMetas, _prevPages } = this;

    pageMetas.forEach(pageMeta => {
      // newly added space can't be found
      // unless explictly getMap after meta updated
      this.doc.getMap('space:' + pageMeta.id);

      if (!_prevPages.has(pageMeta.id)) {
        // Ensure following YEvent handler could be triggered in correct order.
        queueMicrotask(() => this.pageAdded.emit(pageMeta.id));
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
        e.target === this.origin && e.changes.keys.has(k);

      if (
        e.target === this.pages ||
        e.target.parent === this.pages ||
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
  private _blobOptionsGetter?: BlobOptionsGetter;

  meta: WorkspaceMeta;

  signals: {
    pagesUpdated: Signal;
    pageAdded: Signal<string>;
    pageRemoved: Signal<string>;
  };

  flavourSchemaMap = new Map<string, z.infer<typeof BlockSchema>>();
  flavourInitialPropsMap = new Map<string, Record<string, unknown>>();

  constructor(options: StoreOptions) {
    this._store = new Store(options);
    this._indexer = new Indexer(this.doc);
    if (options.blobOptionsGetter) {
      this._blobOptionsGetter = options.blobOptionsGetter;
    }
    if (!options.isSSR) {
      this._blobStorage = getBlobStorage(options.room, k => {
        return this._blobOptionsGetter ? this._blobOptionsGetter(k) : '';
      });
      this._blobStorage.then(blobStorage => {
        blobStorage?.signals.onBlobSyncStateChange.on(state => {
          const blobId = state.id;
          const syncState = state.state;
          if (
            syncState === BlobSyncState.Waiting ||
            syncState === BlobSyncState.Syncing
          ) {
            this.awarenessStore.setBlobState(blobId, BlobUploadState.Uploading);
            return;
          }

          if (
            syncState === BlobSyncState.Success ||
            syncState === BlobSyncState.Failed
          ) {
            this.awarenessStore.setBlobState(blobId, BlobUploadState.Uploaded);
            return;
          }
        });
      });
    } else {
      // blob storage is not reachable in server side
      this._blobStorage = Promise.resolve(null);
    }
    this.room = options.room;

    this.meta = new WorkspaceMeta('space:meta', this.doc, this.awarenessStore);

    this.signals = {
      pagesUpdated: this.meta.pagesUpdated,
      pageAdded: this.meta.pageAdded,
      pageRemoved: this.meta.pageRemoved,
    };

    this._handlePageEvent();
  }

  get connected(): boolean {
    return this._store.connected;
  }

  connect = () => {
    this._store.connect();
  };

  disconnect = () => {
    this._store.disconnect();
  };

  get awarenessStore(): AwarenessStore {
    return this._store.awarenessStore;
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

  register(blockSchema: z.infer<typeof BlockSchema>[]) {
    blockSchema.forEach(schema => {
      BlockSchema.parse(schema);
      this.flavourSchemaMap.set(schema.model.flavour, schema);
      this.flavourInitialPropsMap.set(
        schema.model.flavour,
        schema.model.props(internalPrimitives)
      );
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
    this.signals.pageAdded.on(pageId => {
      const page = new Page(
        this,
        pageId,
        this.doc,
        this.awarenessStore,
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

  search(query: QueryContent) {
    return this._indexer.search(query);
  }

  setGettingBlobOptions(blobOptionsGetter: BlobOptionsGetter) {
    this._blobOptionsGetter = blobOptionsGetter;
  }

  /**
   * @internal Only for testing
   */
  exportYDoc() {
    const binary = Y.encodeStateAsUpdate(this.doc);
    const file = new Blob([binary], { type: 'application/octet-stream' });
    const fileUrl = URL.createObjectURL(file);

    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = 'workspace.ydoc';
    link.click();

    URL.revokeObjectURL(fileUrl);
  }

  /**
   * @internal Only for testing
   */
  exportJSX(id = '0') {
    return this._store.exportJSX(id);
  }
}
