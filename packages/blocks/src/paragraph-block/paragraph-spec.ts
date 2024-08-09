import type { BlockSpec } from '@blocksuite/block-std';

import { ParagraphBlockSchema } from '@blocksuite/affine-model';
import { literal } from 'lit/static-html.js';

import { ParagraphBlockService } from './paragraph-service.js';

export const ParagraphBlockSpec: BlockSpec = {
  schema: ParagraphBlockSchema,
  view: {
    component: literal`affine-paragraph`,
  },
  service: ParagraphBlockService,
};
