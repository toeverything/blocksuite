import type * as Y from 'yjs';
import type { Awareness } from 'y-protocols/awareness';

export { DebugDocProvider } from './debug-provider.js';
export { IndexedDBDocProvider } from './idb-provider.js';

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
