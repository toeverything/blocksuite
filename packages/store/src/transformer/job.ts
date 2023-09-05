import { assertExists } from '@blocksuite/global/utils';

import type { BaseBlockModel } from '../schema/index.js';
import type { Workspace } from '../workspace/index.js';
import type { Page } from '../workspace/index.js';
import { AssetsManager } from './assets.js';
import type { BlockSnapshot } from './base.js';
import { BlockSnapshotSchema } from './base.js';

export type JobConfig = {
  workspace: Workspace;
};

export class Job {
  private readonly _workspace: Workspace;
  private readonly _assetsManager: AssetsManager;
  constructor({ workspace }: JobConfig) {
    this._workspace = workspace;
    this._assetsManager = new AssetsManager({ workspace });
  }

  private _getSchema(flavour: string) {
    const schema = this._workspace.schema.flavourSchemaMap.get(flavour);
    assertExists(schema, `Flavour schema not found for ${flavour}`);
    return schema;
  }

  private async _blockToSnapshot(
    model: BaseBlockModel
  ): Promise<BlockSnapshot> {
    const schema = this._getSchema(model.flavour);
    const snapshot = await schema.transformer.toSnapshot({
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
    const modelData = await schema.transformer.fromSnapshot({
      json: snapshotLeaf,
      assets: this._assetsManager,
    });
    page.addBlock(
      modelData.flavour,
      { ...modelData.props, id: modelData.id },
      parent,
      index
    );
    await Promise.all(
      children.map((child, index) => {
        return this._snapshotToBlock(child, page, id, index);
      })
    );

    const model = page.getBlockById(id);
    assertExists(model);

    return model;
  }

  snapshotToBlock(
    snapshot: BlockSnapshot,
    page: Page,
    parent: string,
    index?: number
  ): Promise<BaseBlockModel> {
    BlockSnapshotSchema.parse(snapshot);
    return this._snapshotToBlock(snapshot, page, parent, index);
  }
}
