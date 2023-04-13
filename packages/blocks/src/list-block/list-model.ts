import { defineBlockSchema, type SchemaToModel } from '@blocksuite/store';
import { literal } from 'lit/static-html.js';

export const ListBlockSchema = defineBlockSchema({
  flavour: 'affine:list',
  props: internal => ({
    type: 'bulleted' as ListType,
    text: internal.Text(),
    checked: false,
  }),
  metadata: {
    version: 1,
    role: 'content',
    tag: literal`affine-list`,
  },
});

export type ListBlockModel = SchemaToModel<typeof ListBlockSchema>;
