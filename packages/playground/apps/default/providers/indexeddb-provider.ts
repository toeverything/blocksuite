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
  private _provider: IndexedDBProvider;
  constructor(doc: Y.Doc) {
    this._provider = createIndexedDBProvider(doc, INDEXED_DB_NAME);
  }
  connect() {
    this._provider.connect();
    this._connected = true;
  }
  disconnect() {
    this._provider.disconnect();
    this._connected = false;
  }
  get connected() {
    return this._connected;
  }
}
