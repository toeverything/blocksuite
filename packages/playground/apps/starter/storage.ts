import type { PassiveDocProvider, Y } from '@blocksuite/store';
import type { IndexedDBProvider } from '@toeverything/y-indexeddb';
import { createIndexedDBProvider } from '@toeverything/y-indexeddb';

export class IndexedDBProviderWrapper implements PassiveDocProvider {
  public readonly flavour = 'blocksuite-indexeddb';
  public readonly passive = true as const;
  private _connected = false;
  private _provider: IndexedDBProvider;
  constructor(doc: Y.Doc) {
    this._provider = createIndexedDBProvider(doc);
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
