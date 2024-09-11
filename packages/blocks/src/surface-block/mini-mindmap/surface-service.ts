import { SurfaceBlockSchema } from '@blocksuite/affine-block-surface';
import { BlockService } from '@blocksuite/block-std';

export class MindmapSurfaceBlockService extends BlockService {
  static override readonly flavour = SurfaceBlockSchema.model.flavour;
}
