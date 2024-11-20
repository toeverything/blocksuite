import { SheetBlockSchema } from '@blocksuite/affine-model';
import { BlockService } from '@blocksuite/block-std';

import { sheetPrefix, toggleStyles } from './styles.js';

export class SheetBlockService extends BlockService {
  static override readonly flavour = SheetBlockSchema.model.flavour;

  readonly styles = {
    prefix: sheetPrefix,
    toggle: toggleStyles,
  };
}
