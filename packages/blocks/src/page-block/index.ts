import './commands/index.js';

import type { EdgelessPageService } from './edgeless/edgeless-page-service.js';
import type { PageBlockModel } from './page-model.js';
import type { PageService } from './page-service.js';

export * from './doc/doc-page-block.js';
export { DocPageService } from './doc/doc-page-service.js';
export { getAllowSelectedBlocks } from './doc/utils.js';
export { FramePreview } from './edgeless/components/frame/frame-preview.js';
export { createButtonPopper } from './edgeless/components/utils.js';
export * from './edgeless/edgeless-page-block.js';
export { EdgelessPageService } from './edgeless/edgeless-page-service.js';
export { EdgelessBlockModel as EdgelessBlock } from './edgeless/type.js';
export { Viewport } from './edgeless/utils/viewport.js';
export { type PageBlockModel, PageBlockSchema } from './page-model.js';
export { PageService } from './page-service.js';
export * from './types.js';
export * from './utils/index.js';
export * from './widgets/index.js';

declare global {
  namespace BlockSuite {
    interface BlockModels {
      'affine:page': PageBlockModel;
    }
    interface BlockServices {
      'affine:page': PageService | EdgelessPageService;
    }
  }
}
