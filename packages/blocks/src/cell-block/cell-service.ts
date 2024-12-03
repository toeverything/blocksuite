import { CellBlockSchema } from '@blocksuite/affine-model';
import { BlockService } from '@blocksuite/block-std';

export class CellBlockService extends BlockService {
  static override readonly flavour = CellBlockSchema.model.flavour;

  override mounted(): void {
    super.mounted();
  }
}
