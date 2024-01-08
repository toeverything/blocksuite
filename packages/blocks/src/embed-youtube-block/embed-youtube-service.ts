import { BlockService } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';

import type { PageService } from '../index.js';
import {
  type EmbedYoutubeModel,
  EmbedYoutubeStyles,
  youtubeUrlRegex,
} from './embed-youtube-model.js';
import { queryEmbedYoutubeData } from './utils.js';

export class EmbedYoutubeService extends BlockService<EmbedYoutubeModel> {
  queryUrlData = (embedYoutubeModel: EmbedYoutubeModel) => {
    return queryEmbedYoutubeData(embedYoutubeModel);
  };

  override mounted() {
    super.mounted();

    const pageService = this.std.spec.getService(
      'affine:page'
    ) as PageService | null;
    assertExists(pageService);
    pageService.registerEmbedBlockOptions({
      flavour: this.flavour,
      urlRegex: youtubeUrlRegex,
      styles: EmbedYoutubeStyles,
    });
  }
}
