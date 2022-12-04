import type { Space } from './space';
import type { IdGenerator } from './utils/id-generator';
import { Awareness } from 'y-protocols/awareness.js';
import * as Y from 'yjs';
import type { DocProvider, DocProviderConstructor } from './doc-providers';
import { serializeYDoc, yDocToJSXNode } from './utils/jsx';
import { uuidv4 } from './utils/id-generator';

export interface SerializedStore {
  [key: string]: {
    [key: string]: unknown;
  };
}

export interface StoreOptions {
  room?: string;
  providers?: DocProviderConstructor[];
  awareness?: Awareness;
  idGenerator?: IdGenerator;
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
    this.idGenerator = idGenerator ?? uuidv4;
    this.providers = providers.map(
      ProviderConstructor =>
        new ProviderConstructor(room, this.doc, { awareness: this.awareness })
    );
  }

  addSpace(space: Space) {
    this.spaces.set(space.id, space);
  }

  removeSpace(space: Space) {
    this.spaces.delete(space.id);
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
