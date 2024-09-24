import type { BlockSuiteFlags } from '@blocksuite/global/types';

import { BlockSuiteError, ErrorCode } from '@blocksuite/global/exceptions';
import { type Logger, NoopLogger, Slot } from '@blocksuite/global/utils';
import {
  AwarenessEngine,
  type AwarenessSource,
  BlobEngine,
  type BlobSource,
  DocEngine,
  type DocSource,
  MemoryBlobSource,
  NoopDocSource,
} from '@blocksuite/sync';
import clonedeep from 'lodash.clonedeep';
import merge from 'lodash.merge';
import { Awareness } from 'y-protocols/awareness.js';
import * as Y from 'yjs';

import type { Schema } from '../schema/index.js';
import type { IdGenerator } from '../utils/id-generator.js';
import type { Doc, Query } from './doc/index.js';
import type { IdGeneratorType } from './id.js';

import {
  AwarenessStore,
  BlockSuiteDoc,
  type RawAwarenessState,
} from '../yjs/index.js';
import { DocCollectionAddonType, test } from './addon/index.js';
import { BlockCollection, type GetDocOptions } from './doc/block-collection.js';
import { pickIdGenerator } from './id.js';
import { DocCollectionMeta, type DocMeta } from './meta.js';

export type DocCollectionOptions = {
  schema: Schema;
  id?: string;
  idGenerator?: IdGeneratorType | IdGenerator;
  defaultFlags?: Partial<BlockSuiteFlags>;
  logger?: Logger;
  docSources?: {
    main: DocSource;
    shadows?: DocSource[];
  };
  blobSources?: {
    main: BlobSource;
    shadows?: BlobSource[];
  };
  awarenessSources?: AwarenessSource[];
};

const FLAGS_PRESET = {
  enable_synced_doc_block: false,
  enable_pie_menu: false,
  enable_database_number_formatting: false,
  enable_database_attachment_note: false,
  enable_database_full_width: false,
  enable_legacy_validation: true,
  enable_block_query: false,
  enable_lasso_tool: false,
  enable_edgeless_text: true,
  enable_ai_onboarding: false,
  enable_ai_chat_block: false,
  enable_color_picker: false,
  enable_mind_map_import: false,
  enable_advanced_block_visibility: false,
  readonly: {},
} satisfies BlockSuiteFlags;

export interface StackItem {
  meta: Map<'cursor-location' | 'selection-state', unknown>;
}

@test
export class DocCollection extends DocCollectionAddonType {
  static Y = Y;

  protected readonly _schema: Schema;

  readonly awarenessStore: AwarenessStore;

  readonly awarenessSync: AwarenessEngine;

  readonly blobSync: BlobEngine;

  readonly blockCollections = new Map<string, BlockCollection>();

  readonly doc: BlockSuiteDoc;

  readonly docSync: DocEngine;

  readonly id: string;

  readonly idGenerator: IdGenerator;

  meta: DocCollectionMeta;

  slots = {
    docAdded: new Slot<string>(),
    docUpdated: new Slot(),
    docRemoved: new Slot<string>(),
    docCreated: new Slot<string>(),
  };

  get docs() {
    return this.blockCollections;
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

  constructor({
    id,
    schema,
    idGenerator,
    defaultFlags,
    awarenessSources = [],
    docSources = {
      main: new NoopDocSource(),
    },
    blobSources = {
      main: new MemoryBlobSource(),
    },
    logger = new NoopLogger(),
  }: DocCollectionOptions) {
    super();
    this._schema = schema;

    this.id = id || '';
    this.doc = new BlockSuiteDoc({ guid: id });
    this.awarenessStore = new AwarenessStore(
      new Awareness<RawAwarenessState>(this.doc),
      merge(clonedeep(FLAGS_PRESET), defaultFlags)
    );

    this.awarenessSync = new AwarenessEngine(
      this.awarenessStore.awareness,
      awarenessSources
    );
    this.docSync = new DocEngine(
      this.doc,
      docSources.main,
      docSources.shadows ?? [],
      logger
    );
    this.blobSync = new BlobEngine(
      blobSources.main,
      blobSources.shadows ?? [],
      logger
    );

    this.idGenerator = pickIdGenerator(idGenerator, this.doc.clientID);

    this.meta = new DocCollectionMeta(this.doc);
    this._bindDocMetaEvents();
  }

  private _bindDocMetaEvents() {
    this.meta.docMetaAdded.on(docId => {
      const doc = new BlockCollection({
        id: docId,
        collection: this,
        doc: this.doc,
        awarenessStore: this.awarenessStore,
        idGenerator: this.idGenerator,
      });
      this.blockCollections.set(doc.id, doc);
      this.slots.docAdded.emit(doc.id);
    });

    this.meta.docMetaUpdated.on(() => this.slots.docUpdated.emit());

    this.meta.docMetaRemoved.on(id => {
      const space = this.getBlockCollection(id);
      if (!space) return;
      this.blockCollections.delete(id);
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
  createDoc(options: { id?: string; query?: Query } = {}) {
    const { id: docId = this.idGenerator(), query } = options;
    if (this._hasDoc(docId)) {
      throw new BlockSuiteError(
        ErrorCode.DocCollectionError,
        'doc already exists'
      );
    }

    this.meta.addDocMeta({
      id: docId,
      title: '',
      createDate: Date.now(),
      tags: [],
    });
    this.slots.docCreated.emit(docId);
    return this.getDoc(docId, { query }) as Doc;
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
    if (!docMeta) {
      throw new BlockSuiteError(
        ErrorCode.DocCollectionError,
        `doc meta not found: ${docId}`
      );
    }

    const blockCollection = this.getBlockCollection(docId);
    if (!blockCollection) return;

    blockCollection.dispose();
    this.meta.removeDocMeta(docId);
    this.blockCollections.delete(docId);
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
}
