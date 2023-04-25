import { assertExists, Slot } from '@blocksuite/global/utils';
import * as Y from 'yjs';
import type { z } from 'zod';

import type { AwarenessStore } from '../awareness.js';
import type { BlockSchemaType } from '../base.js';
import { BlockSchema } from '../base.js';
import { createMemoryStorage } from '../persistence/blob/memory-storage.js';
import type { BlobManager, BlobStorage } from '../persistence/blob/types.js';
import { sha } from '../persistence/blob/utils.js';
import {
  type InlineSuggestionProvider,
  Store,
  type StoreOptions,
} from '../store.js';
import { BacklinkIndexer } from './indexer/backlink.js';
import { BlockIndexer } from './indexer/base.js';
import { normalizeSubpage } from './indexer/normalize-subpage.js';
import { type QueryContent, SearchIndexer } from './indexer/search.js';
import { type PageMeta, WorkspaceMeta } from './meta.js';
import { Page } from './page.js';

export type WorkspaceOptions = {
  experimentalInlineSuggestionProvider?: InlineSuggestionProvider;
} & StoreOptions;

export class Workspace {
  static Y = Y;

  private _store: Store;
  private readonly _storages: BlobStorage[] = [];
  private readonly _blobStorage: BlobManager;

  meta: WorkspaceMeta;

  slots = {
    pagesUpdated: new Slot(),
    pageAdded: new Slot<string>(),
    pageRemoved: new Slot<string>(),
    // call this when a blob is updated, deleted or created
    //  workspace will update re-fetch the blob and update the page
    blobUpdate: new Slot<void>(),
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

    this._storages = (storeOptions.blobStorages ?? [createMemoryStorage]).map(
      fn => fn(storeOptions.id)
    );

    this._blobStorage = {
      get: async id => {
        let found = false;
        let count = 0;
        return new Promise(res => {
          this._storages.forEach(storage =>
            storage.crud
              .get(id)
              .then(result => {
                if (result && !found) {
                  found = true;
                  res(result);
                }
                if (++count === this._storages.length && !found) {
                  res(null);
                }
              })
              .catch(e => {
                console.error(e);
                if (++count === this._storages.length && !found) {
                  res(null);
                }
              })
          );
        });
      },
      set: async value => {
        const key = await sha(await value.arrayBuffer());
        await Promise.all(this._storages.map(s => s.crud.set(key, value)));
        return key;
      },
      delete: async key => {
        await Promise.all(this._storages.map(s => s.crud.delete(key)));
      },
      list: async () => {
        const keys = new Set<string>();
        await Promise.all(
          this._storages.map(async s => {
            const list = await s.crud.list();
            list.forEach(key => keys.add(key));
          })
        );
        return Array.from(keys);
      },
    };

    this.meta = new WorkspaceMeta('space:meta', this.doc, this.awarenessStore);
    this._bindPageMetaEvents();

    const blockIndexer = new BlockIndexer(this.doc, { slots: this.slots });
    const backlinkIndexer = new BacklinkIndexer(blockIndexer);
    this.indexer = {
      search: new SearchIndexer(this.doc),
      backlink: backlinkIndexer,
    };
    backlinkIndexer.slots.indexUpdated.on(e => {
      normalizeSubpage(e, this, backlinkIndexer);
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

  createPage(pageId: string) {
    if (this._hasPage(pageId)) {
      throw new Error('page already exists');
    }

    this.meta.addPageMeta({
      id: pageId,
      title: '',
      createDate: +new Date(),
      subpageIds: [],
    });
    return this.getPage(pageId) as Page;
  }

  /** Update page meta state. Note that this intentionally does not mutate page state. */
  setPageMeta(
    pageId: string,
    // You should not update subpageIds directly.
    props: Partial<PageMeta & { subpageIds: never }>
  ) {
    this.meta.setPageMeta(pageId, props);
  }

  /**
   * @deprecated
   */
  shiftPage(pageId: string, newIndex: number) {
    this.meta.shiftPageMeta(pageId, newIndex);
  }

  removePage(pageId: string) {
    const pageMeta = this.meta.getPageMeta(pageId);
    assertExists(pageMeta);

    if (pageMeta.subpageIds.length) {
      // remove subpages first
      pageMeta.subpageIds.forEach((subpageId: string) => {
        if (subpageId === pageId) {
          console.error(
            'Unexpected subpage found when remove page! A page cannot be its own subpage',
            pageMeta
          );
          return;
        }
        this.removePage(subpageId);
      });
    }

    const page = this.getPage(pageId);
    if (!page) return;

    page.dispose();
    this.indexer.backlink.removeSubpageNode(this, pageId);
    this.meta.removePageMeta(pageId);
    this._store.removeSpace(page);
  }

  search(query: QueryContent) {
    return this.indexer.search.search(query);
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
