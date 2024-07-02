import { DocCollection, type Y, Schema } from '@blocksuite/store';
import { type BlobSource } from '@blocksuite/sync';
import { Database } from 'sql.js';
import { client } from './db';
import { AffineSchemas } from '@blocksuite/blocks';

function createCollection(db: Database, id: string) {
  class ClientBlobSource implements BlobSource {
    readonly = false;
    name = 'client';

    async get(key: string) {
      return client.getBlob(db, key);
    }

    async set(key: string, value: Blob) {
      await client.insertBlob(db, key, value);
      return key;
    }

    async delete(key: string) {
      return client.deleteBlob(db, key);
    }

    async list() {
      return client.getAllBlobIds(db);
    }
  }

  const schema = new Schema().register(AffineSchemas);

  const collection = new DocCollection({
    schema,
    id,
    blobSources: {
      main: new ClientBlobSource(),
    },
  });
  return collection;
}

function createFirstDoc(collection: DocCollection) {
  const doc = collection.createDoc();
  doc.load(() => {
    const pageBlockId = doc.addBlock('affine:page', {});
    doc.addBlock('affine:surface', {}, pageBlockId);
    const noteId = doc.addBlock('affine:note', {}, pageBlockId);
    doc.addBlock('affine:paragraph', {}, noteId);
  });
  doc.resetHistory();
}

export class CollectionProvider {
  collection!: DocCollection;

  private constructor(private db: Database) {}

  static async init(binary?: Blob) {
    let db: Database;

    if (binary) {
      const data = new Uint8Array(await binary.arrayBuffer());
      db = await client.initDbFromBinary(data);
      return CollectionProvider._loadCollectionFromDb(db);
    } else {
      db = await client.initEmptyDb();
      return CollectionProvider._initEmptyCollection(db);
    }
  }

  async export() {
    return new Blob([this.db.export()]);
  }

  private static _initEmptyCollection(db: Database) {
    const provider = new CollectionProvider(db);
    const id = `${Math.random()}`.slice(2, 12);
    provider.collection = createCollection(db, id);
    provider._connectCollection();
    provider.collection.meta.initialize();

    client.insertRoot(db, id);
    createFirstDoc(provider.collection);
    return provider;
  }

  private static _loadCollectionFromDb(db: Database) {
    const provider = new CollectionProvider(db);
    const id = client.getRootDocId(db);
    if (!id) throw new Error('No collection found in database');

    provider.collection = createCollection(db, id);
    provider._applyUpdates(provider.collection.doc);
    provider.collection.docs.forEach(doc => {
      provider._applyUpdates(doc.spaceDoc);
      doc.load();
      provider._connectSubDoc(doc.spaceDoc);
    });

    provider._connectCollection();
    return provider;
  }

  private _connectCollection() {
    const { collection, db } = this;
    collection.doc.on('update', update => {
      client.insertUpdate(db, collection.id, update);
    });

    collection.doc.on('subdocs', subdocs => {
      subdocs.added.forEach((doc: Y.Doc) => {
        client.insertDoc(db, doc.guid, collection.id);
        this._connectSubDoc(doc);
      });
    });
  }

  private _connectSubDoc(doc: Y.Doc) {
    const { db } = this;
    doc.on('update', async update => {
      client.insertUpdate(db, doc.guid, update);
    });
  }

  private _applyUpdates(doc: Y.Doc) {
    const updates = client.getUpdates(this.db, doc.guid);
    updates.forEach(update => {
      DocCollection.Y.applyUpdate(doc, update);
    });
  }
}
