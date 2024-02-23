import { BlockService } from '@blocksuite/block-std';

import { LinkPreviewer } from '../_common/embed-block-helper/index.js';
import {
  type EmbedLoomModel,
  EmbedLoomStyles,
  loomUrlRegex,
} from './embed-loom-model.js';
import { queryEmbedLoomData } from './utils.js';

export class EmbedLoomService extends BlockService<EmbedLoomModel> {
  private static readonly linkPreviewer = new LinkPreviewer();

  queryUrlData = (embedLoomModel: EmbedLoomModel) => {
    return queryEmbedLoomData(embedLoomModel);
  };

  override mounted() {
    super.mounted();

    const pageService = this.std.spec.getService('affine:page');
    pageService.registerEmbedBlockOptions({
      flavour: this.flavour,
      urlRegex: loomUrlRegex,
      styles: EmbedLoomStyles,
      viewType: 'embed',
    });
  }

  static setLinkPreviewEndpoint = EmbedLoomService.linkPreviewer.setEndpoint;
}
