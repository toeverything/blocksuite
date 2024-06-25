import { noop } from '@blocksuite/global/utils';

import { EmbedHtmlBlockComponent } from './embed-html-block.js';
import type { EmbedHtmlModel } from './embed-html-model.js';
import type { EmbedHtmlBlockService } from './embed-html-service.js';
noop(EmbedHtmlBlockComponent);

export * from './embed-html-block.js';
export * from './embed-html-model.js';
export * from './embed-html-service.js';
export * from './embed-html-spec.js';

declare global {
  namespace BlockSuite {
    interface BlockModels {
      'affine:embed-html': EmbedHtmlModel;
    }
    interface BlockServices {
      'affine:embed-html': EmbedHtmlBlockService;
    }
  }
}
