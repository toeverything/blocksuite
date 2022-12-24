import * as Y from 'yjs';
import * as idb from 'lib0/indexeddb.js';
import { Observable } from 'lib0/observable.js';

const customStoreName = 'custom';
const updatesStoreName = 'updates';

export const PREFERRED_TRIM_SIZE = 500;

export const fetchUpdates = (
  idbPersistence: IndexeddbPersistence,
  beforeApplyUpdatesCallback: (store: IDBObjectStore) => void = () => {
    void 0;
  }
) => {
  if (!idbPersistence.db) {
    throw new Error('idbPersistence.db is null');
  }
  const [updatesStore] = idb.transact(idbPersistence.db, [updatesStoreName]); // , 'readonly')
  return idb
    .getAll(
      updatesStore,
      idb.createIDBKeyRangeLowerBound(idbPersistence._dbref, false)
    )
    .then(updates => {
      beforeApplyUpdatesCallback(updatesStore);
      Y.transact(
        idbPersistence.doc,
        () => {
          updates.forEach(val => Y.applyUpdate(idbPersistence.doc, val));
        },
        idbPersistence,
        false
      );
    })
    .then(() =>
      idb.getLastKey(updatesStore).then(lastKey => {
        idbPersistence._dbref = lastKey + 1;
      })
    )
    .then(() =>
      idb.count(updatesStore).then(cnt => {
        idbPersistence._dbsize = cnt;
      })
    )
    .then(() => updatesStore);
};

export const storeState = (
  idbPersistence: IndexeddbPersistence,
  forceStore = true
) =>
  fetchUpdates(idbPersistence).then(updatesStore => {
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
  });

export const clearDocument = (name: string) => idb.deleteDB(name);

export class IndexeddbPersistence extends Observable<string> {
  doc: Y.Doc;
  name: string;
  _dbref = 0;
  _dbsize = 0;
  _destroyed = false;
  db: IDBDatabase | null;
  synced = false;
  _db: Promise<IDBDatabase>;
  whenSynced: Promise<IndexeddbPersistence>;
  /**
   * Timeout in ms untill data is merged and persisted in idb.
   */
  _storeTimeout = 1000;

  _storeTimeoutId: ReturnType<typeof setTimeout> | null;
  _storeUpdate: (update: Uint8Array, origin: any) => void;
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
     * @type {Promise<IndexeddbPersistence>}
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

  destroy() {
    if (this._storeTimeoutId) {
      clearTimeout(this._storeTimeoutId);
    }
    this.doc.off('update', this._storeUpdate);
    this.doc.off('destroy', this.destroy);
    this._destroyed = true;
    return this._db.then(db => {
      db.close();
    });
  }

  /**
   * Destroys this instance and removes all data from indexeddb.
   *
   * @return {Promise<void>}
   */
  clearData() {
    return this.destroy().then(() => {
      idb.deleteDB(this.name);
    });
  }

  get(key: string | number | ArrayBuffer | Date) {
    return this._db.then(db => {
      const [custom] = idb.transact(db, [customStoreName], 'readonly');
      return idb.get(custom, key);
    });
  }

  set(
    key: string | number | ArrayBuffer | Date,
    value: string | number | ArrayBuffer | Date
  ) {
    return this._db.then(db => {
      const [custom] = idb.transact(db, [customStoreName]);
      return idb.put(custom, value, key);
    });
  }

  del(key: string | number | ArrayBuffer | Date) {
    return this._db.then(db => {
      const [custom] = idb.transact(db, [customStoreName]);
      return idb.del(custom, key);
    });
  }
}
