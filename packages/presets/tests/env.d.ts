import type { Page, Workspace } from '@blocksuite/store';

// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import type { AffineEditorContainer } from '../src/index.js';

declare global {
  const editor: AffineEditorContainer;
  const page: Page;
  const workspace: Workspace;
  interface Window {
    editor: AffineEditorContainer;
    page: Page;
    workspace: Workspace;
  }
}
