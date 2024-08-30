import type { BlockSpec } from '@blocksuite/block-std';

import { EmbedLatexBlockSchema } from '@blocksuite/affine-model';
import { literal } from 'lit/static-html.js';

export const EmbedLatexBlockSpec: BlockSpec = {
  schema: EmbedLatexBlockSchema,
  view: {
    component: literal`affine-embed-latex-block`,
  },
};
