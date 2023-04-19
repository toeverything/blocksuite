import { assertExists, Slot } from '@blocksuite/global/utils';
import * as Y from 'yjs';
import type { z } from 'zod';

import type { AwarenessStore } from '../awareness.js';
import { BlobUploadState } from '../awareness.js';
import type { BlockSchemaType } from '../base.js';
import { BlockSchema } from '../base.js';
import type { BlobStorage } from '../persistence/blob/index.js';
import {
  type BlobOptionsGetter,
  BlobSyncState,
  getBlobStorage,
} from '../persistence/blob/index.js';
import {
  type InlineSuggestionProvider,
  Store,
  type StoreOptions,
} from '../store.js';
import { BacklinkIndexer } from './indexer/backlink.js';
import { BlockIndexer } from './indexer/base.js';
import { reviseSubpage } from './indexer/revise-subpage.js';
import { type QueryContent, SearchIndexer } from './indexer/search.js';
import { type PageMeta, WorkspaceMeta } from './meta.js';
import { Page } from './page.js';

export type WorkspaceOptions = {
  experimentalInlineSuggestionProvider?: InlineSuggestionProvider;
} & StoreOptions;

export class Workspace {
  static Y = Y;

  private _store: Store;
  private readonly _blobStorage: Promise<BlobStorage | null>;
  private _blobOptionsGetter?: BlobOptionsGetter = (k: string) =>
    ({ api: '/api/workspace' }[k]);

  meta: WorkspaceMeta;

  slots = {
    pagesUpdated: new Slot(),
    pageAdded: new Slot<string>(),
    pageRemoved: new Slot<string>(),
  };

  indexer: {
    search: SearchIndexer;
    backlink: BacklinkIndexer;
  };

  flavourSchemaMap = new Map<string, z.infer<typeof BlockSchema>>();

  readonly inlineSuggestionProvider?: InlineSuggestionProvider;

  constructor({
    experimentalInlineSuggestionProvider,
    ...storeOptions
  }: WorkspaceOptions) {
    this.inlineSuggestionProvider = experimentalInlineSuggestionProvider;
    this._store = new Store(storeOptions);
    if (storeOptions.blobOptionsGetter) {
      this._blobOptionsGetter = storeOptions.blobOptionsGetter;
    }

    if (!storeOptions.isSSR) {
      this._blobStorage = getBlobStorage(storeOptions.id, k => {
        return this._blobOptionsGetter ? this._blobOptionsGetter(k) : '';
      });
      this._initBlobStorage();
    } else {
      // blob storage is not reachable in server side
      this._blobStorage = Promise.resolve(null);
    }

    this.meta = new WorkspaceMeta('space:meta', this.doc, this.awarenessStore);
    this._bindPageMetaEvents();

    const blockIndexer = new BlockIndexer(this.doc, { slots: this.slots });
    const backlinkIndexer = new BacklinkIndexer(blockIndexer);
    this.indexer = {
      search: new SearchIndexer(this.doc),
      backlink: backlinkIndexer,
    };
    backlinkIndexer.slots.indexUpdated.on(e => {
      reviseSubpage(e, this, backlinkIndexer);
    });

    // TODO use BlockIndexer
    this.slots.pageAdded.on(id => {
      // For potentially batch-added blocks, it's best to build index asynchronously
      queueMicrotask(() => this.indexer.search.onPageCreated(id));
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
    return this._store.spaces as Map<`space:${string}`, Page>;
  }

  get doc() {
    return this._store.doc;
  }

  get idGenerator() {
    return this._store.idGenerator;
  }

  register(blockSchema: BlockSchemaType[]) {
    blockSchema.forEach(schema => {
      BlockSchema.parse(schema);
      this.flavourSchemaMap.set(schema.model.flavour, schema);
    });
    return this;
  }

  private _hasPage(pageId: string) {
    return this._pages.has(`space:${pageId}`);
  }

  getPage(pageId: string): Page | null {
    const prefixedPageId = pageId.startsWith('space:')
      ? (pageId as `space:${string}`)
      : (`space:${pageId}` as const);

    return this._pages.get(prefixedPageId) ?? null;
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
      const page = new Page({
        id: pageId,
        workspace: this,
        doc: this.doc,
        awarenessStore: this.awarenessStore,
        idGenerator: this._store.idGenerator,
      });
      this._store.addSpace(page);
      page.trySyncFromExistingDoc();
    });

    this.meta.pageMetasUpdated.on(() => this.slots.pagesUpdated.emit());

    this.meta.pageMetaRemoved.on(id => {
      const page = this.getPage(id) as Page;
      this._store.removeSpace(page);
      this.slots.pageRemoved.emit(id);
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
      subpageIds: [],
    });

    if (parentId) {
      const parentPage = this.getPage(parentId) as Page;
      const parentPageMeta = this.meta.getPageMeta(parentId);
      assertExists(parentPageMeta);
      // Compatibility process: the old data not has `subpageIds`, it should be an empty array
      const subpageIds = [...(parentPageMeta.subpageIds ?? []), pageId];

      this.setPageMeta(parentId, {
        subpageIds,
      });

      parentPage.slots.subpageUpdated.emit({
        type: 'add',
        id: pageId,
        subpageIds,
      });
    }

    return this.getPage(pageId) as Page;
  }

  /** Update page meta state. Note that this intentionally does not mutate page state. */
  setPageMeta(pageId: string, props: Partial<PageMeta>) {
    this.meta.setPageMeta(pageId, props);
  }

  shiftPage(pageId: string, newIndex: number) {
    this.meta.shiftPageMeta(pageId, newIndex);
  }

  removePage(pageId: string) {
    const pageMeta = this.meta.getPageMeta(pageId);
    assertExists(pageMeta);
    const parentId = this.meta.pageMetas.find(meta =>
      meta.subpageIds.includes(pageId)
    )?.id;

    if (pageMeta.subpageIds?.length) {
      pageMeta.subpageIds.forEach((subpageId: string) => {
        this.removePage(subpageId);
      });
    }

    if (parentId) {
      const parentPageMeta = this.meta.getPageMeta(parentId);
      assertExists(parentPageMeta);
      const parentPage = this.getPage(parentId) as Page;
      const subpageIds = parentPageMeta.subpageIds.filter(
        (subpageId: string) => subpageId !== pageMeta.id
      );
      this.setPageMeta(parentPage.id, {
        subpageIds,
      });
      parentPage.slots.subpageUpdated.emit({
        type: 'delete',
        id: pageId,
        subpageIds,
      });
    }

    const page = this.getPage(pageId);
    if (!page) return;

    page.dispose();
    this.meta.removePageMeta(pageId);
    this._store.removeSpace(page);
  }

  search(query: QueryContent) {
    return this.indexer.search.search(query);
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
  exportJSX(blockId?: string, pageId = this.meta.pageMetas.at(0)?.id) {
    assertExists(pageId);
    return this._store.exportJSX(pageId, blockId);
  }
}
