import type { BaseBlockModel } from '../schema/index.js';

type SliceData = {
  content: BaseBlockModel[];
  workspaceId: string;
  pageId: string;
  blockVersions: Record<string, number>;
  pageVersion: number;
  workspaceVersion: number;
};

export class Slice {
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
