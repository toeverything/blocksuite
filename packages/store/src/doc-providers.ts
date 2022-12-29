import type * as Y from 'yjs';
// @ts-ignore
import { WebrtcProvider } from 'y-webrtc';
import { IndexeddbPersistence } from './providers/indexeddb.js';
import type { Awareness } from 'y-protocols/awareness';

/**
 * Different examples of providers could include webrtc sync,
 * database sync like SQLite / LevelDB, or even web IndexDB.
 *
 * Usually a class will also implement {@link DocProviderConstructor}.
 */
export interface DocProvider {
  awareness?: Awareness;
  connect?: () => void;
  disconnect?: () => void;
  clearData?: () => Promise<void>;
  destroy?: () => void;
}

/** See {@link DocProvider} */
export interface DocProviderConstructor {
  new (
    room: string,
    doc: Y.Doc,
    options?: { awareness?: Awareness }
  ): DocProvider;
}

// When using playground from blocksuite repo, this comes from "serve" script in "@blocksuite/store" package.
// We use our own sync server because a local service for sync makes everything much faster for dev.
const LOCAL_SIGNALING = ['ws://localhost:4444'];

const DEFAULT_SIGNALING = [
  // Default config from yjs (but these are kinda slow by comparison to self host sync ~100ms-+1000ms latency observed).
  // This slowness is also avoided in order to improve test reliability in CI.
  'wss://y-webrtc-signaling-us.herokuapp.com',
  'wss://y-webrtc-signaling-eu.herokuapp.com',
];

const isWeb = typeof window !== 'undefined';
const isLocalhost = isWeb && window.location.hostname === 'localhost';
const signaling = isLocalhost ? LOCAL_SIGNALING : DEFAULT_SIGNALING;

export class DebugDocProvider extends WebrtcProvider implements DocProvider {
  constructor(room: string, doc: Y.Doc, options?: { awareness?: Awareness }) {
    super(room, doc, {
      awareness: options?.awareness ?? null,
      signaling,
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

export class IndexedDBDocProvider
  extends IndexeddbPersistence
  implements DocProvider
{
  constructor(room: string, doc: Y.Doc) {
    super(room, doc);
  }

  // Consider whether "connect" and "disconnect" are good to put on the SyncProvider
  connect() {
    // not necessary as it will be set up in indexeddb persistence
  }

  disconnect() {
    // not necessary as it will be set up in indexeddb persistence
  }

  public clearData() {
    // Do nothing for now
    return Promise.resolve();
  }
}
