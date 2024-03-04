import { Workspace, Y, Schema, BlobStorage } from '@blocksuite/store';
import { Database } from 'sql.js';
import {
  getRootDocId,
  getUpdatesFromDoc,
  isTableEmpty,
  insertDocToDb,
  insertUpdateToDb,
  insertBlobToDb,
  getBlobFromDb,
  deleteBlobFromDb,
  getAllBlobIds,
  initEmptyDb,
  loadDb,
} from './db';
import { AffineSchemas } from '@blocksuite/blocks';

function createWorkspace(db: Database, id = 'blocksuite-example') {
  const schema = new Schema().register(AffineSchemas);

  const workspace = new Workspace({
    schema,
    id,
    blobStorages: [() => createBlobStorage(db)],
  });
  return workspace;
}

function createBlobStorage(db: Database): BlobStorage {
  return {
    crud: {
      set: async (key: string, value: Blob) => {
        await insertBlobToDb(db, key, value);
        return key;
      },

      get: async (key: string) => {
        return getBlobFromDb(db, key);
      },

      delete: async (key: string) => {
        deleteBlobFromDb(db, key);
      },

      list: async () => {
        return getAllBlobIds(db);
      },
    },
  };
}

async function createDoc(workspace: Workspace) {
  const doc = workspace.createDoc({ id: 'page1' });

  doc.load(() => {
    const pageBlockId = doc.addBlock('affine:page', {});
    doc.addBlock('affine:surface', {}, pageBlockId);
    const noteId = doc.addBlock('affine:note', {}, pageBlockId);
    doc.addBlock('affine:paragraph', {}, noteId);
  });
  doc.resetHistory();
}

export class Provider {
  workspace!: Workspace;

  private constructor(private db: Database) {}

  static async init() {
    const db = await initEmptyDb();
    return new Provider(db);
  }

  async connect() {
    const { db } = this;
    if (isTableEmpty('docs', db)) {
      this.workspace = createWorkspace(db);
      this._connectWorkspace();

      insertDocToDb(db, this.workspace.id, null);
      await createDoc(this.workspace);
    } else {
      const id = getRootDocId(db);
      if (!id) throw new Error('No workspace found in database');

      this.workspace = createWorkspace(db, id);
      this._applyToDoc(this.workspace.doc);
      this.workspace.docs.forEach(doc => {
        this._applyToDoc(doc.spaceDoc);
        doc.load();
        this._connectSubDoc(doc.spaceDoc);
      });

      this._connectWorkspace();
    }
  }

  async reset(blob: Blob) {
    const data = new Uint8Array(await blob.arrayBuffer());
    this.db = await loadDb(data);
    await this.connect();
  }

  async export() {
    return new Blob([this.db.export()]);
  }

  private _connectWorkspace() {
    const { workspace, db } = this;
    workspace.doc.on('update', update => {
      insertUpdateToDb(db, workspace.id, update);
    });

    workspace.doc.on('subdocs', subdocs => {
      subdocs.added.forEach((doc: Y.Doc) => {
        insertDocToDb(db, doc.guid, workspace.id);
        this._connectSubDoc(doc);
      });
    });
  }

  private _connectSubDoc(doc: Y.Doc) {
    const { db } = this;
    doc.on('update', async update => {
      insertUpdateToDb(db, doc.guid, update);
    });
  }

  private _applyToDoc(doc: Y.Doc) {
    const updates = getUpdatesFromDoc(this.db, doc.guid);
    updates.forEach(update => {
      Workspace.Y.applyUpdate(doc, update);
    });
  }
}
