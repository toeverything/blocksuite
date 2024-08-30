import {
  EmbedYoutubeBlockSchema,
  type EmbedYoutubeModel,
  EmbedYoutubeStyles,
} from '@blocksuite/affine-model';
import { BlockService } from '@blocksuite/block-std';

import { LinkPreviewer } from '../_common/embed-block-helper/index.js';
import { youtubeUrlRegex } from './embed-youtube-model.js';
import { queryEmbedYoutubeData } from './utils.js';

export class EmbedYoutubeBlockService extends BlockService {
  private static readonly linkPreviewer = new LinkPreviewer();

  static override readonly flavour = EmbedYoutubeBlockSchema.model.flavour;

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

    const rootService = this.std.spec.getService('affine:page');
    rootService.registerEmbedBlockOptions({
      flavour: this.flavour,
      urlRegex: youtubeUrlRegex,
      styles: EmbedYoutubeStyles,
      viewType: 'embed',
    });
  }
}
