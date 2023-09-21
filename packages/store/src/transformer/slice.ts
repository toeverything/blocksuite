import { assertExists } from '@blocksuite/global/utils';

import type { BaseBlockModel } from '../schema/index.js';
import type { Page } from '../workspace/index.js';

type SliceData = {
  content: BaseBlockModel[];
  workspaceId: string;
  pageId: string;
  blockVersions: Record<string, number>;
  pageVersion: number;
  workspaceVersion: number;
};

export class Slice {
  static fromModels(page: Page, models: BaseBlockModel[]) {
    const meta = page.workspace.meta;
    const { pageVersion, workspaceVersion } = meta;
    assertExists(pageVersion);
    assertExists(workspaceVersion);
    return new Slice({
      content: models,
      workspaceId: page.workspace.id,
      pageId: page.id,
      blockVersions: { ...meta.blockVersions },
      pageVersion,
      workspaceVersion,
    });
  }

  constructor(public readonly data: SliceData) {}

  get content() {
    return this.data.content;
  }

  get blockVersions() {
    return this.data.blockVersions;
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
