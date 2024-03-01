import type { Doc, Workspace } from '@blocksuite/store';

// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import type { AffineEditorContainer } from '../index.js';

declare global {
  const editor: AffineEditorContainer;
  const doc: Doc;
  const workspace: Workspace;
  interface Window {
    editor: AffineEditorContainer;
    doc: Doc;
    workspace: Workspace;
  }
}
