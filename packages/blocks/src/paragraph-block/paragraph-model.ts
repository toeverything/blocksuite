import { defineBlockSchema, type SchemaToModel } from '@blocksuite/store';
import { literal } from 'lit/static-html.js';

export const ParagraphBlockSchema = defineBlockSchema(
  'affine:paragraph',
  internal => ({
    type: 'text' as ParagraphType,
    text: internal.Text(),
  }),
  {
    version: 1,
    tag: literal`affine-paragraph`,
  }
);

export type ParagraphBlockModel = SchemaToModel<typeof ParagraphBlockSchema>;
