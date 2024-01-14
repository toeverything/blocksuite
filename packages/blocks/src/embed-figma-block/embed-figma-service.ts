import { BlockService } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';

import type { PageService } from '../index.js';
import {
  type EmbedFigmaModel,
  EmbedFigmaStyles,
  figmaUrlRegex,
} from './embed-figma-model.js';
import { queryEmbedFigmaData } from './utils.js';

export class EmbedFigmaService extends BlockService<EmbedFigmaModel> {
  queryUrlData = (embedFigmaModel: EmbedFigmaModel) => {
    return queryEmbedFigmaData(embedFigmaModel);
  };

  override mounted() {
    super.mounted();

    const pageService = this.std.spec.getService(
      'affine:page'
    ) as PageService | null;
    assertExists(pageService);
    pageService.registerEmbedBlockOptions({
      flavour: this.flavour,
      urlRegex: figmaUrlRegex,
      styles: EmbedFigmaStyles,
      viewType: 'embed',
    });
  }
}
