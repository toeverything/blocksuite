import { defineBlockSchema, type SchemaToModel } from '@blocksuite/store';
import { literal } from 'lit/static-html.js';

export const CodeBlockSchema = defineBlockSchema({
  flavour: 'affine:code',
  props: internal => ({
    text: internal.Text(),
    language: 'Plain Text',
  }),
  metadata: {
    version: 1,
    role: 'content',
    tag: literal`affine-code`,
    parent: ['affine:frame', 'affine:paragraph', 'affine:list'],
    children: [],
  },
});

export type CodeBlockModel = SchemaToModel<typeof CodeBlockSchema>;
