import { assertExists, Slot } from '@blocksuite/global/utils';
import * as Y from 'yjs';
import type { z } from 'zod';

import type { AwarenessStore } from '../awareness.js';
import { BlobUploadState } from '../awareness.js';
import { BlockSchema, internalPrimitives } from '../base.js';
import type { BlobStorage } from '../persistence/blob/index.js';
import {
  type BlobOptionsGetter,
  BlobSyncState,
  getBlobStorage,
} from '../persistence/blob/index.js';
import { Space } from '../space.js';
import { Store, type StoreOptions } from '../store.js';
import type { BlockSuiteDoc } from '../yjs/index.js';
import { Page } from './page.js';
import { Indexer, type QueryContent } from './search.js';

export interface PageMeta {
  id: string;
  title: string;
  createDate: number;
  subPageIds: string[];

  [key: string]: string | number | boolean | undefined | (string | number)[];
}

type WorkspaceMetaState = {
  pages?: Y.Array<unknown>;
  versions?: Y.Map<unknown>;
  name?: string;
  avatar?: string;
};

class WorkspaceMeta extends Space<WorkspaceMetaState> {
  private _prevPages = new Set<string>();
  pageMetaAdded = new Slot<string>();
  pageMetaRemoved = new Slot<string>();
  pageMetasUpdated = new Slot();
  commonFieldsUpdated = new Slot();

  constructor(id: string, doc: BlockSuiteDoc, awarenessStore: AwarenessStore) {
    super(id, doc, awarenessStore);
    this._ySpace.observeDeep(this._handleWorkspaceMetaEvents);
  }

  get pages() {
    return this._proxy.pages;
  }

  get name() {
    return this._proxy.name;
  }

  get avatar() {
    return this._proxy.avatar;
  }

  setName(name: string) {
    this.doc.transact(() => {
      this._proxy.name = name;
    });
  }

  setAvatar(avatar: string) {
    this.doc.transact(() => {
      this._proxy.avatar = avatar;
    });
  }

  get pageMetas() {
    return this._proxy.pages?.toJSON() ?? ([] as PageMeta[]);
  }

  getPageMeta(id: string) {
    return this.pageMetas.find(page => page.id === id);
  }

  addPageMeta(page: PageMeta, index?: number) {
    const yPage = new Y.Map();
    this.doc.transact(() => {
      const pages: Y.Array<unknown> = this.pages ?? new Y.Array();
      Object.entries(page).forEach(([key, value]) => {
        yPage.set(key, value);
      });
      if (index === undefined) {
        pages.push([yPage]);
      } else {
        pages.insert(index, [yPage]);
      }
      if (!this.pages) {
        this._ySpace.set('pages', pages);
      }
    });
  }

  setPageMeta(id: string, props: Partial<PageMeta>) {
    const pages = (this.pages?.toJSON() as PageMeta[]) ?? [];
    const index = pages.findIndex((page: PageMeta) => id === page.id);

    this.doc.transact(() => {
      if (!this.pages) {
        this._ySpace.set('pages', new Y.Array());
      }
      if (index === -1) return;
      assertExists(this.pages);

      const yPage = this.pages.get(index) as Y.Map<unknown>;
      Object.entries(props).forEach(([key, value]) => {
        yPage.set(key, value);
      });
    });
  }

  removePageMeta(id: string) {
    // you cannot delete a page if there's no page
    assertExists(this.pages);
    const pageMetas = this.pages.toJSON() as PageMeta[];
    const index = pageMetas.findIndex((page: PageMeta) => id === page.id);
    if (index === -1) {
      return;
    }
    this.doc.transact(() => {
      assertExists(this.pages);
      this.pages.delete(index, 1);
    });
  }

  /**
   * @internal Only for page initialization
   */
  writeVersion(workspace: Workspace) {
    let versions = this._proxy.versions;
    if (!versions) {
      versions = new Y.Map<unknown>();
      workspace.flavourSchemaMap.forEach((schema, flavour) => {
        (versions as Y.Map<unknown>).set(flavour, schema.version);
      });
      this._ySpace.set('versions', versions);
      return;
    } else {
      console.error('Workspace versions already set.');
    }
  }

  /**
   * @internal Only for page initialization
   */
  validateVersion(workspace: Workspace) {
    const versions = this._proxy.versions?.toJSON();
    if (!versions) {
      throw new Error(
        'Invalid workspace data, versions data is missing. Please make sure the data is valid'
      );
    }
    const dataFlavours = Object.keys(versions);
    // TODO: emit data validation error slots
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

  private _handlePageMetaEvent() {
    const { pageMetas, _prevPages } = this;

    pageMetas.forEach(pageMeta => {
      // newly added space can't be found
      // unless explictly getMap after meta updated
      this.doc.getMap('space:' + pageMeta.id);

      if (!_prevPages.has(pageMeta.id)) {
        this.pageMetaAdded.emit(pageMeta.id);
      }
    });

    _prevPages.forEach(prevPageId => {
      const isRemoved = !pageMetas.find(p => p.id === prevPageId);
      if (isRemoved) {
        this.pageMetaRemoved.emit(prevPageId);
      }
    });

    _prevPages.clear();
    pageMetas.forEach(page => _prevPages.add(page.id));

    this.pageMetasUpdated.emit();
  }

  private _handleCommonFieldsEvent() {
    this.commonFieldsUpdated.emit();
  }

  private _handleWorkspaceMetaEvents = (
    events: Y.YEvent<Y.Array<unknown> | Y.Text | Y.Map<unknown>>[]
  ) => {
    events.forEach(e => {
      const hasKey = (k: string) =>
        e.target === this._ySpace && e.changes.keys.has(k);

      if (
        e.target === this.pages ||
        e.target.parent === this.pages ||
        hasKey('pages')
      ) {
        this._handlePageMetaEvent();
      }

      if (hasKey('name') || hasKey('avatar')) {
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
  private _blobOptionsGetter?: BlobOptionsGetter = (k: string) =>
    ({ api: '/api/workspace' }[k]);

  meta: WorkspaceMeta;

  slots = {
    pagesUpdated: new Slot(),
    pageAdded: new Slot<string>(),
    pageRemoved: new Slot<string>(),
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
      this._blobStorage = getBlobStorage(options.id, k => {
        return this._blobOptionsGetter ? this._blobOptionsGetter(k) : '';
      });
      this._initBlobStorage();
    } else {
      // blob storage is not reachable in server side
      this._blobStorage = Promise.resolve(null);
    }

    this.meta = new WorkspaceMeta('space:meta', this.doc, this.awarenessStore);
    this._bindPageMetaEvents();

    this.slots.pageAdded.on(id => {
      // For potentially batch-added blocks, it's best to build index asynchronously
      queueMicrotask(() => this._indexer.onPageCreated(id));
    });
  }

  get id() {
    return this._store.id;
  }

  get connected(): boolean {
    return this._store.connected;
  }

  get isEmpty() {
    if (this.doc.store.clients.size === 0) return true;

    let flag = false;
    if (this.doc.store.clients.size === 1) {
      const items = [...this.doc.store.clients.values()][0];
      if (items.length <= 1) {
        flag = true;
      }
    }
    return flag;
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

    return this._pages.get(pageId) ?? null;
  }

  private _initBlobStorage() {
    this._blobStorage.then(blobStorage => {
      blobStorage?.slots.onBlobSyncStateChange.on(state => {
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
  }

  private _bindPageMetaEvents() {
    this.meta.pageMetaAdded.on(pageId => {
      const page = new Page(
        this,
        pageId,
        this.doc,
        this.awarenessStore,
        this._store.idGenerator
      );
      this._store.addSpace(page);
      page.trySyncFromExistingDoc();
    });

    this.meta.pageMetasUpdated.on(() => this.slots.pagesUpdated.emit());

    this.meta.pageMetaRemoved.on(id => {
      const page = this.getPage(id) as Page;
      page.dispose();
      this._store.removeSpace(page);
      this.slots.pageRemoved.emit(id);
      // TODO remove page from indexer
    });
  }

  createPage(pageId: string, parentId?: string) {
    if (this._hasPage(pageId)) {
      throw new Error('page already exists');
    }
    if (parentId && !this._hasPage(parentId)) {
      throw new Error('parent page not found');
    }

    this.meta.addPageMeta({
      id: pageId,
      title: '',
      createDate: +new Date(),
      subPageIds: [],
    });

    if (parentId) {
      const parentPage = this.getPage(parentId) as Page;
      const parentPageMeta = this.meta.getPageMeta(parentId);
      const subPageIds = [...parentPageMeta.subPageIds, pageId];
      this.setPageMeta(parentId, {
        subPageIds,
      });

      parentPage.slots.subPageUpdate.emit({
        type: 'add',
        id: pageId,
        subPageIds,
      });
    }

    return this.getPage(pageId) as Page;
  }

  /** Update page meta state. Note that this intentionally does not mutate page state. */
  setPageMeta(pageId: string, props: Partial<PageMeta>) {
    this.meta.setPageMeta(pageId, props);
  }

  removePage(pageId: string) {
    const pageMeta = this.meta.getPageMeta(pageId);
    const parentId = this.meta.pageMetas.find(meta =>
      meta.subPageIds.includes(pageId)
    ).id;

    if (parentId) {
      const parentPageMeta = this.meta.getPageMeta(parentId);
      const parentPage = this.getPage(parentId) as Page;
      const subPageIds = parentPageMeta.subPageIds.filter(
        (subPageId: string) => subPageId !== pageMeta.id
      );
      this.setPageMeta(parentPage.id, {
        subPageIds,
      });
      parentPage.slots.subPageUpdate.emit({
        type: 'delete',
        id: pageId,
        subPageIds,
      });
    }

    const page = this.getPage(pageId);
    if (!page) return;

    page.dispose();
    this.meta.removePageMeta(pageId);
    this._store.removeSpace(page);
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
