/* eslint-disable @typescript-eslint/no-restricted-imports */
import type {
  Workspace,
  Page,
  BaseBlockModel,
} from '../../packages/store/src/index.js';
import type { EditorContainer } from '../../packages/editor/src/components/editor-container.js';
import type {} from '../../packages/playground/src/components/debug-menu.js';
import type { DebugMenu } from '../../packages/playground/src/components/debug-menu.js';

declare global {
  interface Window {
    /** Available on playground window */
    $blocksuite: {
      store: typeof import('../../packages/store/src/index.js');
      blocks: typeof import('../../packages/blocks/src/index.js');
      global: {
        utils: typeof import('../../packages/global/src/utils.js');
      };
      editor: typeof import('../../packages/editor/src/index.js');
    };
    workspace: Workspace;
    blockSchema: Record<string, typeof BaseBlockModel>;
    page: Page;
    debugMenu: DebugMenu;
    editor: EditorContainer;
  }
}
