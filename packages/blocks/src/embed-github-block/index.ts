import { noop } from '@blocksuite/global/utils';

import { EmbedGithubBlockComponent } from './embed-github-block.js';
import type { EmbedGithubModel } from './embed-github-model.js';
import type { EmbedGithubBlockService } from './embed-github-service.js';
noop(EmbedGithubBlockComponent);

export * from './embed-github-block.js';
export * from './embed-github-model.js';
export * from './embed-github-service.js';
export * from './embed-github-spec.js';

declare global {
  namespace BlockSuite {
    interface BlockModels {
      'affine:embed-github': EmbedGithubModel;
    }
    interface BlockServices {
      'affine:embed-github': EmbedGithubBlockService;
    }
  }
}
