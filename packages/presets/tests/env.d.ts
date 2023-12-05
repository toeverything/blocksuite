import type { Page, Workspace } from '@blocksuite/store';

import type { EditorContainer } from './index.ts';

declare global {
  interface Window {
    editor: EditorContainer;
    page: Page;
    workspace: Workspace;
  }
}
