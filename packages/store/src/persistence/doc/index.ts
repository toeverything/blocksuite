import type { Awareness } from 'y-protocols/awareness';
import type * as Y from 'yjs';

export { DebugDocProvider } from './debug-provider.js';

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
    id: string,
    doc: Y.Doc,
    options?: { awareness?: Awareness }
  ): DocProvider;
}
