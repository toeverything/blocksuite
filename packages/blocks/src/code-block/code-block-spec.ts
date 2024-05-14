import type { BlockSpec } from '@blocksuite/block-std';
import { literal } from 'lit/static-html.js';

import { CodeBlockSchema } from './code-model.js';

export const CodeBlockSpec: BlockSpec = {
  schema: CodeBlockSchema,
  view: {
    component: literal`affine-code`,
  },
};
