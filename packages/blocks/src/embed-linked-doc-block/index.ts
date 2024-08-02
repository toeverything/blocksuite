import { noop } from '@blocksuite/global/utils';

import type { EmbedLinkedDocModel } from './embed-linked-doc-model.js';
import type { EmbedLinkedDocBlockService } from './embed-linked-doc-service.js';

import {
  EmbedLinkedDocBlockComponent,
  type EmbedLinkedDocBlockConfig,
} from './embed-linked-doc-block.js';
noop(EmbedLinkedDocBlockComponent);

export * from './embed-linked-doc-block.js';
export * from './embed-linked-doc-model.js';
export * from './embed-linked-doc-service.js';
export * from './embed-linked-doc-spec.js';

declare global {
  namespace BlockSuite {
    interface BlockModels {
      'affine:embed-linked-doc': EmbedLinkedDocModel;
    }
    interface BlockServices {
      'affine:embed-linked-doc': EmbedLinkedDocBlockService;
    }
    interface BlockConfigs {
      'affine:embed-linked-doc': EmbedLinkedDocBlockConfig;
    }
  }
}
