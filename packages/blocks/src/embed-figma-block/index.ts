import { noop } from '@blocksuite/global/utils';

import type { EmbedFigmaModel } from './embed-figma-model.js';
import type { EmbedFigmaBlockService } from './embed-figma-service.js';

import { EmbedFigmaBlockComponent } from './embed-figma-block.js';
noop(EmbedFigmaBlockComponent);

export * from './embed-figma-block.js';
export * from './embed-figma-model.js';
export * from './embed-figma-spec.js';

declare global {
  namespace BlockSuite {
    interface BlockServices {
      'affine:embed-figma': EmbedFigmaBlockService;
    }
    interface BlockModels {
      'affine:embed-figma': EmbedFigmaModel;
    }
  }
}
