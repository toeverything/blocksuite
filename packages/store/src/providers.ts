import type * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
// In the future, consider making y-indexdb a separate package sync provider.
import { IndexeddbPersistence } from 'y-indexeddb';
import type { Awareness } from 'y-protocols/awareness';
import type { BlobStorage } from './blob-storage/blob-storage-types';
import { IndexedDBBlobStorage } from './blob-storage/indexeddb-blob-storage';

/**
 * Different examples of providers could include webrtc sync,
 * database sync like SQLite / LevelDB, or even web IndexedDB.
 *
 * Usually a class will also implement {@link SyncProviderConstructor}.
 */
export interface SyncProvider {
  awareness?: Awareness;
  /**
   * Each {@link SyncProvider} is essentially used as a mirror in practice, so for now,
   * the easiest approach is to simply enable every sync provider to provide their own
   * separate blob storage option.
   */
  blobStorage?: BlobStorage;
  connect: () => void;
  disconnect: () => void;
  clearData: () => Promise<void>;
  destroy: () => void;
}

/** See {@link SyncProvider} */
export interface SyncProviderConstructor {
  new (
    room: string,
    ydoc: Y.Doc,
    options?: { awareness?: Awareness }
  ): SyncProvider;
}

export class DebugProvider extends WebrtcProvider implements SyncProvider {
  constructor(room: string, doc: Y.Doc, options?: { awareness?: Awareness }) {
    super(room, doc, {
      awareness: options?.awareness ?? null,
      signaling: [
        // When using playground from blocksuite repo, this comes from "serve" script in "@blocksuite/store" package.
        // We use our own sync server because a local service for sync makes everything much faster for dev.
        'ws://localhost:4444',
        // // Default config from yjs (but these are kinda slow by comparison to self host sync ~100ms-+1000ms latency observed).
        // // This slowness is also avoided in order to improve test reliability in CI.
        // 'wss://y-webrtc-signaling-us.herokuapp.com',
        // 'wss://y-webrtc-signaling-eu.herokuapp.com',
      ],
      // YJS has broken default types. 🥲
      ...({} as {
        // calling each one of these null to make TypeScript happy, because YJS is wrong.
        filterBcConns: null;
        maxConns: null;
        password: null;
        peerOpts: null;
      }),
    });
  }

  public clearData() {
    // Do nothing for now
    return Promise.resolve();
  }
}

export class IndexedDBProvider
  extends IndexeddbPersistence
  implements SyncProvider
{
  blobStorage: BlobStorage;
  constructor(room: string, doc: Y.Doc, options?: { awareness?: Awareness }) {
    super(room, doc);
    console.log({ name: this.name });
    this.blobStorage = new IndexedDBBlobStorage({
      objectName: 'blobs',
      databaseName: this.name,
    });
  }

  // Consider whether "connect" and "disconnect" are good to put on the SyncProvider
  // Or: At least document what these mean to us, as opposed to us just simply calling
  // the interface `YJSProvider`.
  connect() {
    // not necessary as it will be set up in indexdb persistence
    // Question: I don't understand, why wouldn't we want to call super.connect()?
  }

  disconnect() {
    // not necessary as it will be set up in indexdb persistence
    // Question: I don't understand, why wouldn't we want to call super.disconnect()?
  }

  public clearData() {
    // Do nothing for now
    // Question: I don't understand, why wouldn't we want to call super.clearData()?
    return Promise.resolve();
  }
}
