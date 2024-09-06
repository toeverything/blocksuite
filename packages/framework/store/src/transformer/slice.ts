import { BlockSuiteError, ErrorCode } from '@blocksuite/global/exceptions';

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

  constructor(readonly data: SliceData) {}

  static fromModels(doc: Doc, models: DraftModel[]) {
    const meta = doc.collection.meta;
    const { pageVersion, workspaceVersion } = meta;
    if (!pageVersion || !workspaceVersion) {
      throw new BlockSuiteError(
        ErrorCode.ModelCRUDError,
        'pageVersion or workspaceVersion not found when creating slice'
      );
    }
    return new Slice({
      content: models,
      workspaceId: doc.collection.id,
      pageId: doc.id,
      pageVersion,
      workspaceVersion,
    });
  }
}
