import type * as Y from 'yjs';

import { BlockSuiteError, ErrorCode } from '@blocksuite/global/exceptions';
import { Slot } from '@blocksuite/global/utils';

import type { BlockSuiteDoc } from '../yjs/index.js';
import type { DocCollection } from './collection.js';

import { COLLECTION_VERSION, PAGE_VERSION } from '../consts.js';

// please use `declare module '@blocksuite/store'` to extend this interface
export interface DocMeta {
  id: string;
  title: string;
  tags: string[];
  createDate: number;
  updatedDate?: number;
}

export type Tag = {
  id: string;
  value: string;
  color: string;
};
export type DocsPropertiesMeta = {
  tags?: {
    options: Tag[];
  };
};
export type DocCollectionMetaState = {
  pages?: unknown[];
  properties?: DocsPropertiesMeta;
  workspaceVersion?: number;
  pageVersion?: number;
  blockVersions?: Record<string, number>;
  name?: string;
  avatar?: string;
};

export class DocCollectionMeta {
  private _handleDocCollectionMetaEvents = (
    events: Y.YEvent<Y.Array<unknown> | Y.Text | Y.Map<unknown>>[]
  ) => {
    events.forEach(e => {
      const hasKey = (k: string) =>
        e.target === this._yMap && e.changes.keys.has(k);

      if (
        e.target === this.yDocs ||
        e.target.parent === this.yDocs ||
        hasKey('pages')
      ) {
        this._handleDocMetaEvent();
      }

      if (hasKey('name') || hasKey('avatar')) {
        this._handleCommonFieldsEvent();
      }
    });
  };

  private _prevDocs = new Set<string>();

  protected readonly _proxy: DocCollectionMetaState;

  protected readonly _yMap: Y.Map<
    DocCollectionMetaState[keyof DocCollectionMetaState]
  >;

  commonFieldsUpdated = new Slot();

  readonly doc: BlockSuiteDoc;

  docMetaAdded = new Slot<string>();

  docMetaRemoved = new Slot<string>();

  docMetaUpdated = new Slot();

  readonly id: string = 'meta';

  get avatar() {
    return this._proxy.avatar;
  }

  get blockVersions() {
    return this._proxy.blockVersions;
  }

  get docMetas() {
    if (!this._proxy.pages) {
      return [] as DocMeta[];
    }
    return this._proxy.pages as DocMeta[];
  }

  get docs() {
    return this._proxy.pages;
  }

  get hasVersion() {
    if (!this.blockVersions || !this.pageVersion || !this.workspaceVersion) {
      return false;
    }
    return Object.keys(this.blockVersions).length > 0;
  }

  get name() {
    return this._proxy.name;
  }

  get pageVersion() {
    return this._proxy.pageVersion;
  }

  get properties(): DocsPropertiesMeta {
    const meta = this._proxy.properties;
    if (!meta) {
      return {
        tags: {
          options: [],
        },
      };
    }
    return meta;
  }

  get workspaceVersion() {
    return this._proxy.workspaceVersion;
  }

  get yDocs() {
    return this._yMap.get('pages') as unknown as Y.Array<unknown>;
  }

  constructor(doc: BlockSuiteDoc) {
    this.doc = doc;
    this._yMap = doc.getMap(this.id);
    this._proxy = doc.getMapProxy<string, DocCollectionMetaState>(this.id);
    this._yMap.observeDeep(this._handleDocCollectionMetaEvents);
  }

  private _handleCommonFieldsEvent() {
    this.commonFieldsUpdated.emit();
  }

  private _handleDocMetaEvent() {
    const { docMetas, _prevDocs } = this;

    const newDocs = new Set<string>();

    docMetas.forEach(docMeta => {
      if (!_prevDocs.has(docMeta.id)) {
        this.docMetaAdded.emit(docMeta.id);
      }
      newDocs.add(docMeta.id);
    });

    _prevDocs.forEach(prevDocId => {
      const isRemoved = newDocs.has(prevDocId) === false;
      if (isRemoved) {
        this.docMetaRemoved.emit(prevDocId);
      }
    });

    this._prevDocs = newDocs;

    this.docMetaUpdated.emit();
  }

  addDocMeta(doc: DocMeta, index?: number) {
    this.doc.transact(() => {
      if (!this.docs) {
        return;
      }
      const docs = this.docs as unknown[];
      if (index === undefined) {
        docs.push(doc);
      } else {
        docs.splice(index, 0, doc);
      }
    }, this.doc.clientID);
  }

  getDocMeta(id: string) {
    return this.docMetas.find(doc => doc.id === id);
  }

  initialize() {
    if (!this._proxy.pages) {
      this._proxy.pages = [];
    }
  }

  removeDocMeta(id: string) {
    // you cannot delete a doc if there's no doc
    if (!this.docs) {
      return;
    }

    const docMeta = this.docMetas;
    const index = docMeta.findIndex((doc: DocMeta) => id === doc.id);
    if (index === -1) {
      return;
    }
    this.doc.transact(() => {
      if (!this.docs) {
        return;
      }
      this.docs.splice(index, 1);
    }, this.doc.clientID);
  }

  setAvatar(avatar: string) {
    this.doc.transact(() => {
      this._proxy.avatar = avatar;
    }, this.doc.clientID);
  }

  setDocMeta(id: string, props: Partial<DocMeta>) {
    const docs = (this.docs as DocMeta[]) ?? [];
    const index = docs.findIndex((doc: DocMeta) => id === doc.id);

    this.doc.transact(() => {
      if (!this.docs) {
        return;
      }
      if (index === -1) return;

      const doc = this.docs[index] as Record<string, unknown>;
      Object.entries(props).forEach(([key, value]) => {
        doc[key] = value;
      });
    }, this.doc.clientID);
  }

  setName(name: string) {
    this.doc.transact(() => {
      this._proxy.name = name;
    }, this.doc.clientID);
  }

  setProperties(meta: DocsPropertiesMeta) {
    this._proxy.properties = meta;
    this.docMetaUpdated.emit();
  }

  updateVersion(collection: DocCollection) {
    this._proxy.workspaceVersion = COLLECTION_VERSION;

    this._proxy.pageVersion = PAGE_VERSION;

    const _versions: Record<string, number> = {};
    collection.schema.flavourSchemaMap.forEach((schema, flavour) => {
      _versions[flavour] = schema.version;
    });
    this._proxy.blockVersions = _versions;
  }

  /**
   * @deprecated Only used for legacy doc version validation
   */
  validateVersion(collection: DocCollection) {
    const workspaceVersion = this._proxy.workspaceVersion;
    if (!workspaceVersion) {
      throw new BlockSuiteError(
        ErrorCode.DocCollectionError,
        'Invalid workspace data, workspace version is missing. Please make sure the data is valid.'
      );
    }
    if (workspaceVersion < COLLECTION_VERSION) {
      throw new BlockSuiteError(
        ErrorCode.DocCollectionError,
        `Workspace version ${workspaceVersion} is outdated. Please upgrade the editor.`
      );
    }

    const pageVersion = this._proxy.pageVersion;
    if (!pageVersion) {
      throw new BlockSuiteError(
        ErrorCode.DocCollectionError,
        'Invalid workspace data, page version is missing. Please make sure the data is valid.'
      );
    }
    if (pageVersion < PAGE_VERSION) {
      throw new BlockSuiteError(
        ErrorCode.DocCollectionError,
        `Doc version ${pageVersion} is outdated. Please upgrade the editor.`
      );
    }

    const blockVersions = { ...this._proxy.blockVersions };
    if (!blockVersions) {
      throw new BlockSuiteError(
        ErrorCode.DocCollectionError,
        'Invalid workspace data, versions data is missing. Please make sure the data is valid'
      );
    }
    const dataFlavours = Object.keys(blockVersions);
    if (dataFlavours.length === 0) {
      throw new BlockSuiteError(
        ErrorCode.DocCollectionError,
        'Invalid workspace data, missing versions field. Please make sure the data is valid.'
      );
    }

    dataFlavours.forEach(dataFlavour => {
      const dataVersion = blockVersions[dataFlavour] as number;
      const editorVersion =
        collection.schema.flavourSchemaMap.get(dataFlavour)?.version;
      if (!editorVersion) {
        throw new BlockSuiteError(
          ErrorCode.DocCollectionError,
          `Editor missing ${dataFlavour} flavour. Please make sure this block flavour is registered.`
        );
      } else if (dataVersion > editorVersion) {
        throw new BlockSuiteError(
          ErrorCode.DocCollectionError,
          `Editor doesn't support ${dataFlavour}@${dataVersion}. Please upgrade the editor.`
        );
      } else if (dataVersion < editorVersion) {
        throw new BlockSuiteError(
          ErrorCode.DocCollectionError,
          `In workspace data, the block flavour ${dataFlavour}@${dataVersion} is outdated. Please downgrade the editor or try data migration.`
        );
      }
    });
  }

  /**
   * @internal Only for doc initialization
   */
  writeVersion(collection: DocCollection) {
    const { blockVersions, pageVersion, workspaceVersion } = this._proxy;

    if (!workspaceVersion) {
      this._proxy.workspaceVersion = COLLECTION_VERSION;
    } else {
      console.error('Workspace version is already set');
    }

    if (!pageVersion) {
      this._proxy.pageVersion = PAGE_VERSION;
    } else {
      console.error('Doc version is already set');
    }

    if (!blockVersions) {
      const _versions: Record<string, number> = {};
      collection.schema.flavourSchemaMap.forEach((schema, flavour) => {
        _versions[flavour] = schema.version;
      });
      this._proxy.blockVersions = _versions;
    } else {
      console.error('Block versions is already set');
    }
  }
}
