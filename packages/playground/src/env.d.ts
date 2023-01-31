import type { Page, Workspace, BlockSchema } from '@blocksuite/store';
import type { EditorContainer } from '@blocksuite/editor';
import type { z } from 'zod';

declare global {
  interface Window {
    editor: EditorContainer;
    page: Page;
    workspace: Workspace;
    blockSchemas: z.infer<typeof BlockSchema>[];
    Y: typeof Workspace.Y;
    std: typeof std;
  }
}
