import {
  EmbedLoomBlockSchema,
  type EmbedLoomModel,
} from '@blocksuite/affine-model';
import { EmbedLoomStyles } from '@blocksuite/affine-model';
import { BlockService } from '@blocksuite/block-std';

import { LinkPreviewer } from '../_common/embed-block-helper/index.js';
import { loomUrlRegex } from './embed-loom-model.js';
import { queryEmbedLoomData } from './utils.js';

export class EmbedLoomBlockService extends BlockService {
  private static readonly linkPreviewer = new LinkPreviewer();

  static override readonly flavour = EmbedLoomBlockSchema.model.flavour;

  static setLinkPreviewEndpoint =
    EmbedLoomBlockService.linkPreviewer.setEndpoint;

  queryUrlData = (embedLoomModel: EmbedLoomModel, signal?: AbortSignal) => {
    return queryEmbedLoomData(embedLoomModel, signal);
  };

  override mounted() {
    super.mounted();

    const rootService = this.std.getService('affine:page');
    rootService.registerEmbedBlockOptions({
      flavour: this.flavour,
      urlRegex: loomUrlRegex,
      styles: EmbedLoomStyles,
      viewType: 'embed',
    });
  }
}
