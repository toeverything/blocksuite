import type { BlockSpec } from '@blocksuite/block-std';

import { CodeBlockSchema } from '@blocksuite/affine-model';
import { literal } from 'lit/static-html.js';

import type { CodeBlockConfig } from './code-block-config.js';

import { CodeBlockService } from './code-block-service.js';

export const CodeBlockSpec: BlockSpec<
  'codeToolbar' | 'codeLangList',
  CodeBlockConfig,
  CodeBlockService
> = {
  schema: CodeBlockSchema,
  view: {
    component: literal`affine-code`,
    widgets: {
      codeToolbar: literal`affine-code-toolbar-widget`,
      codeLangList: literal`affine-code-language-list-widget`,
    },
  },
  service: CodeBlockService,
};
