import { Slot } from '@blocksuite/global/utils';
import { assertExists } from '@blocksuite/global/utils';

import type { BlockModel, BlockSchemaType } from '../schema/index.js';
import type { DocMeta, Workspace } from '../workspace/index.js';
import type { Doc } from '../workspace/index.js';
import type { DocsPropertiesMeta } from '../workspace/meta.js';
import { AssetsManager } from './assets.js';
import { BaseBlockTransformer } from './base.js';
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
  DocSnapshot,
  SliceSnapshot,
  WorkspaceInfoSnapshot,
} from './type.js';
import {
  BlockSnapshotSchema,
  DocSnapshotSchema,
  SliceSnapshotSchema,
  WorkspaceInfoSnapshotSchema,
} from './type.js';

export type JobConfig = {
  workspace: Workspace;
  middlewares?: JobMiddleware[];
};

export class Job {
  private readonly _workspace: Workspace;
  private readonly _assetsManager: AssetsManager;
  private readonly _adapterConfigs: Map<string, string> = new Map();

  private readonly _slots: JobSlots = {
    beforeImport: new Slot<BeforeImportPayload>(),
    afterImport: new Slot<FinalPayload>(),
    beforeExport: new Slot<BeforeExportPayload>(),
    afterExport: new Slot<FinalPayload>(),
  };

  constructor({ workspace, middlewares = [] }: JobConfig) {
    this._workspace = workspace;
    this._assetsManager = new AssetsManager({ blob: workspace.blob });

    middlewares.forEach(middleware => {
      middleware({
        slots: this._slots,
        assetsManager: this._assetsManager,
        workspace: this._workspace,
        adapterConfigs: this._adapterConfigs,
      });
    });
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

  reset() {
    this._assetsManager.cleanup();
  }

  private _getSchema(flavour: string) {
    const schema = this._workspace.schema.flavourSchemaMap.get(flavour);
    assertExists(schema, `Flavour schema not found for ${flavour}`);
    return schema;
  }

  private _getTransformer(schema: BlockSchemaType) {
    return schema.transformer?.() ?? new BaseBlockTransformer();
  }

  private _getWorkspaceMeta() {
    const { meta } = this._workspace;
    const { pageVersion, workspaceVersion, properties, docs } = meta;
    assertExists(pageVersion);
    assertExists(workspaceVersion);
    assertExists(properties);
    assertExists(docs);
    return {
      pageVersion,
      workspaceVersion,
      properties: JSON.parse(JSON.stringify(properties)) as DocsPropertiesMeta,
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
      tags: [...docMeta.tags],
    };
  }

  private _importDocMeta(doc: Doc, meta: DocSnapshot['meta']) {
    const docMeta = doc.meta;
    assertExists(docMeta);

    const workspaceTags = this._workspace.meta.properties.tags?.options;
    assertExists(workspaceTags);
    meta.tags.forEach(tag => {
      const exists = workspaceTags.some(t => t.id === tag);
      if (!exists) {
        throw new Error(`Tag ${tag} is not in workspace options`);
      }
      docMeta.tags.push(tag);
    });
  }

  private async _blockToSnapshot(model: BlockModel): Promise<BlockSnapshot> {
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

  blockToSnapshot = async (model: BlockModel): Promise<BlockSnapshot> => {
    const snapshot = await this._blockToSnapshot(model);
    BlockSnapshotSchema.parse(snapshot);

    return snapshot;
  };

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
    const doc = this._workspace.createDoc({ id: meta.id });
    doc.load();
    this._importDocMeta(doc, meta);
    await this.snapshotToBlock(blocks, doc);
    this._slots.afterImport.emit({
      type: 'page',
      snapshot,
      page: doc,
    });

    return doc;
  };

  workspaceInfoToSnapshot = (): WorkspaceInfoSnapshot => {
    this._slots.beforeExport.emit({
      type: 'info',
    });
    const workspaceMeta = this._getWorkspaceMeta();
    const snapshot: WorkspaceInfoSnapshot = {
      type: 'info',
      id: this._workspace.id,
      ...workspaceMeta,
    };
    this._slots.afterExport.emit({
      type: 'info',
      snapshot,
    });
    WorkspaceInfoSnapshotSchema.parse(snapshot);

    return snapshot;
  };

  snapshotToWorkspaceInfo = (snapshot: WorkspaceInfoSnapshot): void => {
    this._slots.beforeImport.emit({
      type: 'info',
      snapshot,
    });
    WorkspaceInfoSnapshotSchema.parse(snapshot);
    const { properties } = snapshot;
    const currentProperties = this._workspace.meta.properties;
    const newOptions = properties.tags?.options ?? [];
    const currentOptions = currentProperties.tags?.options ?? [];
    const options = new Set([...newOptions, ...currentOptions]);
    this._workspace.meta.setProperties({
      tags: {
        options: Array.from(options),
      },
    });
    this._slots.afterImport.emit({
      type: 'info',
      snapshot,
    });
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
    const contentBlocks = [];
    for (const [i, block] of content.entries()) {
      contentBlocks.push(
        await this._snapshotToBlock(block, doc, parent, (index ?? 0) + i)
      );
    }
    const slice = new Slice({
      content: contentBlocks,
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
