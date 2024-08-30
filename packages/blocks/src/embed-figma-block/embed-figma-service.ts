import type { EmbedFigmaModel } from '@blocksuite/affine-model';

import { EmbedFigmaStyles } from '@blocksuite/affine-model';
import { BlockService } from '@blocksuite/block-std';

import { figmaUrlRegex } from './embed-figma-model.js';

export class EmbedFigmaBlockService extends BlockService<EmbedFigmaModel> {
  override mounted() {
    super.mounted();

    const rootService = this.std.spec.getService('affine:page');
    rootService.registerEmbedBlockOptions({
      flavour: this.flavour,
      urlRegex: figmaUrlRegex,
      styles: EmbedFigmaStyles,
      viewType: 'embed',
    });
  }
}
