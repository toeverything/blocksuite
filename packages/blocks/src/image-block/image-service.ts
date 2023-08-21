import { BlockService } from '@blocksuite/block-std';

import type { ImageBlockModel } from './image-model.js';
import { ImageSelection } from './image-selection.js';

export class ImageService extends BlockService<ImageBlockModel> {
  override mounted(): void {
    super.mounted();
    this.selectionManager.register(ImageSelection);
  }
}
