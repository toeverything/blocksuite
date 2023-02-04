import {
  RichTextType,
  defineBlockSchema,
  SchemaToModel,
} from '@blocksuite/store';
import { literal } from 'lit/static-html.js';

export const ListBlockModelSchema = defineBlockSchema(
  'affine:list',
  () => ({
    type: 'bulleted' as ListType,
    checked: false,
    // hideChildren: false, // Agreed that this doesn't fit in the model/schema
    text: RichTextType,
  }),
  {
    version: 1,
    tag: literal`affine-list`,
  }
);

export type ListBlockModel = SchemaToModel<typeof ListBlockModelSchema>;
