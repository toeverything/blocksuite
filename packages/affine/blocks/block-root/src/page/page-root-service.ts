import { RootBlockSchema } from '@blocksuite/affine-model';

import { RootService } from '../root-service.js';

export class PageRootService extends RootService {
  static override readonly flavour = RootBlockSchema.model.flavour;
}
