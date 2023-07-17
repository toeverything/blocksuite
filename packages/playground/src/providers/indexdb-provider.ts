import type { Y } from '@blocksuite/store';
import type { PassiveDocProvider } from '@blocksuite/store';
import {
  createIndexedDBProvider,
  type IndexedDBProvider,
} from '@toeverything/y-indexeddb';

export const INDEXED_DB_NAME = 'PLAYGROUND_DB';

export class IndexedDBProviderWrapper implements PassiveDocProvider {
  public readonly flavour = 'blocksuite-indexeddb';
  public readonly passive = true as const;
  private _connected = false;
  #provider: IndexedDBProvider;
  constructor(id: string, doc: Y.Doc) {
    this.#provider = createIndexedDBProvider(id, doc, INDEXED_DB_NAME);
  }
  connect() {
    this.#provider.connect();
    this._connected = true;
  }
  disconnect() {
    this.#provider.disconnect();
    this._connected = false;
  }
  get connected() {
    return this._connected;
  }
}
