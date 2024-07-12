import { type SchemaToModel, defineBlockSchema } from '@blocksuite/store';

export type ParagraphType =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'h6'
  | 'quote'
  | 'text';

export const ParagraphBlockSchema = defineBlockSchema({
  flavour: 'affine:paragraph',
  metadata: {
    parent: [
      'affine:note',
      'affine:database',
      'affine:paragraph',
      'affine:list',
      'affine:edgeless-text',
    ],
    role: 'content',
    version: 1,
  },
  props: internal => ({
    text: internal.Text(),
    type: 'text' as ParagraphType,
  }),
});

export type ParagraphBlockModel = SchemaToModel<typeof ParagraphBlockSchema>;
