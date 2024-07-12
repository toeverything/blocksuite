import { assertExists } from '@blocksuite/global/utils';

import type { Doc } from '../store/index.js';
import type { DraftModel } from './draft.js';

type SliceData = {
  content: DraftModel[];
  workspaceId: string;
  pageId: string;
  pageVersion: number;
  workspaceVersion: number;
};

export class Slice {
  constructor(readonly data: SliceData) {}

  static fromModels(doc: Doc, models: DraftModel[]) {
    const meta = doc.collection.meta;
    const { pageVersion, workspaceVersion } = meta;
    assertExists(pageVersion);
    assertExists(workspaceVersion);
    return new Slice({
      content: models,
      workspaceId: doc.collection.id,
      pageId: doc.id,
      pageVersion,
      workspaceVersion,
    });
  }

  get content() {
    return this.data.content;
  }

  get docId() {
    return this.data.pageId;
  }

  get pageVersion() {
    return this.data.pageVersion;
  }

  get workspaceId() {
    return this.data.workspaceId;
  }

  get workspaceVersion() {
    return this.data.workspaceVersion;
  }
}
