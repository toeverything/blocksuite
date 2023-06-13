import type { Awareness } from 'y-protocols/awareness';
import type * as Y from 'yjs';

export { DebugDocProvider } from './debug-provider.js';

/**
 * Different examples of providers could include webrtc sync,
 * database sync like SQLite / LevelDB, or even web IndexDB.
 *
 * Usually a class will also implement {@link DocProviderConstructor}.
 */
export interface DocBaseProvider {
  flavour: string;

  /**
   * @description
   *  Cleanup data when doc is removed.
   */
  cleanup?: () => void;
}

/**
 * @description
 * If a provider is marked as a background provider,
 *  we will connect it in the `useEffect` in React.js.
 *
 * This means that the data might be stale when you use it.
 */
export interface DocBackgroundProvider extends DocBaseProvider {
  // if this is true,
  //  we will connect the provider on the background
  background: true;
  get connected(): boolean;
  connect(): void;
  disconnect(): void;
}

/**
 * @description
 * If a provider is marked as a necessary provider,
 *  we will connect it once you read the workspace.
 *
 * This means that the data will be fresh when you use it.
 *
 * Currently, there is only one necessary provider: `local-indexeddb`.
 */
export interface DocNecessaryProvider extends DocBaseProvider {
  // if this is true,
  //  we will ensure that the provider is connected before you can use it
  necessary: true;
  sync(): void;

  /**
   * @description
   *  Each time you call `sync`, it will return a new promise instance.
   */
  get whenReady(): Promise<void>;
}

export type DocProvider = DocBackgroundProvider | DocNecessaryProvider;

export type DocProviderCreator = (
  id: string,
  doc: Y.Doc,
  options?: { awareness?: Awareness }
) => DocProvider;
