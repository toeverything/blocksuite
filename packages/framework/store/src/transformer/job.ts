import { Slot } from '@blocksuite/global/utils';
import { assertExists } from '@blocksuite/global/utils';

import type { BlockModel, BlockSchemaType } from '../schema/index.js';
import type { DocCollection, DocMeta } from '../store/index.js';
import type { Doc } from '../store/index.js';
import { AssetsManager } from './assets.js';
import { BaseBlockTransformer } from './base.js';
import { type DraftModel, toDraftModel } from './draft.js';
import type {
  BeforeExportPayload,
  BeforeImportPayload,
  FinalPayload,
  JobMiddleware,
  JobSlots,
} from './middleware.js';
import { Slice } from './slice.js';
import type {
  BlockSnapshot,
  CollectionInfoSnapshot,
  DocSnapshot,
  SliceSnapshot,
} from './type.js';
import {
  BlockSnapshotSchema,
  CollectionInfoSnapshotSchema,
  DocSnapshotSchema,
  SliceSnapshotSchema,
} from './type.js';

export type JobConfig = {
  collection: DocCollection;
  middlewares?: JobMiddleware[];
};

export class Job {
  get collection() {
    return this._collection;
  }

  get assetsManager() {
    return this._assetsManager;
  }

  get assets() {
    return this._assetsManager.getAssets();
  }

  get adapterConfigs() {
    return this._adapterConfigs;
  }

  private readonly _collection: DocCollection;

  private readonly _assetsManager: AssetsManager;

  private readonly _adapterConfigs = new Map<string, string>();

  private readonly _slots: JobSlots = {
    beforeImport: new Slot<BeforeImportPayload>(),
    afterImport: new Slot<FinalPayload>(),
    beforeExport: new Slot<BeforeExportPayload>(),
    afterExport: new Slot<FinalPayload>(),
  };

  constructor({ collection, middlewares = [] }: JobConfig) {
    this._collection = collection;
    this._assetsManager = new AssetsManager({ blob: collection.blobSync });

    middlewares.forEach(middleware => {
      middleware({
        slots: this._slots,
        assetsManager: this._assetsManager,
        collection: this._collection,
        adapterConfigs: this._adapterConfigs,
      });
    });
  }

  private _getSchema(flavour: string) {
    const schema = this._collection.schema.flavourSchemaMap.get(flavour);
    assertExists(schema, `Flavour schema not found for ${flavour}`);
    return schema;
  }

  private _getTransformer(schema: BlockSchemaType) {
    return schema.transformer?.() ?? new BaseBlockTransformer();
  }

  private _getCollectionMeta() {
    const { meta } = this._collection;
    const { pageVersion, workspaceVersion, docs } = meta;
    assertExists(pageVersion);
    assertExists(workspaceVersion);
    assertExists(docs);
    return {
      pageVersion,
      workspaceVersion,
      properties: {}, // for backward compatibility
      pages: JSON.parse(JSON.stringify(docs)) as DocMeta[],
    };
  }

  private _exportDocMeta(doc: Doc): DocSnapshot['meta'] {
    const docMeta = doc.meta;

    assertExists(docMeta);
    return {
      id: docMeta.id,
      title: docMeta.title,
      createDate: docMeta.createDate,
      tags: [], // for backward compatibility
    };
  }

  private async _blockToSnapshot(model: DraftModel): Promise<BlockSnapshot> {
    this._slots.beforeExport.emit({
      type: 'block',
      model,
    });
    const schema = this._getSchema(model.flavour);
    const transformer = this._getTransformer(schema);
    const snapshotLeaf = await transformer.toSnapshot({
      model,
      assets: this._assetsManager,
    });
    const children = await Promise.all(
      model.children.map(child => {
        return this._blockToSnapshot(child);
      })
    );
    const snapshot: BlockSnapshot = {
      type: 'block',
      ...snapshotLeaf,
      children,
    };
    this._slots.afterExport.emit({
      type: 'block',
      model,
      snapshot,
    });

    return snapshot;
  }

  private async _snapshotToBlock(
    snapshot: BlockSnapshot,
    doc: Doc,
    parent?: string,
    index?: number
  ) {
    this._slots.beforeImport.emit({
      type: 'block',
      snapshot,
      parent,
      index,
    });
    const { children, flavour, props, id } = snapshot;

    const schema = this._getSchema(flavour);
    const snapshotLeaf = {
      id,
      flavour,
      props,
    };
    const transformer = this._getTransformer(schema);
    const modelData = await transformer.fromSnapshot({
      json: snapshotLeaf,
      assets: this._assetsManager,
      children,
    });

    doc.addBlock(
      modelData.flavour as BlockSuite.Flavour,
      { ...modelData.props, id: modelData.id },
      parent,
      index
    );

    for (const [index, child] of children.entries()) {
      await this._snapshotToBlock(child, doc, id, index);
    }

    const model = doc.getBlockById(id);
    assertExists(model);
    this._slots.afterImport.emit({
      type: 'block',
      snapshot,
      model,
      parent,
      index,
    });

    return model;
  }

  reset() {
    this._assetsManager.cleanup();
  }

  blockToSnapshot = async (model: DraftModel): Promise<BlockSnapshot> => {
    const snapshot = await this._blockToSnapshot(model);
    BlockSnapshotSchema.parse(snapshot);

    return snapshot;
  };

  snapshotToModelData = async (snapshot: BlockSnapshot) => {
    const { children, flavour, props, id } = snapshot;

    const schema = this._getSchema(flavour);
    const snapshotLeaf = {
      id,
      flavour,
      props,
    };
    const transformer = this._getTransformer(schema);
    const modelData = await transformer.fromSnapshot({
      json: snapshotLeaf,
      assets: this._assetsManager,
      children,
    });

    return modelData;
  };

  walk = (snapshot: DocSnapshot, callback: (block: BlockSnapshot) => void) => {
    const walk = (block: BlockSnapshot) => {
      callback(block);

      if (block.children) {
        block.children.forEach(walk);
      }
    };

    walk(snapshot.blocks);
  };

  snapshotToBlock = async (
    snapshot: BlockSnapshot,
    doc: Doc,
    parent?: string,
    index?: number
  ): Promise<BlockModel> => {
    BlockSnapshotSchema.parse(snapshot);
    const model = await this._snapshotToBlock(snapshot, doc, parent, index);

    return model;
  };

  docToSnapshot = async (doc: Doc): Promise<DocSnapshot> => {
    this._slots.beforeExport.emit({
      type: 'page',
      page: doc,
    });
    const rootModel = doc.root;
    const meta = this._exportDocMeta(doc);
    assertExists(rootModel, 'Root block not found in doc');
    const blocks = await this.blockToSnapshot(rootModel);
    const docSnapshot: DocSnapshot = {
      type: 'page',
      meta,
      blocks,
    };
    this._slots.afterExport.emit({
      type: 'page',
      page: doc,
      snapshot: docSnapshot,
    });
    DocSnapshotSchema.parse(docSnapshot);

    return docSnapshot;
  };

  snapshotToDoc = async (snapshot: DocSnapshot): Promise<Doc> => {
    this._slots.beforeImport.emit({
      type: 'page',
      snapshot,
    });
    DocSnapshotSchema.parse(snapshot);
    const { meta, blocks } = snapshot;
    const doc = this._collection.createDoc({ id: meta.id });
    doc.load();
    await this.snapshotToBlock(blocks, doc);
    this._slots.afterImport.emit({
      type: 'page',
      snapshot,
      page: doc,
    });

    return doc;
  };

  collectionInfoToSnapshot = (): CollectionInfoSnapshot => {
    this._slots.beforeExport.emit({
      type: 'info',
    });
    const collectionMeta = this._getCollectionMeta();
    const snapshot: CollectionInfoSnapshot = {
      type: 'info',
      id: this._collection.id,
      ...collectionMeta,
    };
    this._slots.afterExport.emit({
      type: 'info',
      snapshot,
    });
    CollectionInfoSnapshotSchema.parse(snapshot);

    return snapshot;
  };

  sliceToSnapshot = async (slice: Slice): Promise<SliceSnapshot> => {
    this._slots.beforeExport.emit({
      type: 'slice',
      slice,
    });
    const { content, pageVersion, workspaceVersion, pageId, workspaceId } =
      slice.data;
    const contentSnapshot = [];
    for (const block of content) {
      contentSnapshot.push(await this.blockToSnapshot(block));
    }
    const snapshot: SliceSnapshot = {
      type: 'slice',
      workspaceId,
      pageId,
      pageVersion,
      workspaceVersion,
      content: contentSnapshot,
    };
    this._slots.afterExport.emit({
      type: 'slice',
      slice,
      snapshot,
    });
    SliceSnapshotSchema.parse(snapshot);

    return snapshot;
  };

  snapshotToSlice = async (
    snapshot: SliceSnapshot,
    doc: Doc,
    parent?: string,
    index?: number
  ): Promise<Slice> => {
    this._slots.beforeImport.emit({
      type: 'slice',
      snapshot,
    });
    SliceSnapshotSchema.parse(snapshot);
    const { content, pageVersion, workspaceVersion, workspaceId, pageId } =
      snapshot;
    const contentBlocks: BlockModel[] = [];
    for (const [i, block] of content.entries()) {
      contentBlocks.push(
        await this._snapshotToBlock(block, doc, parent, (index ?? 0) + i)
      );
    }
    const slice = new Slice({
      content: contentBlocks.map(block => toDraftModel(block)),
      pageVersion,
      workspaceVersion,
      workspaceId,
      pageId,
    });
    this._slots.afterImport.emit({
      type: 'slice',
      snapshot,
      slice,
    });

    return slice;
  };
}
