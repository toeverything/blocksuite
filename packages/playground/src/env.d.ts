import type { Page, Workspace } from '@blocksuite/store';
import type { BlockSchemaType } from '@blocksuite/blocks/models';
import type { EditorContainer } from '@blocksuite/editor';

declare global {
  interface Window {
    editor: EditorContainer;
    page: Page;
    workspace: Workspace;
    blockSchema: BlockSchemaType;
    Y: typeof Workspace.Y;
    std: typeof std;
  }
}
