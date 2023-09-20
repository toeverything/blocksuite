import { Slot } from '@blocksuite/global/utils';
import { assertExists } from '@blocksuite/global/utils';

import type { BaseBlockModel, BlockSchemaType } from '../schema/index.js';
import type { PageMeta, Workspace } from '../workspace/index.js';
import type { Page } from '../workspace/index.js';
import type { PagesPropertiesMeta } from '../workspace/meta.js';
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
  PageSnapshot,
  SliceSnapshot,
  WorkspaceInfoSnapshot,
} from './type.js';
import {
  BlockSnapshotSchema,
  PageSnapshotSchema,
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

  private readonly _slots: JobSlots = {
    beforeImport: new Slot<BeforeImportPayload>(),
    afterImport: new Slot<FinalPayload>(),
    beforeExport: new Slot<BeforeExportPayload>(),
    afterExport: new Slot<FinalPayload>(),
  };

  constructor({ workspace, middlewares = [] }: JobConfig) {
    this._workspace = workspace;
    this._assetsManager = new AssetsManager({ blobs: workspace.blobs });

    middlewares.forEach(middleware => {
      middleware({
        slots: this._slots,
        assetsManager: this._assetsManager,
        workspace: this._workspace,
      });
    });
  }

  get assetsManager() {
    return this._assetsManager;
  }

  get assets() {
    return this._assetsManager.getAssets();
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
    const { blockVersions, pageVersion, workspaceVersion, properties, pages } =
      meta;
    assertExists(blockVersions);
    assertExists(pageVersion);
    assertExists(workspaceVersion);
    assertExists(properties);
    assertExists(pages);
    return {
      blockVersions: { ...blockVersions },
      pageVersion,
      workspaceVersion,
      properties: JSON.parse(JSON.stringify(properties)) as PagesPropertiesMeta,
      pages: JSON.parse(JSON.stringify(pages)) as PageMeta[],
    };
  }

  private _exportPageMeta(page: Page): PageSnapshot['meta'] {
    const pageMeta = page.meta;

    assertExists(pageMeta);
    return {
      id: pageMeta.id,
      title: pageMeta.title,
      createDate: pageMeta.createDate,
      tags: [...pageMeta.tags],
    };
  }

  private _importPageMeta(page: Page, meta: PageSnapshot['meta']) {
    const pageMeta = page.meta;

    const workspaceTags = this._workspace.meta.properties.tags?.options;
    assertExists(workspaceTags);
    meta.tags.forEach(tag => {
      const exists = workspaceTags.some(t => t.id === tag);
      if (!exists) {
        throw new Error(`Tag ${tag} is not in workspace options`);
      }
      pageMeta.tags.push(tag);
    });
  }

  private async _blockToSnapshot(
    model: BaseBlockModel
  ): Promise<BlockSnapshot> {
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

  blockToSnapshot = async (model: BaseBlockModel): Promise<BlockSnapshot> => {
    const snapshot = await this._blockToSnapshot(model);
    BlockSnapshotSchema.parse(snapshot);

    return snapshot;
  };

  private async _snapshotToBlock(
    snapshot: BlockSnapshot,
    page: Page,
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

    page.addBlock(
      modelData.flavour,
      { ...modelData.props, id: modelData.id },
      parent,
      index
    );

    for (const child of children) {
      await this._snapshotToBlock(child, page, id, index);
    }

    const model = page.getBlockById(id);
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

  snapshotToBlock = async (
    snapshot: BlockSnapshot,
    page: Page,
    parent?: string,
    index?: number
  ): Promise<BaseBlockModel> => {
    BlockSnapshotSchema.parse(snapshot);
    const model = await this._snapshotToBlock(snapshot, page, parent, index);

    return model;
  };

  pageToSnapshot = async (page: Page): Promise<PageSnapshot> => {
    this._slots.beforeExport.emit({
      type: 'page',
      page,
    });
    const root = page.root;
    const meta = this._exportPageMeta(page);
    assertExists(root, 'Root block not found in page');
    const blocks = await this.blockToSnapshot(root);
    const pageSnapshot: PageSnapshot = {
      type: 'page',
      meta,
      blocks,
    };
    this._slots.afterExport.emit({
      type: 'page',
      page,
      snapshot: pageSnapshot,
    });
    PageSnapshotSchema.parse(pageSnapshot);

    return pageSnapshot;
  };

  snapshotToPage = async (snapshot: PageSnapshot): Promise<Page> => {
    this._slots.beforeImport.emit({
      type: 'page',
      snapshot,
    });
    PageSnapshotSchema.parse(snapshot);
    const { meta, blocks } = snapshot;
    const page = this._workspace.createPage({ id: meta.id });
    this._importPageMeta(page, meta);
    await this.snapshotToBlock(blocks, page);
    this._slots.afterImport.emit({
      type: 'page',
      snapshot,
      page,
    });

    return page;
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
    const {
      content,
      blockVersions,
      pageVersion,
      workspaceVersion,
      pageId,
      workspaceId,
    } = slice.data;
    const contentSnapshot = await Promise.all(
      content.map(block => this._blockToSnapshot(block))
    );
    const snapshot: SliceSnapshot = {
      type: 'slice',
      workspaceId,
      pageId,
      blockVersions,
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
    page: Page,
    parent?: string,
    index?: number
  ): Promise<Slice> => {
    this._slots.beforeImport.emit({
      type: 'slice',
      snapshot,
    });
    SliceSnapshotSchema.parse(snapshot);
    const {
      content,
      blockVersions,
      pageVersion,
      workspaceVersion,
      workspaceId,
      pageId,
    } = snapshot;
    const contentBlocks = await Promise.all(
      content.map((block, i) =>
        this._snapshotToBlock(block, page, parent, (index ?? 0) + i)
      )
    );
    const slice = new Slice({
      content: contentBlocks,
      blockVersions,
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
