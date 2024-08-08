import type { BlockSpec } from '@blocksuite/block-std';

import { CodeBlockSchema } from '@blocksuite/affine-model';
import { literal } from 'lit/static-html.js';

export const CodeBlockSpec: BlockSpec = {
  schema: CodeBlockSchema,
  view: {
    component: literal`affine-code`,
    widgets: {
      codeToolbar: literal`affine-code-toolbar-widget`,
      codeLangList: literal`affine-code-language-list-widget`,
    },
  },
};
