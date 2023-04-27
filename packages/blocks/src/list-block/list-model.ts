import { defineBlockSchema, type SchemaToModel } from '@blocksuite/store';
import { literal } from 'lit/static-html.js';

export type ListType = 'bulleted' | 'numbered' | 'todo' | 'toggle';
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
    parent: [
      'affine:frame',
      'affine:database',
      'affine:list',
      'affine:paragraph',
    ],
  },
});

export type ListBlockModel = SchemaToModel<typeof ListBlockSchema>;
