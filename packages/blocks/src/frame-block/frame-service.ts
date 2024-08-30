import { FrameBlockSchema } from '@blocksuite/affine-model';
import { BlockService } from '@blocksuite/block-std';

export class FrameBlockService extends BlockService {
  static override readonly flavour = FrameBlockSchema.model.flavour;
}
