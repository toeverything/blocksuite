import { RowBlockSchema } from '@blocksuite/affine-model';
import { BlockService } from '@blocksuite/block-std';

export class RowBlockService extends BlockService {
  static override readonly flavour = RowBlockSchema.model.flavour;

  override mounted() {
    super.mounted();
  }
}
