import { type Logger, NoopLogger } from '@blocksuite/global/utils';
import {
  AwarenessEngine,
  type AwarenessProvider,
  SyncEngine,
  type SyncStorage,
} from '@blocksuite/sync';
import { MemorySyncStorage } from '@blocksuite/sync/impl/memory.js';
import { merge } from 'merge';
import { Awareness } from 'y-protocols/awareness.js';

import type { BlobStorage } from '../persistence/blob/types.js';
import type { IdGenerator } from '../utils/id-generator.js';
import {
  createAutoIncrementIdGenerator,
  createAutoIncrementIdGeneratorByClientId,
  nanoid,
  uuidv4,
} from '../utils/id-generator.js';
import { AwarenessStore, type RawAwarenessState } from '../yjs/awareness.js';
import { BlockSuiteDoc } from '../yjs/index.js';
import type { Space } from './space.js';

export interface SerializedStore {
  [key: string]: {
    [key: string]: unknown;
  };
}

export enum Generator {
  /**
   * Default mode, generator for the unpredictable id
   */
  NanoID = 'nanoID',

  UUIDv4 = 'uuidV4',
  /**
   * This generator is trying to fix the real-time collaboration on debug mode.
   * This will make generator predictable and won't make conflict
   * @link https://docs.yjs.dev/api/faq#i-get-a-new-clientid-for-every-session-is-there-a-way-to-make-it-static-for-a-peer-accessing-the-doc
   */
  AutoIncrementByClientId = 'autoIncrementByClientId',
  /**
   * **Warning**: This generator mode will crash the collaborative feature
   *  if multiple clients are adding new blocks.
   * Use this mode only if you know what you're doing.
   */
  AutoIncrement = 'autoIncrement',
}

export interface StoreOptions<
  Flags extends Record<string, unknown> = BlockSuiteFlags,
> {
  id?: string;
  idGenerator?: Generator | IdGenerator;
  defaultFlags?: Partial<Flags>;
  blobStorages?: ((id: string) => BlobStorage)[];
  logger?: Logger;
  sync?: {
    main: SyncStorage;
    shared?: SyncStorage[];
  };
  awareness?: AwarenessProvider[];
}

const FLAGS_PRESET = {
  enable_legacy_validation: true,
  enable_expand_database_block: false,
  enable_bultin_ledits: false,
  readonly: {},
} satisfies BlockSuiteFlags;

export class Store {
  readonly id: string;
  readonly doc: BlockSuiteDoc;
  readonly spaces = new Map<string, Space>();
  readonly awareness: AwarenessEngine;
  readonly awarenessStore: AwarenessStore;
  readonly sync: SyncEngine;
  readonly idGenerator: IdGenerator;

  constructor(
    {
      id,
      idGenerator,
      defaultFlags,
      awareness: awarenessProviders = [],
      sync = {
        main: new MemorySyncStorage(),
      },
      logger = new NoopLogger(),
    }: StoreOptions = {
      id: nanoid(),
    }
  ) {
    this.id = id || '';
    this.doc = new BlockSuiteDoc({ guid: id });
    this.awarenessStore = new AwarenessStore(
      this,
      new Awareness<RawAwarenessState>(this.doc),
      merge(true, FLAGS_PRESET, defaultFlags)
    );
    this.awareness = new AwarenessEngine(
      this.awarenessStore.awareness,
      awarenessProviders
    );
    this.sync = new SyncEngine(this.doc, sync.main, sync.shared ?? [], logger);

    if (typeof idGenerator === 'function') {
      this.idGenerator = idGenerator;
    } else {
      switch (idGenerator) {
        case Generator.AutoIncrement: {
          this.idGenerator = createAutoIncrementIdGenerator();
          break;
        }
        case Generator.AutoIncrementByClientId: {
          this.idGenerator = createAutoIncrementIdGeneratorByClientId(
            this.doc.clientID
          );
          break;
        }
        case Generator.UUIDv4: {
          this.idGenerator = uuidv4;
          break;
        }
        case Generator.NanoID:
        default: {
          this.idGenerator = nanoid;
          break;
        }
      }
    }
  }

  addSpace(space: Space) {
    this.spaces.set(space.id, space);
  }

  removeSpace(space: Space) {
    this.spaces.delete(space.id);
  }
}
