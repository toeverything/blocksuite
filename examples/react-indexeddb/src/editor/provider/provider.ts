import { DocCollection, type Y, Schema, BlobStorage } from '@blocksuite/store';
import { client } from './db';
import { AffineSchemas } from '@blocksuite/blocks';

export class CollectionProvider {
  collection!: DocCollection;

  static async init() {
    const hasData = await client.checkForExistingData();
    if (hasData) {
      return CollectionProvider._loadCollectionFromDb();
    } else {
      return CollectionProvider._initEmptyCollection();
    }
  }

  private static async _initEmptyCollection() {
    const provider = new CollectionProvider();
    const id = `${Math.random()}`.slice(2, 12);
    provider.collection = createCollection(id);
    provider._connectCollection();

    await client.insertRoot(id);
    createFirstDoc(provider.collection);
    return provider;
  }

  private static async _loadCollectionFromDb() {
    const provider = new CollectionProvider();
    const id = await client.getRootDocId();
    if (!id) throw new Error('No collection found in database');

    provider.collection = createCollection(id);
    await provider._applyUpdates(provider.collection.doc);

    provider.collection.docs.forEach(async doc => {
      await provider._applyUpdates(doc.spaceDoc);
      doc.load();
      provider._connectSubDoc(doc.spaceDoc);
    });

    provider._connectCollection();
    return provider;
  }

  private _connectCollection() {
    const { collection } = this;
    collection.doc.on('update', async update => {
      await client.insertUpdate(collection.id, update);
    });

    collection.doc.on('subdocs', subdocs => {
      subdocs.added.forEach((doc: Y.Doc) => {
        client.insertDoc(doc.guid, collection.id);
        this._connectSubDoc(doc);
      });
    });
  }

  private _connectSubDoc(doc: Y.Doc) {
    doc.on('update', async update => {
      client.insertUpdate(doc.guid, update);
    });
  }

  private async _applyUpdates(doc: Y.Doc) {
    const updates = await client.getUpdates(doc.guid);
    updates.forEach(update => {
      DocCollection.Y.applyUpdate(doc, update);
    });
  }
}

function createCollection(id: string): DocCollection {
  const schema = new Schema().register(AffineSchemas);
  const collection = new DocCollection({
    schema,
    id,
    blobStorages: [createBlobStorage],
  });
  return collection;
}

function createBlobStorage(): BlobStorage {
  return {
    crud: {
      set: async (key: string, value: Blob): Promise<string> => {
        await client.insertBlob(key, value);
        return key;
      },
      get: async (key: string): Promise<Blob | null> => {
        return client.getBlob(key);
      },
      delete: async (key: string): Promise<void> => {
        await client.deleteBlob(key);
      },
      list: async (): Promise<string[]> => {
        return client.getAllBlobIds();
      },
    },
  };
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

export const provider = await CollectionProvider.init();
// @ts-expect-error dev
window.provider = provider;
