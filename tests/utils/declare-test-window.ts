import type { RefNodeSlotsProvider, TestUtils } from '@blocks/index.js';
import type {
  EditorHost,
  ExtensionType,
  WidgetViewMapIdentifier,
} from '@blocksuite/block-std';
import type { AffineEditorContainer } from '@blocksuite/presets';
import type { DebugMenu } from '@playground/apps/_common/components/debug-menu.js';
import type { BlockModel, Doc, DocCollection, Job } from '@store/index.js';

declare global {
  interface Window {
    /** Available on playground window
     * the following instance are initialized in `packages/playground/apps/starter/main.ts`
     */
    $blocksuite: {
      store: typeof import('../../packages/framework/store/src/index.js');
      blocks: typeof import('../../packages/blocks/src/index.js');
      global: {
        utils: typeof import('../../packages/framework/global/src/utils.js');
      };
      editor: typeof import('../../packages/presets/src/index.js');
      identifiers: {
        WidgetViewMapIdentifier: typeof WidgetViewMapIdentifier;
        QuickSearchProvider: typeof import('../../packages/affine/shared/src/services/quick-search-service.js').QuickSearchProvider;
        DocModeProvider: typeof import('../../packages/affine/shared/src/services/doc-mode-service.js').DocModeProvider;
        RefNodeSlotsProvider: typeof RefNodeSlotsProvider;
        ParseDocUrlService: typeof import('../../packages/affine/shared/src/services/parse-url-service.js').ParseDocUrlProvider;
      };
      defaultExtensions: () => ExtensionType[];
      extensions: {
        WidgetViewMapExtension: typeof import('../../packages/framework/block-std/src/extension/widget-view-map.js').WidgetViewMapExtension;
      };
      mockServices: {
        mockDocModeService: typeof import('../../packages/playground/apps/_common/mock-services.js').mockDocModeService;
      };
    };
    collection: DocCollection;
    blockSchema: Record<string, typeof BlockModel>;
    doc: Doc;
    debugMenu: DebugMenu;
    editor: AffineEditorContainer;
    host: EditorHost;
    testUtils: TestUtils;
    job: Job;
  }
}
