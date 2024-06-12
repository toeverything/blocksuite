import './commands/index.js';

import type { EdgelessRootService } from './edgeless/edgeless-root-service.js';
import type { PageRootService } from './page/page-root-service.js';
import type { RootBlockModel } from './root-model.js';

export * from './clipboard/index.js';
export { FramePreview } from './edgeless/components/frame/frame-preview.js';
export { EdgelessBlockModel } from './edgeless/edgeless-block-model.js';
export * from './edgeless/edgeless-root-block.js';
export { EdgelessRootService } from './edgeless/edgeless-root-service.js';
export * from './edgeless/types.js';
export { Viewport } from './edgeless/utils/viewport.js';
export * from './page/page-root-block.js';
export { PageRootService } from './page/page-root-service.js';
export * from './preview/preview-root-block.js';
export { type RootBlockModel, RootBlockSchema } from './root-model.js';
export { type QuickSearchService, RootService } from './root-service.js';
export * from './types.js';
export * from './utils/index.js';
export * from './widgets/index.js';

declare global {
  namespace BlockSuite {
    interface BlockModels {
      'affine:page': RootBlockModel;
    }
    interface BlockServices {
      'affine:page': PageRootService | EdgelessRootService;
    }
  }
}
