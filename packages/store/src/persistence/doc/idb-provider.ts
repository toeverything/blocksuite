import * as Y from 'yjs';
import * as idb from 'lib0/indexeddb.js';
import { Observable } from 'lib0/observable.js';
import type { DocProvider } from './index.js';

const customStoreName = 'custom';
const updatesStoreName = 'updates';

const PREFERRED_TRIM_SIZE = 500;

async function fetchUpdates(
  idbPersistence: IndexedDBPersistence,
  beforeApplyUpdatesCallback: (store: IDBObjectStore) => void = () => {
    void 0;
  }
) {
  if (!idbPersistence.db) {
    throw new Error('idbPersistence.db is null');
  }

  const [updatesStore] = idb.transact(idbPersistence.db, [updatesStoreName]);
  const updates = await idb.getAll(
    updatesStore,
    idb.createIDBKeyRangeLowerBound(idbPersistence._dbref, false)
  );

  beforeApplyUpdatesCallback(updatesStore);
  Y.transact(
    idbPersistence.doc,
    () => {
      updates.forEach(val => Y.applyUpdate(idbPersistence.doc, val));
    },
    idbPersistence,
    false
  );

  const lastKey = await idb.getLastKey(updatesStore);
  idbPersistence._dbref = lastKey + 1;

  const cnt = await idb.count(updatesStore);
  idbPersistence._dbsize = cnt;

  return updatesStore;
}

async function storeState(
  idbPersistence: IndexedDBPersistence,
  forceStore = true
) {
  const updatesStore = await fetchUpdates(idbPersistence);

  if (forceStore || idbPersistence._dbsize >= PREFERRED_TRIM_SIZE) {
    idb
      .addAutoKey(updatesStore, Y.encodeStateAsUpdate(idbPersistence.doc))
      .then(() =>
        idb.del(
          updatesStore,
          idb.createIDBKeyRangeUpperBound(idbPersistence._dbref, true)
        )
      )
      .then(() =>
        idb.count(updatesStore).then(cnt => {
          idbPersistence._dbsize = cnt;
        })
      );
  }
}

class IndexedDBPersistence extends Observable<string> {
  doc: Y.Doc;
  name: string;
  _dbref = 0;
  _dbsize = 0;
  _destroyed = false;
  db: IDBDatabase | null;
  synced = false;
  _db: Promise<IDBDatabase>;
  whenSynced: Promise<IndexedDBPersistence>;
  /**
   * Timeout in ms untill data is merged and persisted in idb.
   */
  _storeTimeout = 1000;

  _storeTimeoutId: ReturnType<typeof setTimeout> | null;
  _storeUpdate: (update: Uint8Array, origin: this) => void;
  constructor(name: string, doc: Y.Doc) {
    super();
    this.doc = doc;
    this.name = name;
    /**
     * @type {IDBDatabase|null}
     */
    this.db = null;
    this._db = idb.openDB(name, db =>
      idb.createStores(db, [['updates', { autoIncrement: true }], ['custom']])
    );
    /**
     * @type {Promise<IndexedDBPersistence>}
     */
    this.whenSynced = this._db.then(db => {
      this.db = db;
      const beforeApplyUpdatesCallback = (updatesStore: IDBObjectStore) =>
        idb.addAutoKey(updatesStore, Y.encodeStateAsUpdate(doc));
      return fetchUpdates(this, beforeApplyUpdatesCallback).then(() => {
        if (this._destroyed) return this;
        this.emit('synced', [this]);
        this.synced = true;
        return this;
      });
    });
    this._storeTimeout = 1000;
    this._storeTimeoutId = null;
    this._storeUpdate = (update, origin) => {
      if (this.db && origin !== this) {
        const [updatesStore] = idb.transact(
          /** @type {IDBDatabase} */ this.db,
          [updatesStoreName]
        );
        idb.addAutoKey(updatesStore, update);
        if (++this._dbsize >= PREFERRED_TRIM_SIZE) {
          // debounce store call
          if (this._storeTimeoutId !== null) {
            clearTimeout(this._storeTimeoutId);
          }
          this._storeTimeoutId = setTimeout(() => {
            storeState(this, false);
            this._storeTimeoutId = null;
          }, this._storeTimeout);
        }
      }
    };
    doc.on('update', this._storeUpdate);
    this.destroy = this.destroy.bind(this);
    doc.on('destroy', this.destroy);
  }

  async destroy() {
    if (this._storeTimeoutId) {
      clearTimeout(this._storeTimeoutId);
    }
    this.doc.off('update', this._storeUpdate);
    this.doc.off('destroy', this.destroy);
    this._destroyed = true;

    const db = await this._db;
    db.close();
  }

  /**
   * Destroys this instance and removes all data from indexeddb.
   */
  async clearData() {
    await this.destroy();
    await idb.deleteDB(this.name);
  }

  async get(key: string | number | ArrayBuffer | Date) {
    const db = await this._db;
    const [custom] = idb.transact(db, [customStoreName], 'readonly');
    return idb.get(custom, key);
  }

  async set(
    key: string | number | ArrayBuffer | Date,
    value: string | number | ArrayBuffer | Date
  ) {
    const db = await this._db;
    const [custom] = idb.transact(db, [customStoreName]);
    return idb.put(custom, value, key);
  }

  async del(key: string | number | ArrayBuffer | Date) {
    const db = await this._db;
    const [custom] = idb.transact(db, [customStoreName]);
    return idb.del(custom, key);
  }
}

export class IndexedDBDocProvider
  extends IndexedDBPersistence
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
