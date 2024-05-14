import { noop } from '@blocksuite/global/utils';

import { EmbedYoutubeBlockComponent } from './embed-youtube-block.js';
import type { EmbedYoutubeModel } from './embed-youtube-model.js';
import type { EmbedYoutubeBlockService } from './embed-youtube-service.js';
noop(EmbedYoutubeBlockComponent);

export * from './embed-youtube-block.js';
export * from './embed-youtube-model.js';
export * from './embed-youtube-service.js';
export * from './embed-youtube-spec.js';

declare global {
  namespace BlockSuite {
    interface BlockModels {
      'affine:embed-youtube': EmbedYoutubeModel;
    }
    interface BlockServices {
      'affine:embed-youtube': EmbedYoutubeBlockService;
    }
  }
}
