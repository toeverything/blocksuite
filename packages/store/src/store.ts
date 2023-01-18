import type { Space } from './space.js';
import type { IdGenerator } from './utils/id-generator.js';
import { Awareness } from 'y-protocols/awareness.js';
import type { DocProvider, DocProviderConstructor } from './doc-providers.js';
import { serializeYDoc, yDocToJSXNode } from './utils/jsx.js';
import {
  createAutoIncrementIdGenerator,
  createAutoIncrementIdGeneratorByClientId,
  uuidv4,
} from './utils/id-generator.js';
import { merge } from 'merge';
import { BlockSuiteDoc } from './yjs/index.js';
import { AwarenessAdapter, AwarenessState } from './awareness.js';
import type { GetBlobOptions } from './blob/index.js';

export interface SerializedStore {
  [key: string]: {
    [key: string]: unknown;
  };
}

export enum Generator {
  /**
   * Default mode, generator for the unpredictable id
   */
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

/**
 * @example
 *  const workspace = new Workspace({
 *    isSSR: typeof window === 'undefined'
 *  })
 */
export interface SSROptions {
  isSSR?: boolean;
}

export interface StoreOptions<
  Flags extends Record<string, unknown> = BlockSuiteFlags
> extends SSROptions {
  room?: string;
  providers?: DocProviderConstructor[];
  awareness?: Awareness<AwarenessState<Flags>>;
  idGenerator?: Generator;
  defaultFlags?: Partial<Flags>;
  getBlobOptions?: GetBlobOptions;
}

const DEFAULT_ROOM = 'virgo-default';

const flagsPreset = {
  enable_set_remote_flag: true,
  enable_drag_handle: true,
  enable_surface: false,
  enable_block_hub: false,
  readonly: {},
} satisfies BlockSuiteFlags;

export class Store {
  readonly doc = new BlockSuiteDoc();
  readonly providers: DocProvider[] = [];
  readonly spaces = new Map<string, Space>();
  readonly awarenessAdapter: AwarenessAdapter;
  readonly idGenerator: IdGenerator;

  // TODO: The user cursor should be spread by the spaceId in awareness
  constructor({
    room = DEFAULT_ROOM,
    providers = [],
    awareness,
    idGenerator,
    defaultFlags,
  }: StoreOptions = {}) {
    this.awarenessAdapter = new AwarenessAdapter(
      this,
      awareness ?? new Awareness<AwarenessState>(this.doc),
      merge(flagsPreset, defaultFlags)
    );
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
      case Generator.UUIDv4:
      default: {
        this.idGenerator = uuidv4;
        break;
      }
    }
    this.providers = providers.map(
      ProviderConstructor =>
        new ProviderConstructor(room, this.doc, {
          // @ts-expect-error
          awareness: this.awarenessAdapter.awareness,
        })
    );
  }

  addSpace(space: Space) {
    this.spaces.set(space.prefixedId, space);
  }

  removeSpace(space: Space) {
    this.spaces.delete(space.prefixedId);
  }

  /**
   * @internal Only for testing, 'page0' should be replaced by props 'spaceId'
   */
  exportJSX(id = '0') {
    const json = serializeYDoc(this.doc) as unknown as SerializedStore;
    if (!('space:page0' in json)) {
      throw new Error("Failed to convert to JSX: 'space:page0' not found");
    }
    if (!json['space:page0'][id]) {
      return null;
    }
    return yDocToJSXNode(json['space:page0'], id);
  }
}
