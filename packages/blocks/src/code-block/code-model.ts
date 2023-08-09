import { defineBlockSchema, type SchemaToModel } from '@blocksuite/store';
import type { Highlighter, Lang } from 'shiki';

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
    parent: ['affine:note', 'affine:paragraph', 'affine:list'],
    children: [],
  },
});

export type CodeBlockModel = SchemaToModel<typeof CodeBlockSchema>;
export type HighlightOptionsGetter =
  | (() => {
      lang: Lang;
      highlighter: Highlighter | null;
    })
  | null;
