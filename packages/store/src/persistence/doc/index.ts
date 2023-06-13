import type { Awareness } from 'y-protocols/awareness';
import type * as Y from 'yjs';

export { DebugDocProvider } from './debug-provider.js';

/**
 * Different examples of providers could include webrtc sync,
 * database sync like SQLite / LevelDB, or even web IndexDB.
 *
 * Usually a provider will also implement {@link DocProviderCreator}.
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
 *  it supposed to be connected in the background
 *
 * This means that the data might be stale when you use it.
 */
export interface DocBackgroundProvider extends DocBaseProvider {
  background: true;
  get connected(): boolean;
  connect(): void;
  disconnect(): void;
}

/**
 * @description
 * If a provider is marked as a necessary provider,
 *  it supposed to be connected before you can use it.
 *
 * This means that the data will be fresh before you use it.
 */
export interface DocNecessaryProvider extends DocBaseProvider {
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
