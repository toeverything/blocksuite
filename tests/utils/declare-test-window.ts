import type { Workspace, Page, BaseBlockModel } from '../../packages/store/src';
import type { EditorContainer } from '../../packages/editor/src/components/editor-container/editor-container';

declare global {
  interface Window {
    /** Available on playground window */
    workspace: Workspace;
    blockSchema: Record<string, typeof BaseBlockModel>;
    page: Page;
    editor: EditorContainer;
  }
}
