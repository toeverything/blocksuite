import { DividerBlockSchema } from '@blocksuite/affine-model';
import { BlockService } from '@blocksuite/block-std';

export class DividerBlockService extends BlockService {
  static override readonly flavour = DividerBlockSchema.model.flavour;
}
