import { noop } from '@blocksuite/global/utils';

import { EmbedFigmaBlockComponent } from './embed-figma-block.js';
import type { EmbedFigmaModel } from './embed-figma-model.js';
import type { EmbedFigmaService } from './embed-figma-service.js';
noop(EmbedFigmaBlockComponent);

export * from './embed-figma-block.js';
export * from './embed-figma-model.js';
export * from './embed-figma-spec.js';

declare global {
  namespace BlockSuite {
    interface BlockServices {
      'affine:embed-figma': EmbedFigmaService;
    }
    interface BlockModels {
      'affine:embed-figma': EmbedFigmaModel;
    }
  }
}
