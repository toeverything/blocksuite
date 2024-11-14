import { BlockService } from '@blocksuite/block-std';
import { MicrosheetSelection } from '@blocksuite/microsheet-data-view';

import { MicrosheetDataViewBlockSchema } from './data-view-model.js';

export class MicrosheetDataViewBlockService extends BlockService {
  static override readonly flavour =
    MicrosheetDataViewBlockSchema.model.flavour;

  override mounted(): void {
    super.mounted();
    this.selectionManager.register(MicrosheetSelection);
  }
}
