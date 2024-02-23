import { noop } from '@blocksuite/global/utils';

import { EmbedHtmlBlockComponent } from './embed-html-block.js';
import type { EmbedHtmlService } from './embed-html-service.js';
noop(EmbedHtmlBlockComponent);

export * from './embed-html-block.js';
export * from './embed-html-model.js';
export * from './embed-html-service.js';
export * from './embed-html-spec.js';

declare global {
  namespace BlockSuite {
    interface BlockServices {
      'affine:embed-html': EmbedHtmlService;
    }
  }
}
