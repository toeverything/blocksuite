import { assertExists } from '@blocksuite/global/utils';

import type { BaseBlockModel, BlockSchemaType } from '../schema/index.js';
import type { Workspace } from '../workspace/index.js';
import type { Page } from '../workspace/index.js';
import { AssetsManager } from './assets.js';
import { BaseBlockTransformer } from './base.js';
import type { BlockSnapshot, PageSnapshot } from './type.js';
import { BlockSnapshotSchema, PageSnapshotSchema } from './type.js';

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

  private _getSchema(flavour: string) {
    const schema = this._workspace.schema.flavourSchemaMap.get(flavour);
    assertExists(schema, `Flavour schema not found for ${flavour}`);
    return schema;
  }

  private _getTransformer(schema: BlockSchemaType) {
    return schema.transformer?.() ?? new BaseBlockTransformer();
  }

  private _exportPageMeta(page: Page): PageSnapshot['meta'] {
    const root = page.root;
    const { meta } = this._workspace;
    const { blockVersions, pageVersion, properties } = meta;
    const pageMeta = this._workspace.meta.getPageMeta(page.id);
    assertExists(root);
    assertExists(blockVersions);
    assertExists(pageVersion);
    assertExists(pageMeta);
    return {
      page: {
        id: pageMeta.id,
        title: pageMeta.title,
        createDate: pageMeta.createDate,
        tags: [...pageMeta.tags],
      },
      versions: {
        block: { ...blockVersions },
        page: pageVersion,
      },
      properties: JSON.parse(JSON.stringify(properties)),
    };
  }

  private _importPageMeta(page: Page, meta: PageSnapshot['meta']) {
    const pageMeta = this._workspace.meta.getPageMeta(page.id);
    assertExists(pageMeta);
    const metaTags = this._workspace.meta.properties.tags?.options ?? [];
    const snapshotTags = meta.properties.tags?.options ?? [];
    if (snapshotTags) {
      this._workspace.meta.properties.tags = {
        options: metaTags,
      };
    }
    const workspaceTags = this._workspace.meta.properties.tags?.options;
    assertExists(workspaceTags);
    meta.properties.tags?.options.forEach(tag => {
      if (metaTags?.some(metaTag => metaTag.id === tag.id)) {
        return;
      }
      workspaceTags.push(tag);
      pageMeta.tags.push(tag.id);
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
      ...snapshot,
      children,
    };
  }

  async blockToSnapshot(model: BaseBlockModel): Promise<BlockSnapshot> {
    const snapshot = await this._blockToSnapshot(model);
    BlockSnapshotSchema.parse(snapshot);

    return snapshot;
  }

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

  snapshotToBlock(
    snapshot: BlockSnapshot,
    page: Page,
    parent?: string,
    index?: number
  ): Promise<BaseBlockModel> {
    BlockSnapshotSchema.parse(snapshot);
    return this._snapshotToBlock(snapshot, page, parent, index);
  }

  async pageToSnapshot(page: Page): Promise<PageSnapshot> {
    const root = page.root;
    const meta = this._exportPageMeta(page);
    assertExists(root);
    const block = await this.blockToSnapshot(root);
    const pageSnapshot: PageSnapshot = { meta, block };

    PageSnapshotSchema.parse(pageSnapshot);
    return pageSnapshot;
  }

  async snapshotToPage(snapshot: PageSnapshot): Promise<Page> {
    PageSnapshotSchema.parse(snapshot);

    // TODO: validate versions and run migration
    const { meta, block } = snapshot;
    const page = this._workspace.createPage({ id: meta.page.id });
    await page.waitForLoaded();
    this._importPageMeta(page, meta);
    await this.snapshotToBlock(block, page);

    return page;
  }
}
