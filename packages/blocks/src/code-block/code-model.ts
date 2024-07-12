import type { BundledLanguage, Highlighter, PlainTextLanguage } from 'shiki';

import { type SchemaToModel, defineBlockSchema } from '@blocksuite/store';

import { FALLBACK_LANG } from './utils/consts.js';

export const CodeBlockSchema = defineBlockSchema({
  flavour: 'affine:code',
  metadata: {
    children: [],
    parent: [
      'affine:note',
      'affine:paragraph',
      'affine:list',
      'affine:edgeless-text',
    ],
    role: 'content',
    version: 1,
  },
  props: internal => ({
    caption: '',
    language: FALLBACK_LANG,
    text: internal.Text(),
    wrap: false,
  }),
});

export type CodeBlockModel = SchemaToModel<typeof CodeBlockSchema>;
export type HighlightOptionsGetter = () => {
  highlighter: Highlighter | null;
  lang: BundledLanguage | PlainTextLanguage;
};
