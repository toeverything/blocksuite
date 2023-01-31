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
    open: null, // TODO consider more explicit prop naming like 'hideChildren'
    text: RichTextType,
  }),
  {
    version: 1,
    tag: literal`affine-list`,
  }
);

export type ListBlockModel = SchemaToModel<typeof ListBlockModelSchema>;
