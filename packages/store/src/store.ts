import { PrefixedBlockProps, Space } from './space';
import type { IdGenerator } from './utils/id-generator';
import { Awareness } from 'y-protocols/awareness.js';
import * as Y from 'yjs';
import type { SyncProvider, SyncProviderConstructor } from './providers';
import { serializeYDoc, yDocToJSXNode } from './utils/jsx';
import { uuidv4 } from './utils/id-generator';

export interface SerializedStore {
  page0: {
    [key: string]: PrefixedBlockProps;
  };
}

export interface StoreOptions {
  room?: string;
  providers?: SyncProviderConstructor[];
  awareness?: Awareness;
  idGenerator?: IdGenerator;
}

const DEFAULT_ROOM = 'virgo-default';

export class Store {
  readonly doc = new Y.Doc();
  readonly providers: SyncProvider[] = [];
  readonly spaces = new Map<string, Space>();
  readonly awareness: Awareness;
  readonly idGenerator: IdGenerator;
  constructor({
    room = DEFAULT_ROOM,
    providers = [],
    awareness,
    idGenerator,
  }: StoreOptions = {}) {
    this.awareness = awareness ?? new Awareness(this.doc);
    this.idGenerator = idGenerator ?? uuidv4;
    this.providers = providers.map(
      ProviderConstructor =>
        new ProviderConstructor(room, this.doc, { awareness: this.awareness })
    );
  }

  getSpace(spaceId: string) {
    return this.spaces.get(spaceId) as Space;
  }

  // TODO: The user cursor should be spread by the spaceId in awareness
  createSpace(spaceId: string) {
    this.spaces.set(
      spaceId,
      new Space(this.doc, this.awareness, this.idGenerator)
    );
    return this.getSpace(spaceId);
  }

  /**
   * @internal Only for testing at now
   */
  serializeDoc() {
    return serializeYDoc(this.doc) as unknown as SerializedStore;
  }

  /**
   * @internal Only for testing at now
   */
  toJSXElement(id = '0') {
    const json = this.serializeDoc();
    if (!('page0' in json)) {
      throw new Error("Failed to convert to JSX: 'page0' not found");
    }
    if (!json.page0[id]) {
      return null;
    }
    return yDocToJSXNode(json.page0, id);
  }
}
