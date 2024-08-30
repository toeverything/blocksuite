import { EdgelessTextBlockSchema } from '@blocksuite/affine-model';
import { BlockService } from '@blocksuite/block-std';

export class EdgelessTextBlockService extends BlockService {
  static override readonly flavour = EdgelessTextBlockSchema.model.flavour;
}

declare global {
  namespace BlockSuite {
    interface BlockServices {
      'affine:edgeless-text': EdgelessTextBlockService;
    }
  }
}
