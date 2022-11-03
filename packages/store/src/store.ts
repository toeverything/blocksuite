import { PrefixedBlockProps, Space } from './space';
import { Awareness } from 'y-protocols/awareness.js';
import * as Y from 'yjs';
import type { SyncProvider, SyncProviderConstructor } from './providers';
import { serializeYDoc, yDocToJSXNode } from './utils/jsx';

export interface SerializedStore {
  page0: {
    [key: string]: PrefixedBlockProps;
  };
}

export interface StoreOptions {
  room?: string;
  providers?: SyncProviderConstructor[];
  awareness?: Awareness;
}

const DEFAULT_ROOM = 'virgo-default';

export class Store {
  readonly doc = new Y.Doc();
  readonly providers: SyncProvider[] = [];
  readonly spaces = new Map<string, Space>();

  constructor({
    room = DEFAULT_ROOM,
    providers = [],
    awareness,
  }: StoreOptions = {}) {
    const aware = awareness ?? new Awareness(this.doc);
    this.providers = providers.map(
      ProviderConstructor =>
        new ProviderConstructor(room, this.doc, { awareness: aware })
    );

    // FIXME
    this.spaces.set('page0', new Space(this.doc, aware));
  }

  // FIXME
  get space() {
    return this.spaces.get('page0') as Space;
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
