import { BlockSuiteError, ErrorCode } from '@blocksuite/global/exceptions';
import { Slot } from '@blocksuite/global/utils';

import type { BlockModel, BlockSchemaType } from '../schema/index.js';
import type { Doc, DocCollection, DocMeta } from '../store/index.js';
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

  private _batchCounter = 0;

  private readonly _collection: DocCollection;

  private readonly _pendingOperations: (() => void)[] = [];

  private readonly _slots: JobSlots = {
    beforeImport: new Slot<BeforeImportPayload>(),
    afterImport: new Slot<FinalPayload>(),
    beforeExport: new Slot<BeforeExportPayload>(),
    afterExport: new Slot<FinalPayload>(),
  };

  private _unblockTimer?: ReturnType<typeof setTimeout>;

  blockToSnapshot = async (
    model: DraftModel
  ): Promise<BlockSnapshot | undefined> => {
    try {
      const snapshot = await this._blockToSnapshot(model);
      BlockSnapshotSchema.parse(snapshot);

      return snapshot;
    } catch (error) {
      console.error(`Error when transforming block to snapshot:`);
      console.error(error);
      return;
    }
  };

  collectionInfoToSnapshot = (): CollectionInfoSnapshot | undefined => {
    try {
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
    } catch (error) {
      console.error(`Error when transforming collection info to snapshot:`);
      console.error(error);
      return;
    }
  };

  docToSnapshot = async (doc: Doc): Promise<DocSnapshot | undefined> => {
    try {
      this._slots.beforeExport.emit({
        type: 'page',
        page: doc,
      });
      const rootModel = doc.root;
      const meta = this._exportDocMeta(doc);
      if (!rootModel) {
        throw new BlockSuiteError(
          ErrorCode.TransformerError,
          'Root block not found in doc'
        );
      }
      const blocks = await this.blockToSnapshot(rootModel);
      if (!blocks) {
        return;
      }
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
    } catch (error) {
      console.error(`Error when transforming doc to snapshot:`);
      console.error(error);
      return;
    }
  };

  sliceToSnapshot = async (
    slice: Slice
  ): Promise<SliceSnapshot | undefined> => {
    try {
      this._slots.beforeExport.emit({
        type: 'slice',
        slice,
      });
      const { content, pageVersion, workspaceVersion, pageId, workspaceId } =
        slice.data;
      const contentSnapshot = [];
      for (const block of content) {
        const blockSnapshot = await this.blockToSnapshot(block);
        if (!blockSnapshot) {
          return;
        }
        contentSnapshot.push(blockSnapshot);
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
    } catch (error) {
      console.error(`Error when transforming slice to snapshot:`);
      console.error(error);
      return;
    }
  };

  snapshotToBlock = async (
    snapshot: BlockSnapshot,
    doc: Doc,
    parent?: string,
    index?: number
  ): Promise<BlockModel | undefined> => {
    try {
      BlockSnapshotSchema.parse(snapshot);
      const model = await this._batchSnapshotToBlock(
        snapshot,
        doc,
        parent,
        index
      );

      return model;
    } catch (error) {
      console.error(`Error when transforming snapshot to block:`);
      console.error(error);
      return;
    }
  };

  snapshotToDoc = async (snapshot: DocSnapshot): Promise<Doc | undefined> => {
    try {
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
    } catch (error) {
      console.error(`Error when transforming snapshot to doc:`);
      console.error(error);
      return;
    }
  };

  snapshotToModelData = async (snapshot: BlockSnapshot) => {
    try {
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
    } catch (error) {
      console.error(`Error when transforming snapshot to model data:`);
      console.error(error);
      return;
    }
  };

  snapshotToSlice = async (
    snapshot: SliceSnapshot,
    doc: Doc,
    parent?: string,
    index?: number
  ): Promise<Slice | undefined> => {
    try {
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
          await this._batchSnapshotToBlock(block, doc, parent, (index ?? 0) + i)
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
    } catch (error) {
      console.error(`Error when transforming snapshot to slice:`);
      console.error(error);
      return;
    }
  };

  walk = (snapshot: DocSnapshot, callback: (block: BlockSnapshot) => void) => {
    const walk = (block: BlockSnapshot) => {
      try {
        callback(block);
      } catch (error) {
        console.error(`Error when walking snapshot:`);
        console.error(error);
      }

      if (block.children) {
        block.children.forEach(walk);
      }
    };

    walk(snapshot.blocks);
  };

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

  private _batchSnapshotToBlock(
    snapshot: BlockSnapshot,
    doc: Doc,
    parent?: string,
    index?: number
  ) {
    return new Promise<BlockModel>(resolve => {
      if (this._batchCounter < 100) {
        resolve(this._snapshotToBlock(snapshot, doc, parent, index));
      } else {
        // This will block the caller function
        // so that no further operations can be added to the queue.
        // Example:
        // for (const snapshot of snapshots) {
        //   // Block here as it is waiting for the promise to resolve.
        //   await job.snapshotToBlock(snapshot, doc, id);
        // }
        this._pendingOperations.push(() =>
          resolve(this._snapshotToBlock(snapshot, doc, parent, index))
        );
      }
      this._batchCounter++;
      const unblock = () => {
        // There should only be one operation in the queue
        // as we should create new jobs for each events.
        // However, we still need to loop through the list
        // to avoid potential bugs.
        while (this._pendingOperations.length > 0) {
          this._pendingOperations.shift()?.();
        }
        this._unblockTimer = undefined;
        this._batchCounter = 0;
      };
      clearTimeout(this._unblockTimer);
      this._unblockTimer = setTimeout(unblock, 10);
    });
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

  private _exportDocMeta(doc: Doc): DocSnapshot['meta'] {
    const docMeta = doc.meta;

    if (!docMeta) {
      throw new BlockSuiteError(
        ErrorCode.TransformerError,
        'Doc meta not found'
      );
    }
    return {
      id: docMeta.id,
      title: docMeta.title,
      createDate: docMeta.createDate,
      tags: [], // for backward compatibility
    };
  }

  private _getCollectionMeta() {
    const { meta } = this._collection;
    const { pageVersion, workspaceVersion, docs } = meta;
    if (!pageVersion) {
      throw new BlockSuiteError(
        ErrorCode.TransformerError,
        'Page version not found'
      );
    }
    if (!workspaceVersion) {
      throw new BlockSuiteError(
        ErrorCode.TransformerError,
        'Workspace version not found'
      );
    }
    if (!docs) {
      throw new BlockSuiteError(ErrorCode.TransformerError, 'Docs not found');
    }
    return {
      pageVersion,
      workspaceVersion,
      properties: {}, // for backward compatibility
      pages: JSON.parse(JSON.stringify(docs)) as DocMeta[],
    };
  }

  private _getSchema(flavour: string) {
    const schema = this._collection.schema.flavourSchemaMap.get(flavour);
    if (!schema) {
      throw new BlockSuiteError(
        ErrorCode.TransformerError,
        `Flavour schema not found for ${flavour}`
      );
    }
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

    const nextTick =
      typeof window !== 'undefined'
        ? window.requestAnimationFrame
        : setImmediate;
    await new Promise(resolve => nextTick(() => resolve(undefined)));
    doc.addBlock(
      modelData.flavour as BlockSuite.Flavour,
      { ...modelData.props, id: modelData.id },
      parent,
      index
    );

    for (const [index, child] of children.entries()) {
      await this._batchSnapshotToBlock(child, doc, id, index);
    }

    const model = doc.getBlockById(id);
    if (!model) {
      throw new BlockSuiteError(
        ErrorCode.TransformerError,
        `Block not found by id ${id}`
      );
    }
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
}
