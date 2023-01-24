import type { Page, Workspace } from '@blocksuite/store';
import type { BlockSchema } from '@blocksuite/blocks/models';
import type { EditorContainer } from '@blocksuite/editor';

declare global {
  interface Window {
    editor: EditorContainer;
    page: Page;
    workspace: Workspace;
    blockSchema: typeof BlockSchema;
    Y: typeof Workspace.Y;
    std: typeof std;
  }
}
