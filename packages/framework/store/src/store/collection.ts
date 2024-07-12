import { Slot, assertExists } from '@blocksuite/global/utils';
import * as Y from 'yjs';

import type { Schema } from '../schema/index.js';
import type { AwarenessStore } from '../yjs/index.js';
import type { BlockSelector, Doc } from './doc/index.js';

import { DocCollectionAddonType, indexer, test } from './addon/index.js';
import { BlockCollection, type GetDocOptions } from './doc/block-collection.js';
import { DocCollectionMeta, type DocMeta } from './meta.js';
import { Store, type StoreOptions } from './store.js';

export type DocCollectionOptions = {
  schema: Schema;
} & StoreOptions;

@indexer
@test
export class DocCollection extends DocCollectionAddonType {
  static Y = Y;

  protected readonly _schema: Schema;

  protected _store: Store;

  meta: DocCollectionMeta;

  slots = {
    docAdded: new Slot<string>(),
    docRemoved: new Slot<string>(),
    docUpdated: new Slot(),
  };

  constructor(options: DocCollectionOptions) {
    super();
    this._schema = options.schema;

    this._store = new Store(options);

    this.meta = new DocCollectionMeta(this.doc);
    this._bindDocMetaEvents();
  }

  private _bindDocMetaEvents() {
    this.meta.docMetaAdded.on(docId => {
      const doc = new BlockCollection({
        awarenessStore: this.awarenessStore,
        collection: this,
        doc: this.doc,
        id: docId,
        idGenerator: this._store.idGenerator,
      });
      this._store.addSpace(doc);
      this.slots.docAdded.emit(doc.id);
    });

    this.meta.docMetaUpdated.on(() => this.slots.docUpdated.emit());

    this.meta.docMetaRemoved.on(id => {
      const space = this.getBlockCollection(id);
      if (!space) return;
      this._store.removeSpace(space);
      space.remove();
      this.slots.docRemoved.emit(id);
    });
  }

  private _hasDoc(docId: string) {
    return this.docs.has(docId);
  }

  /**
   * Verify that all data has been successfully saved to the primary storage.
   * Return true if the data transfer is complete and it is secure to terminate the synchronization operation.
   */
  canGracefulStop() {
    this.docSync.canGracefulStop();
  }

  /**
   * By default, only an empty doc will be created.
   * If the `init` parameter is passed, a `surface`, `note`, and `paragraph` block
   * will be created in the doc simultaneously.
   */
  createDoc(options: { id?: string; selector?: BlockSelector } = {}) {
    const { id: docId = this.idGenerator(), selector } = options;
    if (this._hasDoc(docId)) {
      throw new Error('doc already exists');
    }

    this.meta.addDocMeta({
      createDate: Date.now(),
      id: docId,
      tags: [],
      title: '',
    });
    return this.getDoc(docId, { selector }) as Doc;
  }

  /**
   * Terminate the data sync process forcefully, which may cause data loss.
   * It is advised to invoke `canGracefulStop` before calling this method.
   */
  forceStop() {
    this.docSync.forceStop();
    this.blobSync.stop();
    this.awarenessSync.disconnect();
  }

  getBlockCollection(docId: string): BlockCollection | null {
    const space = this.docs.get(docId) as BlockCollection | undefined;
    return space ?? null;
  }

  getDoc(docId: string, options?: GetDocOptions): Doc | null {
    const collection = this.getBlockCollection(docId);
    return collection?.getDoc(options) ?? null;
  }

  removeDoc(docId: string) {
    const docMeta = this.meta.getDocMeta(docId);
    assertExists(docMeta);

    const blockCollection = this.getBlockCollection(docId);
    if (!blockCollection) return;

    blockCollection.dispose();
    this.meta.removeDocMeta(docId);
    this._store.removeSpace(blockCollection);
  }

  /** Update doc meta state. Note that this intentionally does not mutate doc state. */
  setDocMeta(
    docId: string,
    // You should not update subDocIds directly.
    props: Partial<DocMeta>
  ) {
    this.meta.setDocMeta(docId, props);
  }

  /**
   * Start the data sync process
   */
  start() {
    this.docSync.start();
    this.blobSync.start();
    this.awarenessSync.connect();
  }

  /**
   * Wait for all data has been successfully saved to the primary storage.
   */
  waitForGracefulStop(abort?: AbortSignal) {
    return this.docSync.waitForGracefulStop(abort);
  }

  waitForSynced() {
    return this.docSync.waitForSynced();
  }

  get awarenessStore(): AwarenessStore {
    return this._store.awarenessStore;
  }

  get awarenessSync() {
    return this.store.awarenessSync;
  }

  get blobSync() {
    return this.store.blobSync;
  }

  get doc() {
    return this._store.doc;
  }

  get docSync() {
    return this.store.docSync;
  }

  get docs() {
    return this._store.spaces as Map<string, BlockCollection>;
  }

  get id() {
    return this._store.id;
  }

  get idGenerator() {
    return this._store.idGenerator;
  }

  get isEmpty() {
    if (this.doc.store.clients.size === 0) return true;

    let flag = false;
    if (this.doc.store.clients.size === 1) {
      const items = Array.from(this.doc.store.clients.values())[0];
      // workspaceVersion and pageVersion were set when the collection is initialized
      if (items.length <= 2) {
        flag = true;
      }
    }
    return flag;
  }

  get schema() {
    return this._schema;
  }

  get store(): Store {
    return this._store;
  }
}
