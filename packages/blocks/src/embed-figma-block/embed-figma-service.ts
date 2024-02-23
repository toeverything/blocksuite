import { BlockService } from '@blocksuite/block-std';

import {
  type EmbedFigmaModel,
  EmbedFigmaStyles,
  figmaUrlRegex,
} from './embed-figma-model.js';

export class EmbedFigmaService extends BlockService<EmbedFigmaModel> {
  override mounted() {
    super.mounted();

    const pageService = this.std.spec.getService('affine:page');
    pageService.registerEmbedBlockOptions({
      flavour: this.flavour,
      urlRegex: figmaUrlRegex,
      styles: EmbedFigmaStyles,
      viewType: 'embed',
    });
  }
}
