import { CodeBlockSchema } from '@blocksuite/affine-model';
import { type BlockSpec, FlavourExtension } from '@blocksuite/block-std';
import { literal } from 'lit/static-html.js';

import type { CodeBlockConfig } from './code-block-config.js';

import { CodeBlockService } from './code-block-service.js';

export const CodeBlockSpec: BlockSpec<
  'codeToolbar' | 'codeLangList',
  CodeBlockConfig
> = {
  schema: CodeBlockSchema,
  view: {
    component: literal`affine-code`,
    widgets: {
      codeToolbar: literal`affine-code-toolbar-widget`,
      codeLangList: literal`affine-code-language-list-widget`,
    },
  },
  extensions: [FlavourExtension('affine:code'), CodeBlockService],
};
