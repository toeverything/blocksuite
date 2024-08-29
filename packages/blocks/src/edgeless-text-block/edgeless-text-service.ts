import type { EdgelessTextBlockModel } from '@blocksuite/affine-model';

import { BlockService } from '@blocksuite/block-std';

export class EdgelessTextBlockService extends BlockService<EdgelessTextBlockModel> {}

declare global {
  namespace BlockSuite {
    interface BlockServices {
      'affine:edgeless-text': EdgelessTextBlockService;
    }
  }
}
