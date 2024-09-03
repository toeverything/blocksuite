import { EmbedFigmaBlockSchema } from '@blocksuite/affine-model';
import { EmbedFigmaStyles } from '@blocksuite/affine-model';
import { BlockService } from '@blocksuite/block-std';

import { figmaUrlRegex } from './embed-figma-model.js';

export class EmbedFigmaBlockService extends BlockService {
  static override readonly flavour = EmbedFigmaBlockSchema.model.flavour;

  override mounted() {
    super.mounted();

    const rootService = this.std.getService('affine:page');
    rootService.registerEmbedBlockOptions({
      flavour: this.flavour,
      urlRegex: figmaUrlRegex,
      styles: EmbedFigmaStyles,
      viewType: 'embed',
    });
  }
}
