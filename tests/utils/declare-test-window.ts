/* eslint-disable @typescript-eslint/no-restricted-imports */
import type { TestUtils } from '@blocks/index.js';
import type { EditorHost } from '@lit/element/index.js';
import type { DebugMenu } from '@playground/apps/starter/components/debug-menu.js';
import type { AffineEditorContainer } from '@presets/editors/index.js';
import type { BlockModel, Page, Workspace } from '@store/index.js';
import type { DocProvider } from '@store/providers/type.js';

declare global {
  interface Window {
    /** Available on playground window */
    $blocksuite: {
      store: typeof import('../../packages/framework/store/src/index.js');
      blocks: typeof import('../../packages/blocks/src/index.js');
      global: {
        utils: typeof import('../../packages/framework/global/src/utils.js');
      };
      editor: typeof import('../../packages/presets/src/index.js');
    };
    workspace: Workspace;
    blockSchema: Record<string, typeof BlockModel>;
    page: Page;
    debugMenu: DebugMenu;
    editor: AffineEditorContainer;
    host: EditorHost;
    testUtils: TestUtils;

    // TODO: remove this when provider support subdocument
    subdocProviders: Map<string, DocProvider[]>;
  }
}
