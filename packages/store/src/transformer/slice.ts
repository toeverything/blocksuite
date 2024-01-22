import { assertExists } from '@blocksuite/global/utils';

import type { BlockModel } from '../schema/index.js';
import type { Page } from '../workspace/index.js';

type SliceData = {
  content: BlockModel[];
  workspaceId: string;
  pageId: string;
  pageVersion: number;
  workspaceVersion: number;
};

export class Slice {
  static fromModels(page: Page, models: BlockModel[]) {
    const meta = page.workspace.meta;
    const { pageVersion, workspaceVersion } = meta;
    assertExists(pageVersion);
    assertExists(workspaceVersion);
    return new Slice({
      content: models,
      workspaceId: page.workspace.id,
      pageId: page.id,
      pageVersion,
      workspaceVersion,
    });
  }

  constructor(public readonly data: SliceData) {}

  get content() {
    return this.data.content;
  }

  get pageVersion() {
    return this.data.pageVersion;
  }

  get workspaceVersion() {
    return this.data.workspaceVersion;
  }

  get workspaceId() {
    return this.data.workspaceId;
  }

  get pageId() {
    return this.data.pageId;
  }
}
