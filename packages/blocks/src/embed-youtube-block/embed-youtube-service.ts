import { BlockService } from '@blocksuite/block-std';

import { LinkPreviewer } from '../_common/embed-block-helper/index.js';
import {
  type EmbedYoutubeModel,
  EmbedYoutubeStyles,
  youtubeUrlRegex,
} from './embed-youtube-model.js';
import { queryEmbedYoutubeData } from './utils.js';

export class EmbedYoutubeService extends BlockService<EmbedYoutubeModel> {
  private static readonly linkPreviewer = new LinkPreviewer();

  queryUrlData = (embedYoutubeModel: EmbedYoutubeModel) => {
    return queryEmbedYoutubeData(
      embedYoutubeModel,
      EmbedYoutubeService.linkPreviewer
    );
  };

  override mounted() {
    super.mounted();

    const pageService = this.std.spec.getService('affine:page');
    pageService.registerEmbedBlockOptions({
      flavour: this.flavour,
      urlRegex: youtubeUrlRegex,
      styles: EmbedYoutubeStyles,
      viewType: 'embed',
    });
  }

  static setLinkPreviewEndpoint = EmbedYoutubeService.linkPreviewer.setEndpoint;
}
