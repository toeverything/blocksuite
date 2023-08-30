import { defineBlockSchema, type SchemaToModel } from '@blocksuite/store';

// This type is declared in Affine, this block will move to Affine
type MetaData = {
  bookmarkTitle?: string;
  description?: string;
  icon?: string;
  image?: string;
  [x: string]: string | string[] | undefined | boolean;
};
export type BookmarkProps = {
  url: string;
  caption?: string;
  crawled?: boolean;
} & MetaData;

export const defaultBookmarkProps: BookmarkProps = {
  url: '',
  bookmarkTitle: '',
  description: '',
  icon: '',
  image: '',
  caption: '',
  crawled: false,
};

export const BookmarkBlockSchema = defineBlockSchema({
  flavour: 'affine:bookmark',
  props: (): BookmarkProps => defaultBookmarkProps,
  metadata: {
    version: 1,
    role: 'content',
    parent: ['affine:note'],
  },
});

export type BookmarkBlockModel = SchemaToModel<typeof BookmarkBlockSchema>;
