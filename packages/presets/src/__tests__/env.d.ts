import type { Doc, DocCollection, Job } from '@blocksuite/store';

import type { AffineEditorContainer } from '../index.js';

declare global {
  const editor: AffineEditorContainer;
  const doc: Doc;
  const collection: DocCollection;
  const job: Job;
  interface Window {
    editor: AffineEditorContainer;
    doc: Doc;
    job: Job;
    collection: DocCollection;
  }
}
