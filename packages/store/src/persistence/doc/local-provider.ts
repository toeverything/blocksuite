import { createIndexedDBProvider } from 'affine-next-y-indexeddb';

import type { Y } from '../../index.js';
import type { DocProvider } from './index.js';

export class IndexedDBDocProvider implements DocProvider {
  private _provider: ReturnType<typeof createIndexedDBProvider>;
  constructor(id: string, doc: Y.Doc) {
    this._provider = createIndexedDBProvider(id, doc, 'blocksuite-local');
  }
  connect() {
    this._provider.connect();
    return this._provider.whenSynced;
  }
  disconnect() {
    return this._provider.disconnect();
  }
}
