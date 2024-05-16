import { BlockService } from '@blocksuite/block-std';

import { LinkPreviewer } from '../_common/embed-block-helper/index.js';
import {
  type EmbedLoomModel,
  EmbedLoomStyles,
  loomUrlRegex,
} from './embed-loom-model.js';
import { queryEmbedLoomData } from './utils.js';

export class EmbedLoomBlockService extends BlockService<EmbedLoomModel> {
  private static readonly linkPreviewer = new LinkPreviewer();

  queryUrlData = (embedLoomModel: EmbedLoomModel) => {
    return queryEmbedLoomData(embedLoomModel);
  };

  override mounted() {
    super.mounted();

    this.std.spec.slots.afterApply.once(() => {
      const rootService = this.std.spec.getService('affine:page');
      rootService.registerEmbedBlockOptions({
        flavour: this.flavour,
        urlRegex: loomUrlRegex,
        styles: EmbedLoomStyles,
        viewType: 'embed',
      });
    });
  }

  static setLinkPreviewEndpoint =
    EmbedLoomBlockService.linkPreviewer.setEndpoint;
}
