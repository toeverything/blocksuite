import { defineBlockSchema, type SchemaToModel } from '@blocksuite/store';

export type ParagraphType =
  | 'text'
  | 'quote'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'h6';

export const ParagraphBlockSchema = defineBlockSchema({
  flavour: 'affine:paragraph',
  props: internal => ({
    type: 'text' as ParagraphType,
    text: internal.Text(),
  }),
  metadata: {
    version: 1,
    role: 'content',
    parent: [
      'affine:note',
      'affine:database',
      'affine:paragraph',
      'affine:list',
    ],
  },
});

export type ParagraphBlockModel = SchemaToModel<typeof ParagraphBlockSchema>;
