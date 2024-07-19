import type { BlockSpec } from '@blocksuite/block-std';

import { literal } from 'lit/static-html.js';

import { CodeBlockSchema } from './code-model.js';

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
