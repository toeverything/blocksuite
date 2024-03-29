import { BlockService } from '@blocksuite/block-std';

import {
  type EmbedFigmaModel,
  EmbedFigmaStyles,
  figmaUrlRegex,
} from './embed-figma-model.js';

export class EmbedFigmaService extends BlockService<EmbedFigmaModel> {
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
