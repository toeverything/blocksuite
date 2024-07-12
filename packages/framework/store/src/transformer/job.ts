import { Slot } from '@blocksuite/global/utils';
import { assertExists } from '@blocksuite/global/utils';

import type { BlockModel, BlockSchemaType } from '../schema/index.js';
import type { DocCollection, DocMeta } from '../store/index.js';
import type { Doc } from '../store/index.js';
import type {
  BeforeExportPayload,
  BeforeImportPayload,
  FinalPayload,
  JobMiddleware,
  JobSlots,
} from './middleware.js';
import type {
  BlockSnapshot,
  CollectionInfoSnapshot,
  DocSnapshot,
  SliceSnapshot,
} from './type.js';

import { AssetsManager } from './assets.js';
import { BaseBlockTransformer } from './base.js';
import { type DraftModel, toDraftModel } from './draft.js';
import { Slice } from './slice.js';
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
  private readonly _adapterConfigs = new Map<string, string>();

  private readonly _assetsManager: AssetsManager;

  private readonly _collection: DocCollection;

  private readonly _slots: JobSlots = {
    afterExport: new Slot<FinalPayload>(),
    afterImport: new Slot<FinalPayload>(),
    beforeExport: new Slot<BeforeExportPayload>(),
    beforeImport: new Slot<BeforeImportPayload>(),
  };

  blockToSnapshot = async (model: DraftModel): Promise<BlockSnapshot> => {
    const snapshot = await this._blockToSnapshot(model);
    BlockSnapshotSchema.parse(snapshot);

    return snapshot;
  };

  collectionInfoToSnapshot = (): CollectionInfoSnapshot => {
    this._slots.beforeExport.emit({
      type: 'info',
    });
    const collectionMeta = this._getCollectionMeta();
    const snapshot: CollectionInfoSnapshot = {
      id: this._collection.id,
      type: 'info',
      ...collectionMeta,
    };
    this._slots.afterExport.emit({
      snapshot,
      type: 'info',
    });
    CollectionInfoSnapshotSchema.parse(snapshot);

    return snapshot;
  };

  docToSnapshot = async (doc: Doc): Promise<DocSnapshot> => {
    this._slots.beforeExport.emit({
      page: doc,
      type: 'page',
    });
    const rootModel = doc.root;
    const meta = this._exportDocMeta(doc);
    assertExists(rootModel, 'Root block not found in doc');
    const blocks = await this.blockToSnapshot(rootModel);
    const docSnapshot: DocSnapshot = {
      blocks,
      meta,
      type: 'page',
    };
    this._slots.afterExport.emit({
      page: doc,
      snapshot: docSnapshot,
      type: 'page',
    });
    DocSnapshotSchema.parse(docSnapshot);

    return docSnapshot;
  };

  sliceToSnapshot = async (slice: Slice): Promise<SliceSnapshot> => {
    this._slots.beforeExport.emit({
      slice,
      type: 'slice',
    });
    const { content, pageId, pageVersion, workspaceId, workspaceVersion } =
      slice.data;
    const contentSnapshot = [];
    for (const block of content) {
      contentSnapshot.push(await this.blockToSnapshot(block));
    }
    const snapshot: SliceSnapshot = {
      content: contentSnapshot,
      pageId,
      pageVersion,
      type: 'slice',
      workspaceId,
      workspaceVersion,
    };
    this._slots.afterExport.emit({
      slice,
      snapshot,
      type: 'slice',
    });
    SliceSnapshotSchema.parse(snapshot);

    return snapshot;
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

  snapshotToDoc = async (snapshot: DocSnapshot): Promise<Doc> => {
    this._slots.beforeImport.emit({
      snapshot,
      type: 'page',
    });
    DocSnapshotSchema.parse(snapshot);
    const { blocks, meta } = snapshot;
    const doc = this._collection.createDoc({ id: meta.id });
    doc.load();
    await this.snapshotToBlock(blocks, doc);
    this._slots.afterImport.emit({
      page: doc,
      snapshot,
      type: 'page',
    });

    return doc;
  };

  snapshotToModelData = async (snapshot: BlockSnapshot) => {
    const { children, flavour, id, props } = snapshot;

    const schema = this._getSchema(flavour);
    const snapshotLeaf = {
      flavour,
      id,
      props,
    };
    const transformer = this._getTransformer(schema);
    const modelData = await transformer.fromSnapshot({
      assets: this._assetsManager,
      children,
      json: snapshotLeaf,
    });

    return modelData;
  };

  snapshotToSlice = async (
    snapshot: SliceSnapshot,
    doc: Doc,
    parent?: string,
    index?: number
  ): Promise<Slice> => {
    this._slots.beforeImport.emit({
      snapshot,
      type: 'slice',
    });
    SliceSnapshotSchema.parse(snapshot);
    const { content, pageId, pageVersion, workspaceId, workspaceVersion } =
      snapshot;
    const contentBlocks: BlockModel[] = [];
    for (const [i, block] of content.entries()) {
      contentBlocks.push(
        await this._snapshotToBlock(block, doc, parent, (index ?? 0) + i)
      );
    }
    const slice = new Slice({
      content: contentBlocks.map(block => toDraftModel(block)),
      pageId,
      pageVersion,
      workspaceId,
      workspaceVersion,
    });
    this._slots.afterImport.emit({
      slice,
      snapshot,
      type: 'slice',
    });

    return slice;
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

  constructor({ collection, middlewares = [] }: JobConfig) {
    this._collection = collection;
    this._assetsManager = new AssetsManager({ blob: collection.blobSync });

    middlewares.forEach(middleware => {
      middleware({
        adapterConfigs: this._adapterConfigs,
        assetsManager: this._assetsManager,
        collection: this._collection,
        slots: this._slots,
      });
    });
  }

  private async _blockToSnapshot(model: DraftModel): Promise<BlockSnapshot> {
    this._slots.beforeExport.emit({
      model,
      type: 'block',
    });
    const schema = this._getSchema(model.flavour);
    const transformer = this._getTransformer(schema);
    const snapshotLeaf = await transformer.toSnapshot({
      assets: this._assetsManager,
      model,
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
      model,
      snapshot,
      type: 'block',
    });

    return snapshot;
  }

  private _exportDocMeta(doc: Doc): DocSnapshot['meta'] {
    const docMeta = doc.meta;

    assertExists(docMeta);
    return {
      createDate: docMeta.createDate,
      id: docMeta.id,
      tags: [], // for backward compatibility
      title: docMeta.title,
    };
  }

  private _getCollectionMeta() {
    const { meta } = this._collection;
    const { docs, pageVersion, workspaceVersion } = meta;
    assertExists(pageVersion);
    assertExists(workspaceVersion);
    assertExists(docs);
    return {
      pageVersion,
      pages: JSON.parse(JSON.stringify(docs)) as DocMeta[],
      properties: {}, // for backward compatibility
      workspaceVersion,
    };
  }

  private _getSchema(flavour: string) {
    const schema = this._collection.schema.flavourSchemaMap.get(flavour);
    assertExists(schema, `Flavour schema not found for ${flavour}`);
    return schema;
  }

  private _getTransformer(schema: BlockSchemaType) {
    return schema.transformer?.() ?? new BaseBlockTransformer();
  }

  private async _snapshotToBlock(
    snapshot: BlockSnapshot,
    doc: Doc,
    parent?: string,
    index?: number
  ) {
    this._slots.beforeImport.emit({
      index,
      parent,
      snapshot,
      type: 'block',
    });
    const { children, flavour, id, props } = snapshot;

    const schema = this._getSchema(flavour);
    const snapshotLeaf = {
      flavour,
      id,
      props,
    };
    const transformer = this._getTransformer(schema);
    const modelData = await transformer.fromSnapshot({
      assets: this._assetsManager,
      children,
      json: snapshotLeaf,
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
      index,
      model,
      parent,
      snapshot,
      type: 'block',
    });

    return model;
  }

  reset() {
    this._assetsManager.cleanup();
  }

  get adapterConfigs() {
    return this._adapterConfigs;
  }

  get assets() {
    return this._assetsManager.getAssets();
  }

  get assetsManager() {
    return this._assetsManager;
  }

  get collection() {
    return this._collection;
  }
}
