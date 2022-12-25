import type { Space } from './space.js';
import type { IdGenerator } from './utils/id-generator.js';
import { Awareness } from 'y-protocols/awareness.js';
import * as Y from 'yjs';
import type { DocProvider, DocProviderConstructor } from './doc-providers.js';
import { serializeYDoc, yDocToJSXNode } from './utils/jsx.js';
import {
  createAutoIncrementIdGenerator,
  createAutoIncrementIdGeneratorByClientId,
  uuidv4,
} from './utils/id-generator.js';

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

export interface StoreOptions extends SSROptions {
  room?: string;
  providers?: DocProviderConstructor[];
  awareness?: Awareness;
  idGenerator?: Generator;
}

const DEFAULT_ROOM = 'virgo-default';

export class Store {
  readonly doc = new Y.Doc();
  readonly providers: DocProvider[] = [];
  readonly spaces = new Map<string, Space>();
  readonly awareness: Awareness;
  readonly idGenerator: IdGenerator;

  // TODO: The user cursor should be spread by the spaceId in awareness
  constructor({
    room = DEFAULT_ROOM,
    providers = [],
    awareness,
    idGenerator,
  }: StoreOptions = {}) {
    this.awareness = awareness ?? new Awareness(this.doc);
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
        new ProviderConstructor(room, this.doc, { awareness: this.awareness })
    );
  }

  addSpace(space: Space) {
    this.spaces.set(space.prefixedId, space);
  }

  removeSpace(space: Space) {
    this.spaces.delete(space.prefixedId);
  }

  /**
   * @internal Only for testing
   */
  serializeDoc() {
    return serializeYDoc(this.doc) as unknown as SerializedStore;
  }

  /**
   * @internal Only for testing, 'page0' should be replaced by props 'spaceId'
   */
  toJSXElement(id = '0') {
    const json = this.serializeDoc();
    if (!('space:page0' in json)) {
      throw new Error("Failed to convert to JSX: 'space:page0' not found");
    }
    if (!json['space:page0'][id]) {
      return null;
    }
    return yDocToJSXNode(json['space:page0'], id);
  }
}
