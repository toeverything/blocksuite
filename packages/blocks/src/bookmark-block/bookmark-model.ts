import { defineBlockSchema, type SchemaToModel } from '@blocksuite/store';
import { literal } from 'lit/static-html.js';

export const BookmarkBlockSchema = defineBlockSchema({
  flavour: 'affine:bookmark',
  props: internal => ({
    link: '',
  }),
  metadata: {
    version: 1,
    role: 'content',
    tag: literal`affine-bookmark`,
  },
});

export type BookmarkBlockModel = SchemaToModel<typeof BookmarkBlockSchema>;
