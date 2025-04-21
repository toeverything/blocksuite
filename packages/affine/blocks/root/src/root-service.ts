import { RootBlockSchema } from '@blocksuite/affine-model';
import { BlockService } from '@blocksuite/std';

export abstract class RootService extends BlockService {
  static override readonly flavour = RootBlockSchema.model.flavour;
}
