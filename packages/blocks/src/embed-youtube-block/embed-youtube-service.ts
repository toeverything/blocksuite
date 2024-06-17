import { BlockService } from '@blocksuite/block-std';

import { LinkPreviewer } from '../_common/embed-block-helper/index.js';
import {
  type EmbedYoutubeModel,
  EmbedYoutubeStyles,
  youtubeUrlRegex,
} from './embed-youtube-model.js';
import { queryEmbedYoutubeData } from './utils.js';

export class EmbedYoutubeBlockService extends BlockService<EmbedYoutubeModel> {
  private static readonly linkPreviewer = new LinkPreviewer();

  static setLinkPreviewEndpoint =
    EmbedYoutubeBlockService.linkPreviewer.setEndpoint;

  queryUrlData = (
    embedYoutubeModel: EmbedYoutubeModel,
    signal?: AbortSignal
  ) => {
    return queryEmbedYoutubeData(
      embedYoutubeModel,
      EmbedYoutubeBlockService.linkPreviewer,
      signal
    );
  };

  override mounted() {
    super.mounted();

    this.std.spec.slots.afterApply.once(() => {
      const rootService = this.std.spec.getService('affine:page');
      rootService.registerEmbedBlockOptions({
        flavour: this.flavour,
        urlRegex: youtubeUrlRegex,
        styles: EmbedYoutubeStyles,
        viewType: 'embed',
      });
    });
  }
}
