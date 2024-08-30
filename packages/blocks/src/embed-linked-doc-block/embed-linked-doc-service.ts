import { EmbedLinkedDocBlockSchema } from '@blocksuite/affine-model';
import { BlockService } from '@blocksuite/block-std';

export class EmbedLinkedDocBlockService extends BlockService {
  static override readonly flavour = EmbedLinkedDocBlockSchema.model.flavour;
}
