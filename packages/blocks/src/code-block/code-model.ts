import { defineBlockSchema, type SchemaToModel } from '@blocksuite/store';
import type { BundledLanguage, Highlighter, PlainTextLanguage } from 'shiki';

import { FALLBACK_LANG } from './utils/consts.js';

export const CodeBlockSchema = defineBlockSchema({
  flavour: 'affine:code',
  props: internal => ({
    text: internal.Text(),
    language: FALLBACK_LANG,
    wrap: false,
  }),
  metadata: {
    version: 1,
    role: 'content',
    parent: ['affine:note', 'affine:paragraph', 'affine:list'],
    children: [],
  },
});

export type CodeBlockModel = SchemaToModel<typeof CodeBlockSchema>;
export type HighlightOptionsGetter = () => {
  lang: BundledLanguage | PlainTextLanguage;
  highlighter: Highlighter | null;
};
