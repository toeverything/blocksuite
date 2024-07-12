/* eslint-disable @typescript-eslint/no-restricted-imports */
import type { EditorHost } from '@block-std/view/element/index.js';
import type { TestUtils } from '@blocks/index.js';
import type { DebugMenu } from '@playground/apps/_common/components/debug-menu.js';
import type { AffineEditorContainer } from '@presets/editors/index.js';
import type { BlockModel, Doc, DocCollection } from '@store/index.js';

declare global {
  interface Window {
    /** Available on playground window */
    $blocksuite: {
      blocks: typeof import('../../packages/blocks/src/index.js');
      editor: typeof import('../../packages/presets/src/index.js');
      global: {
        utils: typeof import('../../packages/framework/global/src/utils.js');
      };
      store: typeof import('../../packages/framework/store/src/index.js');
    };
    blockSchema: Record<string, typeof BlockModel>;
    collection: DocCollection;
    debugMenu: DebugMenu;
    doc: Doc;
    editor: AffineEditorContainer;
    host: EditorHost;
    testUtils: TestUtils;
  }
}
