import { noop } from '@blocksuite/global/utils';

import { EmbedGithubBlockComponent } from './embed-github-block.js';
import type { EmbedGithubService } from './embed-github-service.js';
noop(EmbedGithubBlockComponent);

export * from './embed-github-block.js';
export * from './embed-github-model.js';
export * from './embed-github-service.js';
export * from './embed-github-spec.js';

declare global {
  namespace BlockSuite {
    interface BlockServices {
      'affine:embed-github': EmbedGithubService;
    }
  }
}
