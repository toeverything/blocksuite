import type { Job } from '@blocksuite/store';
import type { Doc, DocCollection } from '@blocksuite/store';

// eslint-disable-next-line @typescript-eslint/no-restricted-imports
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
