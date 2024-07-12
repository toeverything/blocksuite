import { BlockService } from '@blocksuite/block-std';

import {
  type EmbedFigmaModel,
  EmbedFigmaStyles,
  figmaUrlRegex,
} from './embed-figma-model.js';

export class EmbedFigmaBlockService extends BlockService<EmbedFigmaModel> {
  override mounted() {
    super.mounted();

    this.std.spec.slots.afterApply.once(() => {
      const rootService = this.std.spec.getService('affine:page');
      rootService.registerEmbedBlockOptions({
        flavour: this.flavour,
        styles: EmbedFigmaStyles,
        urlRegex: figmaUrlRegex,
        viewType: 'embed',
      });
    });
  }
}
