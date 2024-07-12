import type { Doc, DocCollection } from '@blocksuite/store';

// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import type { AffineEditorContainer } from '../index.js';

declare global {
  const editor: AffineEditorContainer;
  const doc: Doc;
  const collection: DocCollection;
  interface Window {
    collection: DocCollection;
    doc: Doc;
    editor: AffineEditorContainer;
  }
}
