import type { Doc } from '../store/index.js';
import type { DraftModel } from './draft.js';

type SliceData = {
  content: DraftModel[];
  workspaceId: string;
  pageId: string;
};

export class Slice {
  get content() {
    return this.data.content;
  }

  get docId() {
    return this.data.pageId;
  }

  get workspaceId() {
    return this.data.workspaceId;
  }

  constructor(readonly data: SliceData) {}

  static fromModels(doc: Doc, models: DraftModel[]) {
    return new Slice({
      content: models,
      workspaceId: doc.collection.id,
      pageId: doc.id,
    });
  }
}
