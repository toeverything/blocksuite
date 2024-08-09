import { noop } from '@blocksuite/global/utils';

import type { EmbedGithubBlockService } from './embed-github-service.js';

import { EmbedGithubBlockComponent } from './embed-github-block.js';
noop(EmbedGithubBlockComponent);

export * from './embed-github-block.js';
export * from './embed-github-service.js';
export * from './embed-github-spec.js';

declare global {
  namespace BlockSuite {
    interface BlockServices {
      'affine:embed-github': EmbedGithubBlockService;
    }
  }
}
