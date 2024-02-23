import { noop } from '@blocksuite/global/utils';

import { EmbedLoomBlockComponent } from './embed-loom-block.js';
import type { EmbedLoomService } from './embed-loom-service.js';
noop(EmbedLoomBlockComponent);

export * from './embed-loom-block.js';
export * from './embed-loom-model.js';
export * from './embed-loom-service.js';
export * from './embed-loom-spec.js';

declare global {
  namespace BlockSuite {
    interface BlockServices {
      'affine:embed-loom': EmbedLoomService;
    }
  }
}
