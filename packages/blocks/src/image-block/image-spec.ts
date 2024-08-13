import type { BlockSpec } from '@blocksuite/block-std';

import { ImageBlockSchema } from '@blocksuite/affine-model';
import { literal } from 'lit/static-html.js';

import { commands } from './commands/index.js';
import { ImageBlockService } from './image-service.js';

export const ImageBlockSpec: BlockSpec = {
  schema: ImageBlockSchema,
  service: ImageBlockService,
  view: {
    component: literal`affine-image`,
    widgets: {
      imageToolbar: literal`affine-image-toolbar-widget`,
    },
  },
  commands,
};
