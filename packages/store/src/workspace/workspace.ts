import { assertExists, Slot } from '@blocksuite/global/utils';
import * as Y from 'yjs';

import { AddonManager, type AddonRegistion } from '../addons/index.js';
import type { DocProviderCreator } from '../providers/type.js';
import type { Schema } from '../schema/index.js';
import type { AwarenessStore } from '../yjs/index.js';
import { blob, indexer, test, WorkspaceAddonType } from './addon/index.js';
import { type PageMeta, WorkspaceMeta } from './meta.js';
import { Page } from './page.js';
import { Store, type StoreOptions } from './store.js';

export type WorkspaceOptions = StoreOptions & {
  schema: Schema;
};

@blob
@indexer
@test
export class Workspace extends WorkspaceAddonType {
  static Y = Y;
  protected _store: Store;

  protected readonly _schema: Schema;

  meta: WorkspaceMeta;
  addons: AddonManager = new AddonManager();

  slots = {
    pagesUpdated: new Slot(),
    pageAdded: new Slot<string>(),
    pageRemoved: new Slot<string>(),
  };

  constructor(storeOptions: WorkspaceOptions) {
    super();
    this._schema = storeOptions.schema;

    this._store = new Store(storeOptions);

    this.meta = new WorkspaceMeta(this.doc);
    this._bindPageMetaEvents();
  }

  get id() {
    return this._store.id;
  }

  get isEmpty() {
    if (this.doc.store.clients.size === 0) return true;

    let flag = false;
    if (this.doc.store.clients.size === 1) {
      const items = Array.from(this.doc.store.clients.values())[0];
      // workspaceVersion and pageVersion were set when the workspace is initialized
      if (items.length <= 2) {
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

  get pages() {
    return this._store.spaces as Map<`space:${string}`, Page>;
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

  registerAddon(addon: AddonRegistion) {
    this.addons.register(addon);
  }

  registerProvider(providerCreator: DocProviderCreator, id?: string) {
    return this._store.registerProvider(providerCreator, id);
  }

  private _hasPage(pageId: string) {
    return this.pages.has(`space:${pageId}`);
  }

  getPage(pageId: string): Page | null {
    const prefixedPageId = pageId.startsWith('space:')
      ? (pageId as `space:${string}`)
      : (`space:${pageId}` as const);
    const space = this.pages.get(prefixedPageId) as Page | undefined;

    return space ?? null;
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
      this.slots.pageAdded.emit(page.id);
    });

    this.meta.pageMetasUpdated.on(() => this.slots.pagesUpdated.emit());

    this.meta.pageMetaRemoved.on(id => {
      const page = this.getPage(id) as Page;
      this._store.removeSpace(page);
      page.remove();
      this.slots.pageRemoved.emit(id);
    });
  }

  /**
   * By default, only an empty page will be created.
   * If the `init` parameter is passed, a `surface`, `note`, and `paragraph` block
   * will be created in the page simultaneously.
   */
  createPage(options: { id?: string } | string = {}) {
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

    const { id: pageId = this.idGenerator() } = options;
    if (this._hasPage(pageId)) {
      throw new Error('page already exists');
    }

    this.meta.addPageMeta({
      id: pageId,
      title: '',
      createDate: +new Date(),
      tags: [],
    });
    return this.getPage(pageId) as Page;
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
}
