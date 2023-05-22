import { defineBlockSchema, type SchemaToModel } from '@blocksuite/store';
import { literal } from 'lit/static-html.js';

type BookmarkProps = {
  link: string;
  // When convert edited link to a bookmark, we need to keep the text to title.
  title?: string;
  summary?: string;
  icon?: string;
  banner?: string;
};

export const BookmarkBlockSchema = defineBlockSchema({
  flavour: 'affine:bookmark',
  props: (internal): BookmarkProps => ({
    link: '',
  }),
  metadata: {
    version: 1,
    role: 'content',
    tag: literal`affine-bookmark`,
    parent: ['affine:frame'],
  },
});

export type BookmarkBlockModel = SchemaToModel<typeof BookmarkBlockSchema>;
