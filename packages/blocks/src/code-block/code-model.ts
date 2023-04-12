import { defineBlockSchema, type SchemaToModel } from '@blocksuite/store';
import { literal } from 'lit/static-html.js';

export const CodeBlockSchema = defineBlockSchema({
  flavour: 'affine:code',
  role: 'content',
  props: internal => ({
    text: internal.Text(),
    language: 'Plain Text',
  }),
  metadata: {
    version: 1,
    tag: literal`affine-code`,
  },
});

export type CodeBlockModel = SchemaToModel<typeof CodeBlockSchema>;
