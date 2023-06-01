import { assertExists, Slot } from '@blocksuite/global/utils';
import * as Y from 'yjs';

import type { AwarenessStore } from '../awareness.js';
import type { BlockSchemaType } from '../base.js';
import { BlockSchema } from '../base.js';
import { createMemoryStorage } from '../persistence/blob/memory-storage.js';
import type { BlobManager, BlobStorage } from '../persistence/blob/types.js';
import { sha } from '../persistence/blob/utils.js';
import { Store, type StoreOptions } from '../store.js';
import { BacklinkIndexer } from './indexer/backlink.js';
import { BlockIndexer } from './indexer/base.js';
import type { QueryContent } from './indexer/search.js';
import { SearchIndexer } from './indexer/search.js';
import { type PageMeta, WorkspaceMeta } from './meta.js';
import { Page } from './page.js';
import { Schema } from './schema.js';

export type WorkspaceOptions = StoreOptions;

export class Workspace {
  static Y = Y;

  private _store: Store;

  private readonly _schema: Schema;
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

  constructor(storeOptions: WorkspaceOptions) {
    this._schema = new Schema(this);

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

    this.meta = new WorkspaceMeta(this.doc);
    this._bindPageMetaEvents();

    const blockIndexer = new BlockIndexer(this.doc, { slots: this.slots });
    this.indexer = {
      search: new SearchIndexer(this.doc),
      backlink: new BacklinkIndexer(blockIndexer),
    };
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

  public getPageNameList() {
    return [...this._pages.keys()];
  }

  get doc() {
    return this._store.doc;
  }

  get idGenerator() {
    return this._store.idGenerator;
  }

  get schema() {
    return this._schema;
  }

  register(blockSchema: BlockSchemaType[]) {
    blockSchema.forEach(schema => {
      BlockSchema.parse(schema);
      this.schema.flavourSchemaMap.set(schema.model.flavour, schema);
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

  /**
   * By default, only an empty page will be created.
   * If the `init` parameter is passed, a `surface`, `frame`, and `paragraph` block
   * will be created in the page simultaneously.
   */
  createPage(
    options: { id?: string; init?: true | { title: string } } | string = {}
  ) {
    // Migration guide
    if (typeof options === 'string') {
      options = { id: options };
      console.warn(
        '`createPage(pageId)` is deprecated, use `createPage()` directly or `createPage({ id: pageId })` instead'
      );
      console.warn(
        'More details see https://github.com/toeverything/blocksuite/pull/2272'
      );
    }
    // End of migration guide. Remove this in the next major version

    const { id: pageId = this.idGenerator(), init } = options;
    if (this._hasPage(pageId)) {
      throw new Error('page already exists');
    }

    this.meta.addPageMeta({
      id: pageId,
      title: '',
      createDate: +new Date(),
    });
    const page = this.getPage(pageId) as Page;

    let pageBlockId = pageId;
    if (init) {
      pageBlockId = page.addBlock(
        'affine:page',
        typeof init === 'boolean'
          ? undefined
          : {
              title: new page.Text(init.title),
            }
      );
      page.addBlock('affine:surface', {}, pageBlockId);
      const frameId = page.addBlock('affine:frame', {}, pageBlockId);
      page.addBlock('affine:paragraph', {}, frameId);
    }
    return page;
  }

  /** Update page meta state. Note that this intentionally does not mutate page state. */
  setPageMeta(
    pageId: string,
    // You should not update subpageIds directly.
    props: Partial<PageMeta>
  ) {
    this.meta.setPageMeta(pageId, props);
  }

  removePage(pageId: string) {
    const pageMeta = this.meta.getPageMeta(pageId);
    assertExists(pageMeta);

    const page = this.getPage(pageId);
    if (!page) return;

    page.dispose();
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
  importYDoc(): Promise<void> {
    return new Promise((res, rej) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.ydoc';
      input.multiple = false;
      input.onchange = async () => {
        const file = input.files?.item(0);
        if (!file) {
          return rej();
        }
        const buffer = await file.arrayBuffer();
        Y.applyUpdate(this.doc, new Uint8Array(buffer));
        res();
      };
      input.onerror = rej;
      input.click();
    });
  }

  /**
   * @internal Only for testing
   */
  exportJSX(blockId?: string, pageId = this.meta.pageMetas.at(0)?.id) {
    assertExists(pageId);
    return this._store.exportJSX(pageId, blockId);
  }
}
