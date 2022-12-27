/* eslint-disable @typescript-eslint/no-restricted-imports */
import type {
  Workspace,
  Page,
  BaseBlockModel,
} from '../../packages/store/src/index.js';
import type { EditorContainer } from '../../packages/editor/src/components/editor-container.js';
import type {} from '../../packages/playground/src/components/debug-menu.js';

declare global {
  interface Window {
    /** Available on playground window */
    std: typeof import('../../packages/blocks/src/std.js').default;
    workspace: Workspace;
    blockSchema: Record<string, typeof BaseBlockModel>;
    page: Page;
    editor: EditorContainer;
  }
}
