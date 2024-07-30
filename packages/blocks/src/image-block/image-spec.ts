import type { BlockSpec } from '@blocksuite/block-std';

import { literal } from 'lit/static-html.js';

import { ImageBlockSchema } from './image-model.js';
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
};
