/* eslint-disable @typescript-eslint/no-restricted-imports */
import type { ContentParser } from '../../packages/blocks/src/index.js';
import type { EditorContainer } from '../../packages/editor/src/index.js';
import type {} from '../../packages/playground/src/components/debug-menu.js';
import type { DebugMenu } from '../../packages/playground/src/components/debug-menu.js';
import type {
  BaseBlockModel,
  Page,
  Workspace,
} from '../../packages/store/src/index.js';

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
    contentParser: ContentParser;
    blockSchema: Record<string, typeof BaseBlockModel>;
    page: Page;
    debugMenu: DebugMenu;
    editor: EditorContainer;
  }
}
