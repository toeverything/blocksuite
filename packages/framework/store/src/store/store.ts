import { type Logger, NoopLogger } from '@blocksuite/global/utils';
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
import { merge } from 'merge';
import { Awareness } from 'y-protocols/awareness.js';

import type { IdGenerator } from '../utils/id-generator.js';
import type { BlockCollection } from './doc/index.js';
import type { Generator } from './id.js';

import { nanoid } from '../utils/id-generator.js';
import { AwarenessStore, type RawAwarenessState } from '../yjs/awareness.js';
import { BlockSuiteDoc } from '../yjs/index.js';
import { pickIdGenerator } from './id.js';

export type SerializedStore = Record<string, Record<string, unknown>>;

export interface StoreOptions<
  Flags extends Record<string, unknown> = BlockSuiteFlags,
> {
  id?: string;
  idGenerator?: Generator | IdGenerator;
  defaultFlags?: Partial<Flags>;
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
  disableSearchIndex?: boolean;
  disableBacklinkIndex?: boolean;
}

const FLAGS_PRESET = {
  enable_synced_doc_block: false,
  enable_pie_menu: false,
  enable_database_number_formatting: false,
  enable_database_statistics: false,
  enable_database_attachment_note: false,
  enable_legacy_validation: true,
  enable_expand_database_block: false,
  enable_block_query: false,
  enable_lasso_tool: false,
  enable_edgeless_text: true,
  enable_ai_onboarding: false,
  readonly: {},
} satisfies BlockSuiteFlags;

export interface StackItem {
  meta: Map<'cursor-location' | 'selection-state', unknown>;
}

export class Store {
  readonly awarenessStore: AwarenessStore;

  readonly awarenessSync: AwarenessEngine;

  readonly blobSync: BlobEngine;

  readonly doc: BlockSuiteDoc;

  readonly docSync: DocEngine;

  readonly id: string;

  readonly idGenerator: IdGenerator;

  readonly spaces = new Map<string, BlockCollection>();

  constructor(
    {
      id,
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
    }: StoreOptions = {
      id: nanoid(),
    }
  ) {
    this.id = id || '';
    this.doc = new BlockSuiteDoc({ guid: id });
    this.awarenessStore = new AwarenessStore(
      new Awareness<RawAwarenessState>(this.doc),
      merge(true, FLAGS_PRESET, defaultFlags)
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
  }

  addSpace(blockCollection: BlockCollection) {
    this.spaces.set(blockCollection.id, blockCollection);
  }

  removeSpace(blockCollection: BlockCollection) {
    this.spaces.delete(blockCollection.id);
  }
}
