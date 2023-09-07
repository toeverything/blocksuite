import { assertExists } from '@blocksuite/global/utils';

import type { BaseBlockModel, BlockSchemaType } from '../schema/index.js';
import type { PageMeta, Workspace } from '../workspace/index.js';
import type { Page } from '../workspace/index.js';
import type { PagesPropertiesMeta } from '../workspace/meta.js';
import { AssetsManager } from './assets.js';
import { BaseBlockTransformer } from './base.js';
import type {
  BlockSnapshot,
  PageSnapshot,
  WorkspaceInfoSnapshot,
} from './type.js';
import {
  BlockSnapshotSchema,
  PageSnapshotSchema,
  WorkspaceInfoSnapshotSchema,
} from './type.js';

export type JobConfig = {
  workspace: Workspace;
};

export class Job {
  private readonly _workspace: Workspace;
  private readonly _assetsManager: AssetsManager;
  constructor({ workspace }: JobConfig) {
    this._workspace = workspace;
    this._assetsManager = new AssetsManager({ blobs: workspace.blobs });
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
    const schema = this._getSchema(model.flavour);
    const transformer = this._getTransformer(schema);
    const snapshot = await transformer.toSnapshot({
      model,
      assets: this._assetsManager,
    });
    const children = await Promise.all(
      model.children.map(child => {
        return this._blockToSnapshot(child);
      })
    );
    return {
      type: 'snapshot:block',
      ...snapshot,
      children,
    };
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
    });
    page.addBlock(
      modelData.flavour,
      { ...modelData.props, id: modelData.id },
      parent,
      index
    );

    // Transform children one by one to make sure the order is correct
    await children.reduce(async (acc, child, index): Promise<void> => {
      await acc;
      await this._snapshotToBlock(child, page, id, index);
    }, Promise.resolve());

    const model = page.getBlockById(id);
    assertExists(model);

    return model;
  }

  snapshotToBlock = (
    snapshot: BlockSnapshot,
    page: Page,
    parent?: string,
    index?: number
  ): Promise<BaseBlockModel> => {
    BlockSnapshotSchema.parse(snapshot);
    return this._snapshotToBlock(snapshot, page, parent, index);
  };

  pageToSnapshot = async (page: Page): Promise<PageSnapshot> => {
    const root = page.root;
    const meta = this._exportPageMeta(page);
    assertExists(root);
    const block = await this.blockToSnapshot(root);
    const pageSnapshot: PageSnapshot = {
      type: 'snapshot:page',
      meta,
      block,
    };

    PageSnapshotSchema.parse(pageSnapshot);
    return pageSnapshot;
  };

  snapshotToPage = async (snapshot: PageSnapshot): Promise<Page> => {
    PageSnapshotSchema.parse(snapshot);

    const { meta, block } = snapshot;
    const page = this._workspace.createPage({ id: meta.id });
    await page.waitForLoaded();
    this._importPageMeta(page, meta);
    await this.snapshotToBlock(block, page);

    return page;
  };

  workspaceInfoToSnapshot = (): WorkspaceInfoSnapshot => {
    const workspaceMeta = this._getWorkspaceMeta();

    const snapshot: WorkspaceInfoSnapshot = {
      type: 'snapshot:workspace:info',
      app: '@toeverything/blocksuite',
      source: 'github.com/toeverything/blocksuite',
      id: this._workspace.id,
      ...workspaceMeta,
    };

    WorkspaceInfoSnapshotSchema.parse(snapshot);
    return snapshot;
  };

  snapshotToWorkspaceInfo = (snapshot: WorkspaceInfoSnapshot): void => {
    WorkspaceInfoSnapshotSchema.parse(snapshot);
    // TODO: validate versions
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
  };
}
