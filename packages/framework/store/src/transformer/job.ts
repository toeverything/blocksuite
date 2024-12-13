import { BlockSuiteError, ErrorCode } from '@blocksuite/global/exceptions';
import { nextTick, Slot } from '@blocksuite/global/utils';

import type { BlockModel, BlockSchemaType } from '../schema/index.js';
import type { Doc, DocCollection, DocMeta } from '../store/index.js';
import type { DraftModel } from './draft.js';
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

interface FlatSnapshot {
  snapshot: BlockSnapshot;
  parentId?: string;
  index?: number;
}

interface DraftBlockTreeNode {
  draft: DraftModel;
  snapshot: BlockSnapshot;
  children: Array<DraftBlockTreeNode>;
}

// The number of blocks to insert in one batch
const BATCH_SIZE = 100;

export class Job {
  private readonly _adapterConfigs = new Map<string, string>();

  private readonly _assetsManager: AssetsManager;

  private readonly _collection: DocCollection;

  private readonly _slots: JobSlots = {
    beforeImport: new Slot<BeforeImportPayload>(),
    afterImport: new Slot<FinalPayload>(),
    beforeExport: new Slot<BeforeExportPayload>(),
    afterExport: new Slot<FinalPayload>(),
  };

  blockToSnapshot = (model: DraftModel): BlockSnapshot | undefined => {
    try {
      const snapshot = this._blockToSnapshot(model);
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

  docToSnapshot = (doc: Doc): DocSnapshot | undefined => {
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
      const blocks = this.blockToSnapshot(rootModel);
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

  sliceToSnapshot = (slice: Slice): SliceSnapshot | undefined => {
    try {
      this._slots.beforeExport.emit({
        type: 'slice',
        slice,
      });
      const { content, pageId, workspaceId } = slice.data;
      const contentSnapshot = [];
      for (const block of content) {
        const blockSnapshot = this.blockToSnapshot(block);
        if (!blockSnapshot) {
          return;
        }
        contentSnapshot.push(blockSnapshot);
      }
      const snapshot: SliceSnapshot = {
        type: 'slice',
        workspaceId,
        pageId,
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
      const model = await this._snapshotToBlock(snapshot, doc, parent, index);
      if (!model) return;
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
    SliceSnapshotSchema.parse(snapshot);
    try {
      this._slots.beforeImport.emit({
        type: 'slice',
        snapshot,
      });

      const { content, workspaceId, pageId } = snapshot;

      // Create a temporary root snapshot to encompass all content blocks
      const tmpRootSnapshot: BlockSnapshot = {
        id: 'temporary-root',
        flavour: 'affine:page',
        props: {},
        type: 'block',
        children: content,
      };

      for (const block of content) {
        this._triggerBeforeImportEvent(block, parent, index);
      }
      const flatSnapshots: FlatSnapshot[] = [];
      this._flattenSnapshot(tmpRootSnapshot, flatSnapshots, parent, index);

      const blockTree = await this._convertFlatSnapshots(flatSnapshots);

      await this._insertBlockTree(blockTree.children, doc, parent, index);

      const contentBlocks = blockTree.children
        .map(tree => doc.getBlockById(tree.draft.id))
        .filter(Boolean) as DraftModel[];

      const slice = new Slice({
        content: contentBlocks,
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

  private _blockToSnapshot(model: DraftModel): BlockSnapshot {
    this._slots.beforeExport.emit({
      type: 'block',
      model,
    });
    const schema = this._getSchema(model.flavour);
    const transformer = this._getTransformer(schema);
    const snapshotLeaf = transformer.toSnapshot({
      model,
      assets: this._assetsManager,
    });
    const children = model.children.map(child => {
      return this._blockToSnapshot(child);
    });
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

  private async _convertFlatSnapshots(flatSnapshots: FlatSnapshot[]) {
    // Phase 1: Convert snapshots to draft models in series
    // This is not time-consuming, this is faster than Promise.all
    const draftModels = [];
    for (const flat of flatSnapshots) {
      const draft = await this._convertSnapshotToDraftModel(flat);
      if (draft) {
        draft.id = flat.snapshot.id;
      }
      draftModels.push({
        draft,
        snapshot: flat.snapshot,
        parentId: flat.parentId,
        index: flat.index,
      });
    }

    // Phase 2: Filter out the models that failed to convert
    const validDraftModels = draftModels.filter(item => !!item.draft) as {
      draft: DraftModel;
      snapshot: BlockSnapshot;
      parentId?: string;
      index?: number;
    }[];

    // Phase 3: Rebuild the block trees
    const blockTree = this._rebuildBlockTree(validDraftModels);
    return blockTree;
  }

  private async _convertSnapshotToDraftModel(
    flat: FlatSnapshot
  ): Promise<DraftModel | undefined> {
    try {
      const { children, flavour } = flat.snapshot;
      const schema = this._getSchema(flavour);
      const transformer = this._getTransformer(schema);
      const { props } = await transformer.fromSnapshot({
        json: {
          id: flat.snapshot.id,
          flavour: flat.snapshot.flavour,
          props: flat.snapshot.props,
        },
        assets: this._assetsManager,
        children,
      });

      return {
        id: flat.snapshot.id,
        flavour: flat.snapshot.flavour,
        children: [],
        ...props,
      } as DraftModel;
    } catch (error) {
      console.error(`Error when transforming snapshot to model data:`);
      console.error(error);
      return;
    }
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

  private _flattenSnapshot(
    snapshot: BlockSnapshot,
    flatSnapshots: FlatSnapshot[],
    parentId?: string,
    index?: number
  ) {
    flatSnapshots.push({ snapshot, parentId, index });
    if (snapshot.children) {
      snapshot.children.forEach((child, idx) => {
        this._flattenSnapshot(child, flatSnapshots, snapshot.id, idx);
      });
    }
  }

  private _getCollectionMeta() {
    const { meta } = this._collection;
    const { docs } = meta;
    if (!docs) {
      throw new BlockSuiteError(ErrorCode.TransformerError, 'Docs not found');
    }
    return {
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

  private async _insertBlockTree(
    nodes: DraftBlockTreeNode[],
    doc: Doc,
    parentId?: string,
    startIndex?: number,
    counter: number = 0
  ) {
    for (let index = 0; index < nodes.length; index++) {
      const node = nodes[index];
      const { draft } = node;
      const { id, flavour } = draft;

      const actualIndex =
        startIndex !== undefined ? startIndex + index : undefined;
      doc.addBlock(flavour as BlockSuite.Flavour, draft, parentId, actualIndex);

      const model = doc.getBlock(id)?.model;
      if (!model) {
        throw new BlockSuiteError(
          ErrorCode.TransformerError,
          `Block not found by id ${id}`
        );
      }

      this._slots.afterImport.emit({
        type: 'block',
        model,
        snapshot: node.snapshot,
      });

      counter++;
      if (counter % BATCH_SIZE === 0) {
        await nextTick();
      }

      if (node.children.length > 0) {
        counter = await this._insertBlockTree(
          node.children,
          doc,
          id,
          undefined,
          counter
        );
      }
    }

    return counter;
  }

  private _rebuildBlockTree(
    draftModels: {
      draft: DraftModel;
      snapshot: BlockSnapshot;
      parentId?: string;
      index?: number;
    }[]
  ): DraftBlockTreeNode {
    const nodeMap = new Map<string, DraftBlockTreeNode>();
    // First pass: create nodes and add them to the map
    draftModels.forEach(({ draft, snapshot }) => {
      nodeMap.set(draft.id, { draft, snapshot, children: [] });
    });
    const root = nodeMap.get(draftModels[0].draft.id) as DraftBlockTreeNode;

    // Second pass: build the tree structure
    draftModels.forEach(({ draft, parentId, index }) => {
      const node = nodeMap.get(draft.id);
      if (!node) return;

      if (parentId) {
        const parentNode = nodeMap.get(parentId);
        if (parentNode && index !== undefined) {
          parentNode.children[index] = node;
        }
      }
    });

    if (!root) {
      throw new Error('No root node found in the tree');
    }

    return root;
  }

  private async _snapshotToBlock(
    snapshot: BlockSnapshot,
    doc: Doc,
    parent?: string,
    index?: number
  ): Promise<BlockModel | null> {
    this._triggerBeforeImportEvent(snapshot, parent, index);

    const flatSnapshots: FlatSnapshot[] = [];
    this._flattenSnapshot(snapshot, flatSnapshots, parent, index);

    const blockTree = await this._convertFlatSnapshots(flatSnapshots);

    await this._insertBlockTree([blockTree], doc, parent, index);

    return doc.getBlock(snapshot.id)?.model ?? null;
  }

  private _triggerBeforeImportEvent(
    snapshot: BlockSnapshot,
    parent?: string,
    index?: number
  ) {
    const traverseAndTrigger = (
      node: BlockSnapshot,
      parent?: string,
      index?: number
    ) => {
      this._slots.beforeImport.emit({
        type: 'block',
        snapshot: node,
        parent: parent,
        index: index,
      });
      if (node.children) {
        node.children.forEach((child, idx) => {
          traverseAndTrigger(child, node.id, idx);
        });
      }
    };
    traverseAndTrigger(snapshot, parent, index);
  }

  reset() {
    this._assetsManager.cleanup();
  }
}
