import { defineBlockSchema, type SchemaToModel } from '@blocksuite/store';
import { literal } from 'lit/static-html.js';

export const ListBlockModelSchema = defineBlockSchema(
  'affine:list',
  internal => ({
    type: 'bulleted' as ListType,
    text: internal.Text(),
    checked: false,
  }),
  {
    version: 1,
    tag: literal`affine-list`,
  }
);

export type ListBlockModel = SchemaToModel<typeof ListBlockModelSchema>;
