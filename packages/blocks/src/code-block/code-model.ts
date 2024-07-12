import type { BundledLanguage, Highlighter, PlainTextLanguage } from 'shiki';

import { type SchemaToModel, defineBlockSchema } from '@blocksuite/store';

import { FALLBACK_LANG } from './utils/consts.js';

export const CodeBlockSchema = defineBlockSchema({
  flavour: 'affine:code',
  props: internal => ({
    text: internal.Text(),
    language: FALLBACK_LANG,
    wrap: false,
    caption: '',
  }),
  metadata: {
    version: 1,
    role: 'content',
    parent: [
      'affine:note',
      'affine:paragraph',
      'affine:list',
      'affine:edgeless-text',
    ],
    children: [],
  },
});

export type CodeBlockModel = SchemaToModel<typeof CodeBlockSchema>;
export type HighlightOptionsGetter = () => {
  lang: BundledLanguage | PlainTextLanguage;
  highlighter: Highlighter | null;
};
