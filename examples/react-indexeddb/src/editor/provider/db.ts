import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'react-indexeddb';
const DB_VERSION = 1;
const DOCS_STORE = 'docs';
const UPDATES_STORE = 'updates';
const BLOBS_STORE = 'blobs';

export class IndexedDBClient {
  private dbPromise: Promise<IDBPDatabase>;

  constructor() {
    this.dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(DOCS_STORE)) {
          db.createObjectStore(DOCS_STORE, { keyPath: 'doc_id' });
        }
        if (!db.objectStoreNames.contains(UPDATES_STORE)) {
          const store = db.createObjectStore(UPDATES_STORE, {
            autoIncrement: true,
          });
          store.createIndex('doc_id', 'doc_id', { unique: false });
        }
        if (!db.objectStoreNames.contains(BLOBS_STORE)) {
          db.createObjectStore(BLOBS_STORE, { keyPath: 'blob_id' });
        }
      },
    });
  }

  async insertRoot(rootId: string) {
    const db = await this.dbPromise;
    const tx = db.transaction(DOCS_STORE, 'readwrite');
    await tx.store.add({ doc_id: rootId, root_doc_id: null });
    await tx.done;
  }

  async insertDoc(docId: string, rootId: string) {
    const db = await this.dbPromise;
    const tx = db.transaction(DOCS_STORE, 'readwrite');
    await tx.store.add({ doc_id: docId, root_doc_id: rootId });
    await tx.done;
  }

  async insertUpdate(docId: string, updateData: Uint8Array) {
    const db = await this.dbPromise;
    const tx = db.transaction(UPDATES_STORE, 'readwrite');
    await tx.store.add({ doc_id: docId, data: updateData });
    await tx.done;
  }

  async insertBlob(blobId: string, blobData: Blob) {
    const db = await this.dbPromise;
    const tx = db.transaction(BLOBS_STORE, 'readwrite');
    await tx.store.add({ blob_id: blobId, blob_data: blobData });
    await tx.done;
  }

  async getBlob(blobId: string): Promise<Blob | null> {
    const db = await this.dbPromise;
    const blob = await db.get(BLOBS_STORE, blobId);
    return blob ? blob.blob_data : null;
  }

  async deleteBlob(blobId: string): Promise<void> {
    const db = await this.dbPromise;
    await db.delete(BLOBS_STORE, blobId);
  }

  async getAllBlobIds(): Promise<string[]> {
    const db = await this.dbPromise;
    const blobs = await db.getAllKeys(BLOBS_STORE);
    return blobs.map(key => String(key));
  }

  async getUpdates(docId: string): Promise<Uint8Array[]> {
    const db = await this.dbPromise;
    const tx = db.transaction(UPDATES_STORE, 'readonly');
    const store = tx.store;
    const index = store.index('doc_id');
    const updates = await index.getAll(IDBKeyRange.only(docId));
    await tx.done;
    return updates.map(update => update.data);
  }

  async getRootDocId(): Promise<string | null> {
    const db = await this.dbPromise;
    const docs = await db.getAll(DOCS_STORE);
    const rootDoc = docs.find(doc => !doc.root_doc_id);
    return rootDoc ? rootDoc.doc_id : null;
  }

  async checkForExistingData(): Promise<boolean> {
    const db = await this.dbPromise;
    const count = await db.count(DOCS_STORE);
    return count > 0;
  }
}

export const client = new IndexedDBClient();
