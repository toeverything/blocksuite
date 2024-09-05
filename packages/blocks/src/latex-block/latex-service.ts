import { LatexBlockSchema } from '@blocksuite/affine-model';
import { BlockService } from '@blocksuite/block-std';

export class LatexBlockService extends BlockService {
  static override readonly flavour = LatexBlockSchema.model.flavour;
}
