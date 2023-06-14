import type { Awareness } from 'y-protocols/awareness';
import type * as Y from 'yjs';

export { DebugDocProvider } from './debug-provider.js';

/**
 * Different examples of providers could include webrtc sync,
 * database sync like SQLite, LevelDB or IndexedDB.
 * Usually a provider will also implement {@link DocProviderCreator}.
 */
export interface BaseDocProvider {
  flavour: string;

  /**
   * @description
   *  Cleanup data when doc is removed.
   */
  cleanup?: () => void;
}

/**
 * @description
 * If a provider is marked as passive, it's supposed to be connected in the background.
 * This means that the data might be stale when you use it.
 */
export interface PassiveDocProvider extends BaseDocProvider {
  passive: true;
  get connected(): boolean;
  connect(): void;
  disconnect(): void;
}

/**
 * @description
 * If a provider is marked as active, it's supposed to be connected before you can use it.
 * This means that the data will be fresh before you use it.
 */
export interface ActiveDocProvider extends BaseDocProvider {
  active: true;
  sync(): void;

  /**
   * @description
   *  Each time you call `sync`, it will return a new promise instance.
   */
  get whenReady(): Promise<void>;
}

export type DocProvider = PassiveDocProvider | ActiveDocProvider;

export type DocProviderCreator = (
  id: string,
  doc: Y.Doc,
  options?: { awareness?: Awareness }
) => DocProvider;
