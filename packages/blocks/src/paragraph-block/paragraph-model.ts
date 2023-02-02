import {
  RichTextType,
  defineBlockSchema,
  SchemaToModel,
} from '@blocksuite/store';
import { literal } from 'lit/static-html.js';

export const ParagraphBlockModelSchema = defineBlockSchema(
  'affine:paragraph',
  () => ({
    type: 'text' as ParagraphType,
    text: RichTextType,
  }),
  {
    version: 1,
    tag: literal`affine-paragraph`,
  }
);

export type ParagraphBlockModel = SchemaToModel<
  typeof ParagraphBlockModelSchema
>;
