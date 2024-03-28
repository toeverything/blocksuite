import { DocMeta } from '@blocksuite/store';
import { Low } from 'lowdb';
import { JSONFilePreset } from 'lowdb/node';

interface Database {
  getDocMetas: () => Promise<{ docMetas: DocMeta[] }>;
  getDocMeta: (docId: string) => Promise<DocMeta | null>;
  addDocMeta: (docMeta: DocMeta) => Promise<DocMeta | null>;
  updateDocMeta: (
    docId: string,
    docMeta: Partial<Omit<DocMeta, 'id'>>
  ) => Promise<DocMeta | null>;
  deleteDocMeta: (docId: string) => Promise<boolean>;
}

export class JSONDatabase implements Database {
  private constructor(private _db: Low<{ docMetas: DocMeta[] }>) {}

  static async init(filePath: string) {
    const defaultData = { docMetas: [] as DocMeta[] };
    const _db = await JSONFilePreset(filePath, defaultData);
    _db.read();
    _db.write();
    return new JSONDatabase(_db);
  }

  async getDocMetas() {
    await this._db.read();
    return this._db.data;
  }

  async getDocMeta(docId: string) {
    await this._db.read();
    const docMeta = this._db.data.docMetas.find(({ id }) => id === docId);
    return docMeta ?? null;
  }

  async addDocMeta(docMeta: DocMeta) {
    await this._db.read();
    const { docMetas } = this._db.data;

    const noExsited = docMetas.findIndex(({ id }) => id === docMeta.id) === -1;
    if (noExsited) {
      docMetas.push(docMeta);
      await this._db.write();
      return docMeta;
    }
    return null;
  }

  async updateDocMeta(docId: string, docMeta: Partial<Omit<DocMeta, 'id'>>) {
    await this._db.read();
    const { docMetas } = this._db.data;

    const index = docMetas.findIndex(({ id }) => id === docId);
    if (index !== -1) {
      docMetas[index] = { ...docMetas[index], ...docMeta };
      await this._db.write();
      return docMetas[index];
    }

    return null;
  }

  async deleteDocMeta(docId: string) {
    await this._db.read();
    const { docMetas } = this._db.data;

    const index = docMetas.findIndex(({ id }) => id === docId);
    if (index !== -1) {
      docMetas.splice(index, 1);
      await this._db.write();
      return true;
    }
    return false;
  }
}
