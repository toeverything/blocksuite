import { EmbedHtmlBlockSchema } from '@blocksuite/affine-model';
import { BlockService } from '@blocksuite/block-std';

export class EmbedHtmlBlockService extends BlockService {
  static override readonly flavour = EmbedHtmlBlockSchema.model.flavour;
}
