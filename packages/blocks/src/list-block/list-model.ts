import { defineBlockSchema, SchemaToModel } from '@blocksuite/store';
import { literal } from 'lit/static-html.js';

export const ListBlockModelSchema = defineBlockSchema(
  'affine:list',
  internal => ({
    text: internal.Text(),
    type: 'bulleted' as ListType,
    checked: false,
  }),
  {
    version: 1,
    tag: literal`affine-list`,
  }
);

export type ListBlockModel = SchemaToModel<typeof ListBlockModelSchema>;
