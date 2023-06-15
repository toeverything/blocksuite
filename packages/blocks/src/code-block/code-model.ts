import { defineBlockSchema, type SchemaToModel } from '@blocksuite/store';

import { FALLBACK_LANG } from './utils/consts.js';

export const CodeBlockSchema = defineBlockSchema({
  flavour: 'affine:code',
  props: internal => ({
    text: internal.Text(),
    language: FALLBACK_LANG,
  }),
  metadata: {
    version: 1,
    role: 'content',
    parent: ['affine:frame', 'affine:paragraph', 'affine:list'],
    children: [],
  },
});

export type CodeBlockModel = SchemaToModel<typeof CodeBlockSchema>;
