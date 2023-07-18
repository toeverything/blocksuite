import type { Awareness } from 'y-protocols/awareness';
import type * as Y from 'yjs';

/**
 * Different examples of providers could include broadcast channel,
 * database like SQLite, LevelDB or IndexedDB.
 * Usually a provider will also implement {@link DocProviderCreator}.
 */
export interface BaseDocProvider {
  flavour: string;

  /**
   * @description
   * Cleanup data when doc is removed.
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
   * Each time you call `sync`, it will return a new promise instance.
   */
  get whenReady(): Promise<void>;
}

/**
 * @description
 * If a provider is marked as lazy, it's supposed to be connected when you use it.
 * This means that the data will be fresh before you use it.
 *
 * Unlike other providers, lazy providers connection/disconnection is fine-tuned to each doc and
 * optimized for subdoc.
 *
 * A typical implementation would be
 * - get the subdoc in the doc hierarchy
 * - maintain a hidden reference count for the subdoc
 *  - when the reference count is 1, connect the subdoc
 *    - sync the subdoc with the datasource
 *    - setup listeners for the subdoc. On update, push the update to the datasource
 *    - setup listeners for the datasource. On update, push the update to the subdoc
 *  - when the reference count is 0, disconnect the subdoc
 *    - remove listeners for the subdoc
 */
export interface LazyDocProvider extends BaseDocProvider {
  lazy: true;
  connect(guid: string): void;
  disconnect(guid: string): void;
}

export type DocProvider =
  | PassiveDocProvider
  | ActiveDocProvider
  | LazyDocProvider;

export type DocProviderCreator = (
  id: string,
  doc: Y.Doc,
  options: { awareness: Awareness }
) => DocProvider;

export interface DatasourceDocAdapter {
  // request diff update from other clients
  queryDocState: (
    guid: string,
    options?: {
      stateVector?: Uint8Array;
      targetClientId?: number;
    }
  ) => Promise<Uint8Array | false>;

  // send update to other clients
  sendDocUpdate: (guid: string, update: Uint8Array) => Promise<void>;

  // listen to update from other clients. Returns a function to unsubscribe.
  // this is optional because some datasource might not support it
  onDocUpdate?(
    callback: (guid: string, update: Uint8Array) => void
  ): () => void;
}

export interface DatasourceAwarenessAdapter {
  // request awareness from other clients
  queryAwareness: () => Promise<Uint8Array>;

  // send awareness to other clients
  sendAwareness: (awarenessUpdate: Uint8Array) => Promise<void>;
}

// TODO: make also need a DatasourceStorageAdapter
