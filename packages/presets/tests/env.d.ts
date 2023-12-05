import type { Page, Workspace } from '@blocksuite/store';

// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import type { EditorContainer } from '../src/index.js';

declare global {
  const editor: EditorContainer;
  const page: Page;
  const workspace: Workspace;
  interface Window {
    editor: EditorContainer;
    page: Page;
    workspace: Workspace;
  }
}
